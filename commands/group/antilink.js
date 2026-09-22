// Commands/Group/antilink.js

const settings = new Map();

/*
 * settings:
 * chatId -> {
 *   enabled: true/false,
 *   action: 'delete' | 'warn' | 'kick'
 * }
 */

const DEFAULT_ACTION = 'delete';

const LINK_REGEX = /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|telegram\.me\/|instagram\.com\/|facebook\.com\/|youtube\.com\/|youtu\.be\/|twitter\.com\/|x\.com\/|tiktok\.com\/|discord\.gg\/|discord\.com\/invite\/)/i;

const getSettings = (chatId) => {
    if (!settings.has(chatId)) {
        settings.set(chatId, {
            enabled: false,
            action: DEFAULT_ACTION
        });
    }

    return settings.get(chatId);
};

const isLink = (text = '') => LINK_REGEX.test(text);

const isAdmin = async (sock, chatId, jid) => {
    try {
        const metadata = await sock.groupMetadata(chatId);

        const participant = metadata.participants.find(
            p => p.id === jid
        );

        return Boolean(
            participant &&
            (participant.admin === 'admin' ||
                participant.admin === 'superadmin')
        );
    } catch {
        return false;
    }
};

const isBotAdmin = async (sock, chatId) => {
    try {
        const metadata = await sock.groupMetadata(chatId);

        const botJid = String(sock.user?.id || '')
            .split(':')[0];

        const participant = metadata.participants.find(
            p => p.id.startsWith(botJid)
        );

        return Boolean(
            participant &&
            (participant.admin === 'admin' ||
                participant.admin === 'superadmin')
        );
    } catch {
        return false;
    }
};

const getTargetJid = (m) => {
    const context =
        m.raw?.message?.extendedTextMessage?.contextInfo ||
        m.raw?.message?.imageMessage?.contextInfo ||
        m.raw?.message?.videoMessage?.contextInfo ||
        m.raw?.message?.documentMessage?.contextInfo ||
        {};

    return (
        context.participant ||
        m.sender
    );
};

const deleteMessage = async (sock, m) => {
    try {
        await sock.sendMessage(
            m.from,
            {
                delete: m.raw.key
            }
        );

        return true;
    } catch {
        return false;
    }
};

const kickUser = async (sock, chatId, jid) => {
    try {
        await sock.groupParticipantsUpdate(
            chatId,
            [jid],
            'remove'
        );

        return true;
    } catch {
        return false;
    }
};

const antilink = {
    name: 'antilink',

    aliases: [
        'antilinks',
        'antilinkgroup',
        'linkguard',
        'linkblock'
    ],

    description: 'Automatically handles links sent in groups.',

    usage: '.antilink on | off | status | warn | kick | delete',

    async execute({ sock, m, args }) {
        if (!m.isGroup) {
            return sock.sendMessage(
                m.from,
                {
                    text: '❌ This command can only be used in groups.'
                },
                { quoted: m.raw }
            );
        }

        /*
         * Only group admins can configure Anti-Link.
         */
        const senderIsAdmin = await isAdmin(
            sock,
            m.from,
            m.sender
        );

        if (!senderIsAdmin) {
            return sock.sendMessage(
                m.from,
                {
                    text: '❌ Only group admins can configure Anti-Link.'
                },
                { quoted: m.raw }
            );
        }

        const setting = getSettings(m.from);
        const action = String(args[0] || '').toLowerCase();

        /*
         * STATUS
         */
        if (
            !action ||
            action === 'status'
        ) {
            return sock.sendMessage(
                m.from,
                {
                    text:
`╭━━━〔 🔗 ANTILINK 〕━━━╮
┃
┃ Status: ${setting.enabled ? '🟢 ON' : '🔴 OFF'}
┃ Action: ${setting.action.toUpperCase()}
┃
┃ Available actions:
┃ • delete
┃ • warn
┃ • kick
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

Usage:
.antilink on
.antilink off
.antilink warn
.antilink kick
.antilink delete`
                },
                { quoted: m.raw }
            );
        }

        /*
         * ENABLE
         */
        if (
            action === 'on' ||
            action === 'enable'
        ) {
            setting.enabled = true;

            return sock.sendMessage(
                m.from,
                {
                    text:
`╭━━━〔 🔗 ANTILINK 〕━━━╮
┃
┃ ✅ Anti-Link enabled.
┃
┃ Action: ${setting.action.toUpperCase()}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
                },
                { quoted: m.raw }
            );
        }

        /*
         * DISABLE
         */
        if (
            action === 'off' ||
            action === 'disable'
        ) {
            setting.enabled = false;

            return sock.sendMessage(
                m.from,
                {
                    text:
`╭━━━〔 🔗 ANTILINK 〕━━━╮
┃
┃ 🔴 Anti-Link disabled.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
                },
                { quoted: m.raw }
            );
        }

        /*
         * ACTION
         */
        if (
            action === 'delete' ||
            action === 'warn' ||
            action === 'kick'
        ) {
            if (action === 'kick') {
                const botAdmin = await isBotAdmin(
                    sock,
                    m.from
                );

                if (!botAdmin) {
                    return sock.sendMessage(
                        m.from,
                        {
                            text:
'❌ I need to be a group admin to use the KICK action.'
                        },
                        { quoted: m.raw }
                    );
                }
            }

            setting.action = action;

            return sock.sendMessage(
                m.from,
                {
                    text:
`╭━━━〔 🔗 ANTILINK 〕━━━╮
┃
┃ ⚙️ Action changed.
┃
┃ Action: ${action.toUpperCase()}
┃
┃ Status: ${setting.enabled ? '🟢 ON' : '🔴 OFF'}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
                },
                { quoted: m.raw }
            );
        }

        return sock.sendMessage(
            m.from,
            {
                text:
`❌ Invalid option.

Use:
.antilink on
.antilink off
.antilink status
.antilink delete
.antilink warn
.antilink kick`
            },
            { quoted: m.raw }
        );
    }
};

/*
 * This function is called by Main.js for every incoming
 * group message.
 */
const handleAntiLink = async ({ sock, m }) => {
    if (!m?.isGroup || !m?.text) {
        return false;
    }

    const setting = getSettings(m.from);

    if (!setting.enabled) {
        return false;
    }

    /*
     * Ignore commands.
     */
    if (m.isCommand) {
        return false;
    }

    if (!isLink(m.text)) {
        return false;
    }

    /*
     * Never punish group admins.
     */
    const senderIsAdmin = await isAdmin(
        sock,
        m.from,
        m.sender
    );

    if (senderIsAdmin) {
        return false;
    }

    const botAdmin = await isBotAdmin(
        sock,
        m.from
    );

    /*
     * DELETE
     */
    if (setting.action === 'delete') {
        if (!botAdmin) {
            await sock.sendMessage(
                m.from,
                {
                    text:
'⚠️ Link detected, but I need admin permission to delete it.'
                }
            );

            return true;
        }

        const deleted = await deleteMessage(
            sock,
            m
        );

        if (deleted) {
            await sock.sendMessage(
                m.from,
                {
                    text:
`🚫 @${m.sender.split('@')[0]}, links are not allowed in this group.`,
                    mentions: [m.sender]
                }
            );
        }

        return true;
    }

    /*
     * WARN
     */
    if (setting.action === 'warn') {
        await sock.sendMessage(
            m.from,
            {
                text:
`⚠️ *ANTI-LINK WARNING*

@${m.sender.split('@')[0]}, links are not allowed in this group.

Please remove the link.`,
                mentions: [m.sender]
            }
        );

        return true;
    }

    /*
     * KICK
     */
    if (setting.action === 'kick') {
        if (!botAdmin) {
            await sock.sendMessage(
                m.from,
                {
                    text:
'⚠️ Link detected, but I need admin permission to remove the sender.'
                }
            );

            return true;
        }

        const deleted = await deleteMessage(
            sock,
            m
        );

        const kicked = await kickUser(
            sock,
            m.from,
            m.sender
        );

        if (kicked) {
            await sock.sendMessage(
                m.from,
                {
                    text:
`🚫 @${m.sender.split('@')[0]} was removed.

Reason: Sending links in the group.`,
                    mentions: [m.sender]
                }
            );
        } else if (!deleted) {
            await sock.sendMessage(
                m.from,
                {
                    text:
'❌ I could not remove the user. Check my group admin permissions.'
                }
            );
        }

        return true;
    }

    return false;
};

export {
    settings,
    getSettings,
    isLink,
    isAdmin,
    isBotAdmin,
    handleAntiLink
};

export default antilink;
