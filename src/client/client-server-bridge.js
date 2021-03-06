/* @flow */

import { fetchjp, fetchjp2j, fetchg2j } from './client-utils.js';
import type { DBMessage, ContactFormData, FeedConfig } from '../misc/types.js';
const reportDebug = require('debug')('deepiks:client-server-bridge');
const reportError = require('debug')('deepiks:client-server-bridge:error');

export async function addBot(jwtIdToken: string, botName: string, settings) {
    reportDebug('client-server-bridge addBot:');
    reportDebug('\tjwtIdToken: ', jwtIdToken);
    reportDebug('\tbotName: ', botName);
    reportDebug('\tsettings: ', settings);

    return await fetchjp2j('/api/add-bot', { jwtIdToken, botName, settings })
}

export async function updateBot(jwtIdToken: string, botId: string, settings) {
    reportDebug('client-server-bridge addBot:');
    reportDebug('\tjwtIdToken: ', jwtIdToken);
    reportDebug('\tbotId: ', botId);
    reportDebug('\tsettings: ', settings);

    return await fetchjp2j('/api/update-bot', { jwtIdToken, botId, settings })
}

export async function fetchBots(jwtIdToken: string) {
    reportDebug('fetchBots: jwtIdToken: ', jwtIdToken);
    return await fetchg2j('/api/fetch-bots', { jwtIdToken });
}

export async function fetchBotPublicInfo(publisherId: string, botId: string) {
    return await fetchg2j('/api/fetch-bot-public-info', {publisherId, botId});
}

export async function fetchPolls(jwtIdToken: string, botId: string) {
    return await fetchg2j('/api/fetch-polls', {jwtIdToken, botId});
}

export async function fetchUsers(jwtIdToken: string, botId: string) {
    return await fetchg2j('/api/fetch-users', {jwtIdToken, botId});
}

export async function fetchUser(jwtIdToken: string, botId: string, channel, userId: string) {
    return await fetchg2j('/api/fetch-user', {jwtIdToken, botId, channel, userId});
}

export async function saveUser(
    jwtIdToken: string, botId: string, channel: string,
    userId?: string, email?: string, userRole?: string
) {
    return await fetchjp2j('/api/save-user', {
        jwtIdToken, botId, channel, userId, email, userRole
    });
}

export async function fetchConversations(jwtIdToken: string, botId: string, since: number = 0) {
    reportDebug('fetchConversations: jwtIdToken: ', jwtIdToken, 'botId:', botId, 'since:', since);
    return await fetchg2j('/api/fetch-conversations', { jwtIdToken, botId, since });
}

export async function fetchMessages(jwtIdToken: string, conversationId: string, since: number = 0)
    : Promise<DBMessage[]>
{
    reportDebug('fetchMessages: jwtIdToken: ', jwtIdToken, conversationId);
    return await fetchg2j('/api/fetch-messages', { jwtIdToken, conversationId, since });
}

export async function addBotFeed(jwtIdToken: string, botId: string, feedConfig: FeedConfig) {
    return await fetchjp2j('/api/add-bot-feed', { jwtIdToken, botId, feedConfig });
}

export async function forceSendFeeds(jwtIdToken: string, botId: string) {
    return await fetchjp2j('/api/force-send-feeds', { jwtIdToken, botId });
}

export async function sendEmail(contactFormData: ContactFormData) {
    return await fetchjp2j('/api/send-email', { contactFormData })
}

export async function sendNotification(jwtIdToken: string,
                                       botId: string,
                                       message: string,
                                       categories: string[])
{
    return await fetchjp2j('/api/send-notification', { jwtIdToken, botId, message, categories });
}

export async function createInvitationTokens(jwtIdToken: string, botId: string, count: number) {
    return await fetchjp2j('/api/create-invitation-tokens', { jwtIdToken, botId, count });
}
