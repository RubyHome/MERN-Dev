/* @flow */

import { request, CONSTANTS } from '../server-utils.js';
import { toStr, waitForAll, timeout, composeKeys, decomposeKeys,
         splitTextAtWord, stripMarkdown } from '../../misc/utils.js';
import type { WebhookMessage, ResponseMessage, BotParams } from '../../misc/types.js';
import { deepiksBot } from '../deepiks-bot/deepiks-bot.js';
import * as aws from '../../aws/aws.js';
import type { Request, Response } from 'express';
import _ from 'lodash';
import uuid from 'node-uuid';
import u from 'util';
import crypto from 'crypto';
import createDashbot from 'dashbot';
const reportDebug = require('debug')('deepiks:messenger');
const reportError = require('debug')('deepiks:messenger:error');

type MessengerReqBody = {
    object: string,
    entry: Array<MessengerReqEntry>,
};
type MessengerReqEntry = {
    id: string,
    time: number,
    messaging: Array<MessengerReqMessaging | MessengerReqPostback>
};
type MessengerReqMessaging = {
    sender: {
        id: string,
    },
    recipient: {
        id: string,
    },
    timestamp: number,
    message: {
        mid: string,
        text?: string,
        attachments?: Array<MessengerReqAttachment>
    },
};
type MessengerReqPostback = {
    sender: {
        id: string,
    },
    recipient: {
        id: string,
    },
    timestamp: number,
    postback: {
        payload: string,
    },
};
type MessengerReqAttachment = {
    type: string,
    payload: {
        url: string,
    },
};

export async function webhook(req: Request, res: Response) {
    // webhook verification
    if (req.method === 'GET' &&
        req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === 'boohoo')
    {
        reportDebug('Validating webhook');
        res.send(req.query['hub.challenge']);
        return;
    }


    // security verification
    // see https://developers.facebook.com/docs/messenger-platform/webhook-reference#security
    const sig = req.get('X-Hub-Signature');
    if (!sig) {
        res.status(403).send('Access denied');
        throw new Error('No X-Hub-Signature provided');
    }

    const { publisherId, botId } = req.params;
    const botParams = await aws.getBot(publisherId, botId);
    if (!botParams) {
        throw new Error(`Did not find bot with publisherId ${publisherId} and botId ${botId}`);
    }

    const hmac = crypto.createHmac('sha1', botParams.settings.messengerAppSecret);
    hmac.update(req.rawBody, 'utf-8');
    const expectedSig = 'sha1=' + hmac.digest('hex');

    if (sig !== expectedSig) {
        res.status(403).send('Access denied');
        throw new Error(`ERROR: exprected signatue: ${expectedSig} but received ${sig}`);
    }
    reportDebug(`X-Hub-Signatue successfully verified ${sig}`);


    const body: MessengerReqBody = (req.body: any);

    if (req.method !== 'POST' || body.object !== 'page') {
        res.send();
        return;
    }

    if (botParams.settings.dashbotFacebookKey) {
        const dashbot = createDashbot(botParams.settings.dashbotFacebookKey).facebook;
        dashbot.logIncoming(body);
    }

    // respond immediately
    res.send();
    await processMessages(body, botParams);
}

async function processMessages(body: MessengerReqBody, botParams: BotParams) {
    for (let entry of body.entry) {
        for (let messagingEvent of entry.messaging) {
            if (messagingEvent.optin) {
                // receivedAuthentication(messagingEvent);
            } else if (messagingEvent.message) {
                await receivedMessage(entry, (messagingEvent: any), botParams);
            } else if (messagingEvent.delivery) {
                // receivedDeliveryConfirmation(messagingEvent);
            } else if (messagingEvent.postback) {
                await receivedPostback(entry, (messagingEvent: any), botParams);
            } else {
                reportError('Webhook received unknown messagingEvent: ', messagingEvent);
            }

        }
    }
}

async function receivedPostback(entry: MessengerReqEntry,
                                messagingEvent: MessengerReqPostback,
                                botParams: BotParams)
{
    const m: MessengerReqMessaging = {
        sender: messagingEvent.sender,
        recipient: messagingEvent.recipient,
        timestamp: messagingEvent.timestamp,
        message: {
            mid: uuid.v4(),
            text: messagingEvent.postback.payload,
        },
    };
    return await receivedMessage(entry, m, botParams);
}

async function receivedMessage(entry: MessengerReqEntry,
                               messagingEvent: MessengerReqMessaging,
                               botParams: BotParams)
{
    reportDebug('messenger receivedMessage: ', u.inspect(entry, {depth:null}));
    let userProfile = {};
    try {
        userProfile = await getUserProfile(messagingEvent.sender.id, botParams);
    } catch(error) {
        reportError(error);
    }
    const {attachments} = messagingEvent.message;
    const cards = !attachments ? undefined :
        attachments.filter(x => x.type === 'image')
                   .map(x => ({ imageUrl: x.payload.url }));

    const conversationId = [entry.id, messagingEvent.sender.id].join('::');
    const message: WebhookMessage = {
        publisherId_conversationId:
            composeKeys(botParams.publisherId, conversationId),
        creationTimestamp: new Date(messagingEvent.timestamp).getTime(),
        id: messagingEvent.message.mid,
        senderId: messagingEvent.sender.id,
        senderIsBot: false,
        channel: 'messenger',
        text: messagingEvent.message.text,
        cards,
        senderName: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        senderProfilePic: userProfile.profile_pic || null,
    };

    reportDebug('messenger sending deepiks-bot: ', message);

    let responseCount = 0;
    // will await later
    const sendTypingOnPromise = timeout(CONSTANTS.TYPING_INDICATOR_DELAY_S * 1000)
        .then(() => {
            if (responseCount > 0) return;
            return send(botParams, conversationId, { typingOn: true });
        });

    await deepiksBot(message, botParams, m => {
        responseCount++;
        return send(botParams, conversationId, m);
    });

    await sendTypingOnPromise;
}

export async function send(botParams: BotParams, conversationId: string,
                           message: ResponseMessage)
{
    reportDebug('send: ', conversationId, toStr(message));

    // conversationId is constructed by [pageId, senderId].join('::')
    const [ pageId, to ] = conversationId.split('::');
    const { typingOn, text, cards, actions } = message;

    if (typingOn) {
        await sendHelper(botParams, {
            recipient: {
                id: to,
            },
            sender_action: 'typing_on',
        });
    }

    if (cards) {
        const payloadElements = cards.slice(0,10).map((c, i) => {
            let buttons = c.actions && c.actions.map(a => {
                if (a.url) {
                    return {
                        type: 'web_url',
                        title: a.text,
                        url: a.url,
                    }
                } else { // postback
                    return {
                        type: 'postback',
                        title: a.text,
                        payload: a.postback || a.text,
                    };
                }
            });

            return {
                title: c.title || `${i+1}`,
                subtitle: c.subtitle || null,
                image_url: c.imageUrl || null,
                buttons,
            };
        });
        await sendHelper(botParams, {
            recipient: {
                id: to,
            },
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'generic',
                        elements: payloadElements,
                    }
                }
            }
        });
    }

    const quickReplies = actions && actions.map(x => ({
        content_type: 'text',
        title: x.text,
        payload: x.postback || x.text,
    }));

    let textChunks = splitTextAtWord(text || '', 320);
    let butLast = textChunks.slice(0, -1);
    let last = textChunks[textChunks.length-1];
    for (let m of butLast) {
        await sendHelper(botParams, {
            recipient: {
                id: to,
            },
            message: {
                text: stripMarkdown(m || ' '),
            }
        });
    }
    if (last || quickReplies) {
        await sendHelper(botParams, {
            recipient: {
                id: to,
            },
            message: {
                text: stripMarkdown(last || ' '), // text cannot be empty when using quick_replies
                quick_replies: quickReplies,
            }
        });
    }
}

async function sendHelper(botParams: BotParams, messageData) {
    reportDebug('messenger sendHelper: ',
        u.inspect(messageData, { depth: null}));

    const requestData = {
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: botParams.settings.messengerPageAccessToken },
        method: 'POST',
        json: messageData
    };
    const r = await request(requestData);
    if (botParams.settings.dashbotFacebookKey) {
        const dashbot = createDashbot(botParams.settings.dashbotFacebookKey).facebook;
        dashbot.logOutgoing(requestData, r.body);
    }
    if (r.statusCode !== 200) {
        throw new Error(`Sending message failed with code ${r.statusCode} msg ` +
                        `${r.statusMessage} and body: ${toStr(r.body)}`);
    }
}

async function getUserProfile(userId, botParams) {
    const reqData = {
        uri: `https://graph.facebook.com/v2.6/${userId}`,
        qs: {
            fields: 'first_name,last_name,profile_pic',
            access_token: botParams.settings.messengerPageAccessToken,
        },
        method: 'GET',
        json: true,
    };
    reportDebug('messenger getUserProfile: ', reqData);
    const r = await request(reqData);
    if (r.statusCode !== 200) {
        throw new Error(`getUserProfile failed with code ${r.statusCode} msg ` +
                        `${r.statusMessage} and body: ${toStr(r.body)}`);
    }

    return r.body;
}


/*
{
   'object':'page',
   'entry':[
      {
         'id':'257424221305928',
         'time':1467367307425,
         'messaging':[
            {
               'sender':{
                  'id':'1118266251568559'
               },
               'recipient':{
                  'id':'257424221305928'
               },
               'timestamp':1467367307394,
               'message':{
                  'mid':'mid.1467367307265:c73f5c45afc8caf679',
                  'seq':4,
                  'text':'abc'
               }
            }
         ]
      }
   ]
}
*/


/*
{
   'object':'page',
   'entry':[
      {
         'id':'257424221305928',
         'time':1467367423093,
         'messaging':[
            {
               'sender':{
                  'id':'1118266251568559'
               },
               'recipient':{
                  'id':'257424221305928'
               },
               'timestamp':1467367423049,
               'message':{
                  'mid':'mid.1467367422837:afa89b78048420b743',
                  'seq':5,
                  'attachments':[
                     {
                        'type':'image',
                        'payload':{
                           'url':'https://scontent.xx.fbcdn.net/v/t34.0-12/13563531_262326430826149_1733598955_n.png?_nc_ad=z-m&oh=73ed9d6f37f4f0a8eb7780bdaf3d3ae2&oe=5777BEED'
                        }
                     }
                  ]
               }
            }
         ]
      }
   ]
}
*/
