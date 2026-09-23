const uptimeCommand = {
    name: 'uptime',

    aliases: [
        'up',
        'runtime'
    ],

    category: 'general',

    description:
        'Show SKYPER-MD uptime.',

    usage:
        '.uptime',

    async execute({
        sock,
        m,
        config
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
                        text: '🟢',
                        key: m.raw.key
                    }
                }
            );


            /*
             * ═════════════════════════════════════
             * CALCULATE UPTIME
             * ═════════════════════════════════════
             */

            let totalSeconds =
                Math.floor(
                    process.uptime()
                );

            const days =
                Math.floor(
                    totalSeconds / 86400
                );

            totalSeconds %= 86400;

            const hours =
                Math.floor(
                    totalSeconds / 3600
                );

            totalSeconds %= 3600;

            const minutes =
                Math.floor(
                    totalSeconds / 60
                );

            const seconds =
                totalSeconds % 60;


            /*
             * ═════════════════════════════════════
             * BOT INFORMATION
             * ═════════════════════════════════════
             */

            const botName =
                config?.botName ||
                'SKYPER-MD';

            const version =
                config?.version ||
                '2.0.5';


            /*
             * ═════════════════════════════════════
             * UPTIME MESSAGE
             * ═════════════════════════════════════
             */

            const uptimeMessage =
`╭───❒ *UPTIME* ❒───╮
│
│ 🟢 *SKYPER-MD is ONLINE*
│
│ 🤖 Bot: ${botName}
│ 📦 Version: ${version}
│
│ ⏱️ Uptime:
│ ${days}d ${hours}h ${minutes}m ${seconds}s
│
│ 🟢 Status: ONLINE
│
╰──────────────────❒

> *♤powered by DARK-EYE OFC DEV*`;


            /*
             * ═════════════════════════════════════
             * SEND UPTIME
             * ═════════════════════════════════════
             */

            await sock.sendMessage(
                m.from,
                {
                    text: uptimeMessage
                },
                {
                    quoted: m.raw
                }
            );

            return true;

        } catch (error) {

            console.error(
                '[UPTIME ERROR]',
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
`╭───❒ *UPTIME ERROR* ❒───╮
│
│ ❌️ Failed to retrieve uptime.
│
│ Error:
│ ${error.message}
│
╰─────────────────────────❒

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

export default uptimeCommand;
