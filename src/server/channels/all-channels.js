/* @flow */

import * as spark from './spark.js';
import * as messenger from './messenger.js';
import * as ms from './ms.js';
import * as web from './web.js';
import * as email from './email.js';
import * as aws from '../../aws/aws.js';
import { waitForAll } from '../../misc/utils.js';
import type { ResponseMessage, BotParams, Conversation } from '../../misc/types.js';
import { CONSTANTS } from '../server-utils.js';
import { toStr, decomposeKeys } from '../../misc/utils.js';
import { coldSend as deepiksColdSend } from '../deepiks-bot/deepiks-bot.js';
import _ from 'lodash';
const reportDebug = require('debug')('deepiks:all-channels');
const reportError = require('debug')('deepiks:all-channels:error');

export const webhooks = {
    messenger: messenger.webhook,
    spark:     spark.webhook,
    ms:        ms.webhook,
    email:     email.webhook
    // web.webhook not here, handled with websocket
};

export async function send(botParams: BotParams, conversation: Conversation,
                           message: ResponseMessage)
{
    const { channel, botId_conversationId, channelData } = conversation;
    const [, conversationId] = decomposeKeys(botId_conversationId);
    let sendFn;
    if (channel === 'messenger') {
        sendFn = m => messenger.send(botParams, conversationId, m);
    } else if (channel === 'ciscospark') {
        sendFn = m => spark.send(botParams, conversationId, m);
    } else if (channel === 'web') {
        sendFn = m => web.send(conversationId, m);
    } else if (['skype', 'slack', 'telegram', 'webchat', 'msteams'].includes(channel)) {
        if (!channelData) {
            throw new Error('send: channelData is missing');
        }
        sendFn = m => ms.coldSend(botParams, conversationId, channelData, m);
    }

    if (!sendFn) {
        throw new Error(`send: unsupported channel ${channel}`);
    }

    await deepiksColdSend(message, botParams, conversation, sendFn);
}

export async function sendToMany(botParams: BotParams, message: ResponseMessage, categories?: string[]) {
    reportDebug('sendAll: botParams: ', botParams, ', message: ', message, ', categories: ', categories);
    let qItems = await aws.dynamoAccumulatePages(
        startKey => aws.dynamoQuery({
            TableName: CONSTANTS.DB_TABLE_CONVERSATIONS,
            KeyConditionExpression: 'publisherId = :pid and begins_with(botId_conversationId, :bid)',
            FilterExpression: 'subscribed <> :s',
            ExclusiveStartKey: startKey,
            ExpressionAttributeValues: {
                ':pid': botParams.publisherId,
                ':bid': botParams.botId,
                ':s': false,
            },
        })
    );

    if (qItems.length === 0) {
        reportDebug('sendAll: no conversation found')
        return;
    }

    if (categories && categories.length > 0) {
        const categoriesLC = categories.map(x => x.toLowerCase());
        const inCategories = x => categoriesLC.find(y => y.toLowerCase);
        qItems = qItems.filter(
            x => x.subscriptions && x.subscriptions.some(y => inCategories(y.toLowerCase))
        );
    }

    reportDebug('sendAll: sending to (showing first 10): ', toStr(qItems.slice(0, 10)));

    await waitForAll(qItems.map(
        x => send(botParams, x, message)
    ));

    reportDebug('sendAll: sent all messages');
}
