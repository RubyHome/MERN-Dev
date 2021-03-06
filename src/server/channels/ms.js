/* @flow */

import { deepiksBot } from '../deepiks-bot/deepiks-bot.js';
import { callbackToPromise, waitForAll, timeout,
         composeKeys, decomposeKeys, splitTextAtWord } from '../../misc/utils.js';
import { request, CONSTANTS } from '../server-utils.js';
import type { WebhookMessage, ResponseMessage, BotParams, ChannelData } from '../../misc/types.js';
import * as aws from '../../aws/aws.js';
import builder from 'botbuilder';
import type { Request, Response } from 'express';
import memoize from 'lodash/memoize';
import { inspect } from 'util';
import _ from 'lodash';
const reportDebug = require('debug')('deepiks:ms');
const reportError = require('debug')('deepiks:ms:error');

const MAX_MS_CAROUSEL_ITEM_COUNT = 5;

export async function webhook(req: Request, res: Response) {
    if (req.method !== 'POST') {
        res.send();
        throw new Error(`req.method is ${req.method}`);
    }
    reportDebug('ms-webhook raw req.body: ', inspect(req.body, {depth:null}));
    reportDebug('ms-webhook raw req.headers: ', inspect(req.headers, {depth:null}));
    const { publisherId, botId } = req.params;
    const botParams = await aws.getBot(publisherId, botId);
    if (!botParams) {
        throw new Error(`Did not find bot with publisherId ${publisherId} and botId ${botId}`);
    }


    const connector = new builder.ChatConnector({
        appId: botParams.settings.microsoftAppId,
        appPassword: botParams.settings.microsoftAppPassword,
    });

    const ubot = new builder.UniversalBot(connector);
    const botListener = connector.listen();
    const authRequest = callbackToPromise(connector.authenticatedRequest, connector);

    ubot.dialog('/', async function(session) {
        try {
            await processMessage(session, authRequest, botParams);
            reportDebug('Success');
        } catch(err) {
            reportError('Error: ', err || '-');
        }
    });

    botListener(req, res);
}

async function processMessage(session, authRequest, botParams) {
    reportDebug('ms-webhook m.sourceEvent: ', inspect(session.message.sourceEvent, {depth:null}));
    reportDebug('ms-webhook session: ', inspect(session, {depth:null}));

    const m = session.message;
    const atts = m.attachments;
    const fetchCardImages_ = !atts ? undefined :
        atts.filter(a => a.contentType && a.contentType.startsWith('image')).map(
            a => memoize(async function () {
                reportDebug('ms-webhook: attachment download requested');
                let buffer;
                // some services such as slack do not accept Authenticated requests
                // for downloading attachments. But some services require it.
                const cid = m.address.channelId;
                reportDebug('ms-webhook, processMessage, channelId: ', cid);
                // perhaps we could use session.message.address.useAuth ?
                if (cid === 'skype') {
                    buffer = await getBinary(authRequest, a.contentUrl);
                } else {
                    buffer = await getBinary(request, a.contentUrl);
                }
                reportDebug('ms-webhook: successfully downloaded attachment');
                return buffer;
            })
        );
    const fetchCardImages = _.isEmpty(fetchCardImages_)
        ? undefined : fetchCardImages_;

    let senderName = m.user.name || '';

    // telegram doesn't set m.user.name
    if (!senderName && m.address.channelId === 'telegram') {
        const firstName =
            _.get(m.sourceEvent, 'message.from.first_name') ||
            _.get(m.sourceEvent, 'callback_query.from.first_name') ||
            '';
        const lastName =
            _.get(m.sourceEvent, 'message.from.last_name') ||
            _.get(m.sourceEvent, 'callback_query.from.last_name') ||
            '';
         senderName = `${firstName} ${lastName}`.trim();
    }

    // work around Microsoft Teams bug
    // remove this after word2vec algorithm for matching inputs
    const text = m.text.replace(/[\u200B-\u200D\uFEFF]/g, '');

    const message: WebhookMessage = {
        publisherId_conversationId:
            composeKeys(botParams.publisherId, m.address.conversation.id),
        creationTimestamp: new Date(m.timestamp).getTime(),
        id: m.address.id,
        senderId: m.user.id,
        senderName: senderName || 'unknown',
        senderIsBot: false,
        channel: m.address.channelId,
        text,
        fetchCardImages,
    };

    reportDebug('ms-webhook: got message: ', message);
    reportDebug('ms-webhook: attachments: ', atts);

    let responseCount = 0;
    // will await later
    const sendTypingOnPromise = timeout(CONSTANTS.TYPING_INDICATOR_DELAY_S * 1000)
        .then(() => {
            if (responseCount > 0) return;
            // TODO return a promise that resolves when sendTyping is sent
            session.sendTyping();
        });

    let dashbotPromise;
    if (botParams.settings.dashbotGenericKey) {
        dashbotPromise = request({
            uri: 'https://tracker.dashbot.io/track',
            qs : {
                type: 'outgoing',
                platform: 'generic',
                apiKey: botParams.settings.dashbotGenericKey,
                v: '0.7.4-rest',
            },
            method: 'POST',
            json: {
                text: message.text,
                userId: m.address.conversation.id,
            }
        });
    }

    await deepiksBot(message, botParams, x => {
        responseCount++;
        return send(botParams, m.address.conversation.id,
                    m.address.channelId, x, y => session.send(y), session);
    }, {
        address: _.omit(m.address, 'user'),
    });

    if (dashbotPromise) await dashbotPromise;
    await sendTypingOnPromise;
};

async function getBinary(requestFn, url) {
    const r = await requestFn({
        url,
        encoding: null,
    });
    if (r.statusCode !== 200 || !r.body) {
        throw new Error(`ms-webhook: attachment download failed with error: ` +
                        `${r.statusCode}, ${r.statusMessage}, \n\turl was: ${url}`)
    }
    return r.body;
}

export async function send(botParams: BotParams,
                           conversationId: string,
                           channel: string,
                           message: ResponseMessage,
                           sendHelperFn: Function, session?: Object)
{
    reportDebug('send: ', message);

    const { text, cards, actions } = message;
    const supportsHeroCard = ['telegram', 'skype', 'slack', 'msteams', 'webchat'].includes(channel);

    if (cards) {
        let resAttachments = [];
        if (supportsHeroCard) {
            resAttachments = cards.map(c => {
                const card = new builder.HeroCard(session);
                c.title && card.title(c.title);
                c.subtitle && card.subtitle(c.subtitle);
                c.imageUrl && card.images([
                    builder.CardImage.create(session, c.imageUrl)
                           .tap(builder.CardAction.showImage(session, c.imageUrl)),
                ]);
                c.actions && card.buttons(c.actions.map(a => {
                    if (a.url) {
                        return builder.CardAction.openUrl(session, a.url, a.text)
                    } else { // postback
                        return builder.CardAction.imBack(session, a.postback || a.text, a.text)
                    }
                }));
                return card;
            })
        } else {
            const CA = builder.CardAction;
            cards.forEach(c => {
                const card = new builder.HeroCard(session);
                c.title && card.title(c.title);
                c.subtitle && card.subtitle(c.subtitle);
                c.imageUrl && card.images([
                    builder.CardImage.create(session, c.imageUrl)
                           .tap(builder.CardAction.showImage(session, c.imageUrl)),
                ]);
                c.actions && card.buttons(c.actions.filter(a => a.fallback || a.url).map(a => {
                    if (a.url) {
                        return new CA(session).type('openUrl').value(a.url).title(a.text)
                    } else { // postback
                        return new CA(session).type('imBack').value(a.fallback).title(a.fallback)
                    }
                }));
                resAttachments.push(card);
                reportDebug('adding card: ', card);
            });
        }

        reportDebug('send: resAttachments: ', resAttachments);

        let resMessage = new builder.Message(session);
        if (resAttachments.length > 1 &&
            resAttachments.length <= MAX_MS_CAROUSEL_ITEM_COUNT &&
            supportsHeroCard)
        {
            resMessage.attachmentLayout(builder.AttachmentLayout.carousel)
        }

        if (resAttachments.length > 0) {
            resMessage.attachments(resAttachments);
            sendHelperFn(resMessage);
        }
    }

    if (text || actions) {
        let resText = text || '',
            resAttachments = [];
        if (actions && supportsHeroCard) {
            const card = new builder.HeroCard(session);
            card.buttons(actions.map(
                a => builder.CardAction.imBack(session, a.postback || a.text, a.text)
            ));
            resAttachments.push(card);
        } else if (actions && !supportsHeroCard) {
            const textActions = actions.filter(a => a.fallback).map(a => a.fallback);
            resText += `\n(${textActions.join(', ')})`;
        }

        // 4000 seems to be a good common denominator
        let textChunks = splitTextAtWord(resText || '', 4000);
        let butLast = textChunks.slice(0, -1);
        let last = textChunks[textChunks.length-1];

        for(let m of butLast) {
            const resM = new builder.Message(session);
            resM.textFormat('markdown');
            resM.text(m);
            sendHelperFn(resM);
            await timeout(200); // TODO artificial delay. Find a better solution
        }
        const resMessage = new builder.Message(session);
        resMessage.textFormat('markdown');
        last && resMessage.text(last);
        resAttachments.length > 0 && resMessage.attachments(resAttachments);
        sendHelperFn(resMessage);
        await dashbotSend(botParams, conversationId, resText || '');
    }
}

export async function coldSend(botParams: BotParams,
                               conversationId: string,
                               channelData: ChannelData,
                               message: ResponseMessage)
{
    reportDebug('coldSend: channelData: ', channelData, ', message: ', message);

    const connector = new builder.ChatConnector({
        appId: botParams.settings.microsoftAppId,
        appPassword: botParams.settings.microsoftAppPassword,
    });

    const ubot = new builder.UniversalBot(connector);
    const sendHelper = m => {
        ubot.send(m.address(channelData.address));
    };

    await send(botParams, conversationId, channelData.address.channelId, message, sendHelper);
}

async function dashbotSend(botParams, conversationId, text) {
    if (!botParams.settings.dashbotGenericKey) return;

    await request({
        uri: 'https://tracker.dashbot.io/track',
        qs : {
            type: 'outgoing',
            platform: 'generic',
            apiKey: botParams.settings.dashbotGenericKey,
            v: '0.7.4-rest',
        },
        method: 'POST',
        json: {
            text: text,
            userId: conversationId,
        }
    });
}

/*
SESSION:
{
    domain: null,
    _events: {
        error: [Function]
    },
    _eventsCount: 1,
    _maxListeners: undefined,
    options: {
        localizer: undefined,
        autoBatchDelay: 250,
        library: Library {
            name: '*',
            dialogs: {
                '/': SimpleDialog {
                    actions: {},
                    fn: [Function: waterfallAction]
                }
            },
            libraries: {
                BotBuilder: Library {
                    name: 'BotBuilder',
                    dialogs: {
                        Prompts: Prompts {
                            actions: {}
                        },
                        FirstRun: SimpleDialog {
                            actions: {},
                            fn: [Function]
                        }
                    },
                    libraries: {}
                }
            }
        },
        actions: ActionSet {
            actions: {}
        },
        middleware: [],
        dialogId: '/',
        dialogArgs: undefined,
        dialogErrorMessage: undefined,
        onSave: [Function],
        onSend: [Function]
    },
    msgSent: false,
    _isReset: false,
    lastSendTime: 1471858121252,
    batch: [],
    batchStarted: false,
    sendingBatch: false,
    inMiddleware: false,
    library: Library {
        name: '*',
        dialogs: {
            '/': SimpleDialog {
                actions: {},
                fn: [Function: waterfallAction]
            }
        },
        libraries: {
            BotBuilder: Library {
                name: 'BotBuilder',
                dialogs: {
                    Prompts: Prompts {
                        actions: {}
                    },
                    FirstRun: SimpleDialog {
                        actions: {},
                        fn: [Function]
                    }
                },
                libraries: {}
            }
        }
    },
    userData: {},
    conversationData: {},
    privateConversationData: {},
    sessionState: {
        callstack: [{
            id: '*:/',
            state: {
                'BotBuilder.Data.WaterfallStep': 0
            }
        }],
        lastAccess: 1471858121252,
        version: 0
    },
    dialogData: {
        'BotBuilder.Data.WaterfallStep': 0
    },
    message: {
        type: 'message',
        timestamp: '2016-08-22T09:28:35.77Z',
        text: 'Hi',
        entities: [],
        attachments: [],
        address: {
            id: '33OpFYkzE98UfhL6',
            channelId: 'skype',
            user: {
                id: '29:1GGw8qcKlcV9r53s3wCeCZyEXb3temStZ9DMXqLYJfMs',
                name: 'Shahab Shirazi'
            },
            conversation: {
                id: '29:1GGw8qcKlcV9r53s3wCeCZyEXb3temStZ9DMXqLYJfMs'
            },
            bot: {
                id: '28:90865d5a-d6dd-49ff-a05f-a0eeb39391ee',
                name: 'Deepiks'
            },
            serviceUrl: 'https://skype.botframework.com',
            useAuth: true
        },
        source: 'skype',
        agent: 'botbuilder',
        user: {
            id: '29:1GGw8qcKlcV9r53s3wCeCZyEXb3temStZ9DMXqLYJfMs',
            name: 'Shahab Shirazi'
        }
    }
}

*/
