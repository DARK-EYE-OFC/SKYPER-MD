// commands/general/ping.js

import config from '../../config.js';

const pingCommand = {
    name: 'ping',

    aliases: [
        'p'
    ],

    category: 'general',

    description:
        'Check bot latency and connection status.',

    usage:
        '.ping',

    async execute({
        sock,
        m
    }) {

        try {

            /*
             * ═════════════════════════════════════
             * REACT WITH ✨
             * ═════════════════════════════════════
             */

            await sock.sendMessage(
                m.from,
                {
                    react: {
                        text: '✨',
                        key: m.raw.key
                    }
                }
            );


            /*
             * ═════════════════════════════════════
             * SEND PINGING MESSAGE
             * ═════════════════════════════════════
             */

            const start =
                Date.now();

            const pingMessage =
                await sock.sendMessage(
                    m.from,
                    {
                        text: 'Pinging...'
                    },
                    {
                        quoted: m.raw
                    }
                );


            /*
             * ═════════════════════════════════════
             * CALCULATE LATENCY
             * ═════════════════════════════════════
             */

            const latency =
                Date.now() - start;


            /*
             * ═════════════════════════════════════
             * EDIT PINGING → PONG
             * ═════════════════════════════════════
             */

            if (
                pingMessage?.key
            ) {

                await sock.sendMessage(
                    m.from,
                    {
                        text: 'Pong 🏓',
                        edit: pingMessage.key
                    }
                );

            } else {

                await sock.sendMessage(
                    m.from,
                    {
                        text: 'Pong 🏓'
                    }
                );
            }


            /*
             * ═════════════════════════════════════
             * LATENCY INFORMATION
             * ═════════════════════════════════════
             */

            const botName =
                config.botName ||
                'SKYPER-MD';

            const version =
                config.version ||
                '2.0.5';

            const message =
`╭───❒ *LATENCY* ❒───╮
│
│ ⚡ Speed: ${latency}ms
│ 🤖 Bot: ${botName}
│ 📦 Version: ${version}
│ 🟢 Status: ONLINE
│
╰─────────────────❒

> *♤powered by DARK-EYE OFC DEV*`;


            /*
             * ═════════════════════════════════════
             * SEND FINAL LATENCY MESSAGE
             * ═════════════════════════════════════
             */

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
                '[PING ERROR]',
                error
            );

            try {

                await sock.sendMessage(
                    m.from,
                    {
                        text:
`❌ *PING ERROR*

${error.message}

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

export default pingCommand;
