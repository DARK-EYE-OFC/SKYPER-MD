import config from '../../config.js';

const getRuntime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const alive = {
    name: 'alive',

    aliases: [
        'status',
        'online'
    ],

    description: 'Check DARK-EYE V2 status',

    category: 'General',

    usage: '.alive',

    execute: async (sock, m) => {

        const uptime =
            getRuntime(process.uptime());

        const message =
            `╭━━━〔 🖤 DARK-EYE V2 〕━━━╮\n` +
            `┃\n` +
            `┃ 🟢 Status   : ONLINE\n` +
            `┃ 🤖 Bot      : ${config.botName}\n` +
            `┃ 📦 Version  : ${config.version}\n` +
            `┃ ⚡ Mode     : ${config.mode}\n` +
            `┃ ⏱️ Uptime   : ${uptime}\n` +
            `┃ 👑 Owner    : ${config.ownerName}\n` +
            `┃\n` +
            `┃ 🛡️ WhatsApp Multi-Device\n` +
            `┃ 🚀 DARK-EYE OFC\n` +
            `┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(
            m.from,
            {
                text: message
            },
            {
                quoted: m.raw
            }
        );
    }
};

export default alive;
