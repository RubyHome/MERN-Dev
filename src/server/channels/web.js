/* @flow */

import type {WebhookMessage, ResponseMessage, WebchannelMessage} from '../../misc/types.js';
import {deepiksBot} from '../deepiks-bot/deepiks-bot.js';
import * as aws from '../../aws/aws.js';
import {composeKeys} from '../../misc/utils.js';
import uuid from 'node-uuid';

const reportDebug = require('debug')('deepiks:web');
const reportError = require('debug')('deepiks:web:error');

const conversationIdToWebsocket = {};

async function handleWebsocketMessage(messageReceived: WebchannelMessage, ws: WebSocket) {
    reportDebug('Handling received message', typeof messageReceived, messageReceived);

    //Retrieve bot
    const botParams = await aws.getBot(messageReceived.publisherId, messageReceived.botId);

    //Store the websocket server for the conversationId

    conversationIdToWebsocket[messageReceived.conversationId] = ws;

    const message: WebhookMessage = {
        publisherId_conversationId: composeKeys(botParams.publisherId, messageReceived.conversationId),
        creationTimestamp:          +messageReceived.creationTimestamp,
        id:                         uuid.v1(),
        channel:                    'web',
        senderIsBot:                false,
        senderName:                 'WebChannel user ' + messageReceived.senderId,
        senderId:                   messageReceived.senderId,
        text:                       messageReceived.text,
    };

    if (messageReceived.cards) {
        let cards             = messageReceived.cards;
        messageReceived.cards = undefined;

        message.fetchCardImages = cards.map(
            card => () => new Buffer(card.imageUrl.substr(card.imageUrl.indexOf('base64') + 7), 'base64')
        );
    }

    reportDebug('Got message: ', message);

    try {
        await deepiksBot(message, botParams,
            responseMessage => send(messageReceived.conversationId, responseMessage)
        );
    } catch (e) {
        reportError(e.message);
    }
}

export async function send(conversationId: string, message: ResponseMessage) {
    // TODO use promise
    conversationIdToWebsocket[conversationId].send(JSON.stringify(message));
}

export function websocketMessage(messageReceived: WebchannelMessage, ws: WebSocket) {
    handleWebsocketMessage(messageReceived, ws);
}

