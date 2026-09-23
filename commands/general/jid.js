const jidCommand = {
    name: 'jid',

    aliases: [
        'getjid',
        'id'
    ],

    category: 'general',

    description:
        'Get the WhatsApp JID of a user, group, or quoted message.',

    usage:
        '.jid',

    async execute({
        sock,
        m
    }) {

        try {

            /*
             * ═════════════════════════════════════
             * SUCCESS REACTION
             * ═════════════════════════════════════
             */

            await sock.sendMessage(
                m.from,
                {
                    react: {
                        text: '✅️',
                        key: m.raw.key
                    }
                }
            );


            /*
             * ═════════════════════════════════════
             * FIND TARGET JID
             * ═════════════════════════════════════
             */

            let targetJid = m.sender;

            /*
             * If the command is used by replying
             * to another message, get that user's JID.
             */

            const contextInfo =
                m.raw?.message
                    ?.extendedTextMessage
                    ?.contextInfo;

            if (
                contextInfo?.participant
            ) {
                targetJid =
                    contextInfo.participant;
            }


            /*
             * Mentioned user
             */

            if (
                Array.isArray(
                    contextInfo?.mentionedJid
                ) &&
                contextInfo.mentionedJid.length
            ) {
                targetJid =
                    contextInfo.mentionedJid[0];
            }


            /*
             * Make sure a JID exists.
             */

            if (!targetJid) {
                throw new Error(
                    'Could not determine the target JID.'
                );
            }


            /*
             * ═════════════════════════════════════
             * JID INFORMATION
             * ═════════════════════════════════════
             */

            const jid =
                String(targetJid);

            const number =
                jid
                    .split('@')[0]
                    .split(':')[0];


            /*
             * ═════════════════════════════════════
             * SEND JID
             * ═════════════════════════════════════
             */

            const message =
`╭───❒ *JID INFORMATION* ❒───╮
│
│ 👤 *Number:* ${number}
│
│ 🆔 *JID:*
│ ${jid}
│
│ 📍 *Chat:*
│ ${m.from}
│
╰──────────────────────────❒

> *♤powered by DARK-EYE OFC DEV*`;


            await sock.sendMessage(
                m.from,
                {
                    text: message
                },
                {
                    quoted: m.raw
                }
            );

            return true;

        } catch (error) {

            console.error(
                '[JID ERROR]',
                error
            );


            /*
             * ═════════════════════════════════════
             * ERROR REACTION
             * ═════════════════════════════════════
             */

            try {

                await sock.sendMessage(
                    m.from,
                    {
                        react: {
                            text: '❌️',
                            key: m.raw.key
                        }
                    }
                );

            } catch {}


            /*
             * ═════════════════════════════════════
             * ERROR MESSAGE
             * ═════════════════════════════════════
             */

            try {

                await sock.sendMessage(
                    m.from,
                    {
                        text:
`╭───❒ *JID ERROR* ❒───╮
│
│ ❌️ Failed to get JID.
│
│ Error:
│ ${error.message}
│
╰─────────────────────❒

> *♤powered by DARK-EYE OFC DEV*`
                    },
                    {
                        quoted: m.raw
                    }
                );

            } catch {}

            return false;
        }
    }
};

export default jidCommand;
