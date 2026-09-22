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

const LINK_REGEX =
    /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|telegram\.me\/|instagram\.com\/|facebook\.com\/|youtube\.com\/|youtu\.be\/|twitter\.com\/|x\.com\/|tiktok\.com\/|discord\.gg\/|discord\.com\/invite\/)/i;


/*
 * Safely normalize a WhatsApp JID.
 *
 * Examples:
 * 263783546271:12@s.whatsapp.net
 * 263783546271@s.whatsapp.net
 *
 * become:
 * 263783546271@s.whatsapp.net
 */
const normalizeJid = (jid) => {
    if (!jid || typeof jid !== 'string') {
        return '';
    }

    try {
        const value = jid.trim();

        if (!value) {
            return '';
        }

        const [userPart, serverPart] =
            value.split('@');

        if (!userPart || !serverPart) {
            return value;
        }

        const user =
            userPart.split(':')[0];

        if (!user) {
            return '';
        }

        return `${user}@${serverPart}`;

    } catch {
        return '';
    }
};


/*
 * Safely get a phone/user number from a JID.
 */
const getJidNumber = (jid) => {
    const normalized =
        normalizeJid(jid);

    if (!normalized) {
        return '';
    }

    return normalized
        .split('@')[0]
        .split(':')[0];
};


/*
 * Safely check whether a participant is an admin.
 */
const participantIsAdmin = (participant) => {
    if (!participant) {
        return false;
    }

    return (
        participant.admin === 'admin' ||
        participant.admin === 'superadmin' ||
        participant.isAdmin === true
    );
};


const getSettings = (chatId) => {
    if (!settings.has(chatId)) {
        settings.set(chatId, {
            enabled: false,
            action: DEFAULT_ACTION
        });
    }

    return settings.get(chatId);
};


const isLink = (text = '') => {
    return LINK_REGEX.test(
        String(text)
    );
};


/*
 * Check whether a user is a group admin.
 *
 * This version avoids unsafe JID comparisons.
 */
const isAdmin = async (
    sock,
    chatId,
    jid
) => {
    try {

        if (!sock || !chatId || !jid) {
            return false;
        }

        const metadata =
            await sock.groupMetadata(
                chatId
            );

        if (
            !metadata ||
            !Array.isArray(
                metadata.participants
            )
        ) {
            return false;
        }

        const targetNumber =
            getJidNumber(jid);

        if (!targetNumber) {
            return false;
        }

        const participant =
            metadata.participants.find(
                participant => {

                    const participantNumber =
                        getJidNumber(
                            participant?.id
                        );

                    return (
                        participantNumber &&
                        participantNumber ===
                            targetNumber
                    );
                }
            );

        return participantIsAdmin(
            participant
        );

    } catch (error) {

        console.error(
            '[ANTILINK] Admin check failed:',
            error.message
        );

        return false;
    }
};


/*
 * Check whether the bot itself is an admin.
 */
const isBotAdmin = async (
    sock,
    chatId
) => {
    try {

        if (!sock || !chatId) {
            return false;
        }

        const metadata =
            await sock.groupMetadata(
                chatId
            );

        if (
            !metadata ||
            !Array.isArray(
                metadata.participants
            )
        ) {
            return false;
        }

        const botJid =
            sock?.user?.id;

        if (!botJid) {
            return false;
        }

        const botNumber =
            getJidNumber(botJid);

        if (!botNumber) {
            return false;
        }

        const participant =
            metadata.participants.find(
                participant => {

                    const participantNumber =
                        getJidNumber(
                            participant?.id
                        );

                    return (
                        participantNumber &&
                        participantNumber ===
                            botNumber
                    );
                }
            );

        return participantIsAdmin(
            participant
        );

    } catch (error) {

        console.error(
            '[ANTILINK] Bot admin check failed:',
            error.message
        );

        return false;
    }
};


/*
 * Safely get the sender JID.
 */
const getTargetJid = (m) => {

    if (!m) {
        return '';
    }

    const context =
        m.raw?.message
            ?.extendedTextMessage
            ?.contextInfo ||
        m.raw?.message
            ?.imageMessage
            ?.contextInfo ||
        m.raw?.message
            ?.videoMessage
            ?.contextInfo ||
        m.raw?.message
            ?.documentMessage
            ?.contextInfo ||
        {};

    return (
        context?.participant ||
        m.sender ||
        ''
    );
};


/*
 * Delete a message.
 */
const deleteMessage = async (
    sock,
    m
) => {

    try {

        if (
            !sock ||
            !m?.from ||
            !m?.raw?.key
        ) {
            return false;
        }

        await sock.sendMessage(
            m.from,
            {
                delete: m.raw.key
            }
        );

        return true;

    } catch (error) {

        console.error(
            '[ANTILINK] Delete failed:',
            error.message
        );

        return false;
    }
};


/*
 * Remove a user from the group.
 */
const kickUser = async (
    sock,
    chatId,
    jid
) => {

    try {

        if (!jid) {
            return false;
        }

        const normalized =
            normalizeJid(jid);

        if (!normalized) {
            return false;
        }

        await sock.groupParticipantsUpdate(
            chatId,
            [normalized],
            'remove'
        );

        return true;

    } catch (error) {

        console.error(
            '[ANTILINK] Kick failed:',
            error.message
        );

        return false;
    }
};


/*
 * ANTI-LINK COMMAND
 */
const antilink = {

    name: 'antilink',

    aliases: [
        'antilinks',
        'antilinkgroup',
        'linkguard',
        'linkblock'
    ],

    description:
        'Automatically handles links sent in groups.',

    usage:
        '.antilink on | off | status | warn | kick | delete',

    async execute({
        sock,
        m,
        args
    }) {

        if (!m?.isGroup) {

            return sock.sendMessage(
                m.from,
                {
                    text:
                        '❌ This command can only be used in groups.'
                },
                {
                    quoted: m.raw
                }
            );
        }


        /*
         * Only group admins can configure Anti-Link.
         */
        const senderIsAdmin =
            await isAdmin(
                sock,
                m.from,
                m.sender
            );

        if (!senderIsAdmin) {

            return sock.sendMessage(
                m.from,
                {
                    text:
                        '❌ Only group admins can configure Anti-Link.'
                },
                {
                    quoted: m.raw
                }
            );
        }


        const setting =
            getSettings(m.from);

        const action =
            String(
                args?.[0] || ''
            ).toLowerCase();


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
                {
                    quoted: m.raw
                }
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
                {
                    quoted: m.raw
                }
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
                {
                    quoted: m.raw
                }
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

                const botAdmin =
                    await isBotAdmin(
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
                        {
                            quoted: m.raw
                        }
                    );
                }
            }

            setting.action =
                action;

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
                {
                    quoted: m.raw
                }
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
            {
                quoted: m.raw
            }
        );
    }
};


/*
 * HANDLE EVERY INCOMING GROUP MESSAGE
 */
const handleAntiLink = async ({
    sock,
    m
}) => {

    try {

        if (
            !m?.isGroup ||
            !m?.text
        ) {
            return false;
        }


        const setting =
            getSettings(m.from);

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
         * Get a safe sender JID.
         */
        const sender =
            normalizeJid(
                getTargetJid(m)
            );

        if (!sender) {

            console.warn(
                '[ANTILINK] Link detected but sender JID is unavailable.'
            );

            return false;
        }


        /*
         * Never punish group admins.
         */
        const senderIsAdmin =
            await isAdmin(
                sock,
                m.from,
                sender
            );

        if (senderIsAdmin) {
            return false;
        }


        const botAdmin =
            await isBotAdmin(
                sock,
                m.from
            );


        /*
         * DELETE
         */
        if (
            setting.action === 'delete'
        ) {

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


            const deleted =
                await deleteMessage(
                    sock,
                    m
                );


            if (deleted) {

                await sock.sendMessage(
                    m.from,
                    {
                        text:
`🚫 @${getJidNumber(sender)}, links are not allowed in this group.`,
                        mentions: [
                            sender
                        ]
                    }
                );
            }

            return true;
        }


        /*
         * WARN
         */
        if (
            setting.action === 'warn'
        ) {

            await sock.sendMessage(
                m.from,
                {
                    text:
`⚠️ *ANTI-LINK WARNING*

@${getJidNumber(sender)}, links are not allowed in this group.

Please remove the link.`,
                    mentions: [
                        sender
                    ]
                }
            );

            return true;
        }


        /*
         * KICK
         */
        if (
            setting.action === 'kick'
        ) {

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


            const deleted =
                await deleteMessage(
                    sock,
                    m
                );


            const kicked =
                await kickUser(
                    sock,
                    m.from,
                    sender
                );


            if (kicked) {

                await sock.sendMessage(
                    m.from,
                    {
                        text:
`🚫 @${getJidNumber(sender)} was removed.

Reason: Sending links in the group.`,
                        mentions: [
                            sender
                        ]
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

    } catch (error) {

        console.error(
            '[ANTILINK ERROR]',
            error
        );

        return false;
    }
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
