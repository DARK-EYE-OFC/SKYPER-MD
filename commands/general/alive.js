const aliveCommand = {
    name: 'alive',

    aliases: [
        'online',
        'status'
    ],

    category: 'general',

    description:
        'Check whether SKYPER-MD is online.',

    usage:
        '.alive',

    async execute({
        sock,
        m,
        config
    }) {

        try {

            /*
             * ═════════════════════════════════════
             * REACT TO THE COMMAND
             * ═════════════════════════════════════
             */

            await sock.sendMessage(
                m.from,
                {
                    react: {
                        text: '👋🏽',
                        key: m.raw.key
                    }
                }
            );


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

            const owner =
                config?.ownerName ||
                'ALEX THEON';


            /*
             * ═════════════════════════════════════
             * UPTIME
             * ═════════════════════════════════════
             */

            const uptimeSeconds =
                Math.floor(
                    process.uptime()
                );

            const days =
                Math.floor(
                    uptimeSeconds / 86400
                );

            const hours =
                Math.floor(
                    (uptimeSeconds % 86400) /
                    3600
                );

            const minutes =
                Math.floor(
                    (uptimeSeconds % 3600) /
                    60
                );

            const seconds =
                uptimeSeconds % 60;


            /*
             * ═════════════════════════════════════
             * ALIVE MESSAGE
             * ═════════════════════════════════════
             */

            const aliveMessage =
`╭───❒ *SKYPER-MD* ❒───╮
│
│ 👋🏽 *Hello! I'm alive.*
│
│ 🤖 Bot: ${botName}
│ 📦 Version: ${version}
│ 🟢 Status: ONLINE
│
│ ⏱️ Uptime:
│ ${days}d ${hours}h ${minutes}m ${seconds}s
│
│ 👑 Owner: ${owner}
│
│ ⚡ Fast • Smart • Powerful
│ 🛡️ WhatsApp Multi-Device Bot
│
╰────────────────────❒

> *♤powered by DARK-EYE OFC DEV*`;


            /*
             * ═════════════════════════════════════
             * SEND ALIVE MESSAGE
             * ═════════════════════════════════════
             */

            await sock.sendMessage(
                m.from,
                {
                    text: aliveMessage
                },
                {
                    quoted: m.raw
                }
            );

            return true;

        } catch (error) {

            console.error(
                '[ALIVE ERROR]',
                error
            );

            return false;
        }
    }
};

export default aliveCommand;
