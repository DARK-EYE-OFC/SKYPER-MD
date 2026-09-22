const flirtLines = [
    'Are you Wi-Fi? Because I’m really feeling a connection 📶❤️',
    'You must be a notification, because you just made my day light up 🔔😍',
    'If beauty were a command, you would be `.premium` 👑✨',
    'I was going to say something smooth, but then I saw you and forgot everything 😭❤️',
    'Are you a charger? Because you give me energy 🔋❤️',
    'You have no idea how easily you steal attention 😏✨',
    'If smiles were currency, yours would make you a millionaire 😊💰',
    'I think my keyboard has a crush on you... it keeps suggesting your name 😂❤️',
    'Are you a playlist? Because you are exactly my vibe 🎶❤️',
    'I did not believe in love at first sight... then you showed up 👀❤️',
    'You are dangerously good at looking amazing 😍🔥',
    'If I could save one notification forever, it would be yours 📱❤️',
    'You have main-character energy and honestly, I am here for it 🎬👑',
    'My day was normal until you appeared... now it is interesting 😏✨',
    'Are you a sunset? Because you are hard to stop looking at 🌅❤️',
    'I think you just broke my concentration... and I am not even mad 😂❤️',
    'You are the kind of person who makes "just one message" turn into an hour-long chat 😭❤️',
    'If being attractive was a crime, you would need a very good lawyer 😂🔥',
    'I am not saying you are perfect... but you are making a strong case 😏❤️',
    'DARK-EYE V2 officially detected a serious level of charm 👀🔥'
];

const getRandomFlirt = () => {
    return flirtLines[
        Math.floor(Math.random() * flirtLines.length)
    ];
};

const getTarget = (m) => {
    const context =
        m.message?.extendedTextMessage?.contextInfo;

    // Mentioned user
    if (context?.mentionedJid?.length) {
        return context.mentionedJid[0];
    }

    // Quoted user
    if (context?.participant) {
        return context.participant;
    }

    // Default to sender
    return m.sender || m.from;
};

const command = {
    name: 'flirt',

    aliases: [
        'flirtme',
        'flirty',
        'love',
        'romance'
    ],

    category: 'fun',

    description: 'Send a playful flirty line',

    usage: '.flirt [@user]',

    async execute({ sock, m }) {
        const target = getTarget(m);

        const line = getRandomFlirt();

        const targetNumber = String(target)
            .split('@')[0]
            .split(':')[0];

        const text =
`╭━━━〔 💘 FLIRT MODE 〕━━━╮
┃
┃ 🎯 @${targetNumber}
┃
┃ ${line}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

❤️ DARK-EYE V2`;

        return sock.sendMessage(
            m.from,
            {
                text,
                mentions: [target]
            },
            { quoted: m.raw }
        );
    }
};

export {
    flirtLines,
    getRandomFlirt
};

export default command;
