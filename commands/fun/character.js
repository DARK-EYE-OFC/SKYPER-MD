const characters = [
    {
        name: 'The Leader 👑',
        description: 'Born to take charge and somehow ends up leading every group chat.'
    },
    {
        name: 'The Comedian 😂',
        description: 'Can turn almost any situation into a joke.'
    },
    {
        name: 'The Mysterious One 🥷',
        description: 'Quiet, unpredictable, and always keeping everyone guessing.'
    },
    {
        name: 'The Lover ❤️',
        description: 'Lives for romance, sweet messages, and beautiful vibes.'
    },
    {
        name: 'The Hustler 💰',
        description: 'Always thinking about the next move and chasing bigger goals.'
    },
    {
        name: 'The Dreamer 🌌',
        description: 'Has a big imagination and dreams bigger than the sky.'
    },
    {
        name: 'The Adventurer 🌍',
        description: 'Always ready for something new, exciting, and slightly dangerous.'
    },
    {
        name: 'The Genius 🧠',
        description: 'Always has an answer, even when nobody asked.'
    },
    {
        name: 'The Chaos Agent 🔥',
        description: 'Wherever they go, something interesting is guaranteed to happen.'
    },
    {
        name: 'The Chill One 😎',
        description: 'Rarely stressed and somehow stays calm when everyone else is panicking.'
    },
    {
        name: 'The Main Character 🎬',
        description: 'Walks through life like every moment belongs in a movie.'
    },
    {
        name: 'The Protector 🛡️',
        description: 'Loyal, dependable, and always ready to stand up for their people.'
    },
    {
        name: 'The Boss 💼',
        description: 'Professional energy with serious "I got this" confidence.'
    },
    {
        name: 'The Rockstar 🎸',
        description: 'Brings energy, style, and unforgettable vibes everywhere.'
    },
    {
        name: 'The Night Owl 🌙',
        description: 'Most active when everyone else is already asleep.'
    },
    {
        name: 'The Optimist ☀️',
        description: 'Always finds something positive even when things get difficult.'
    },
    {
        name: 'The Savage 😈',
        description: 'Has absolutely no shortage of comebacks.'
    },
    {
        name: 'The Soft Soul 🫶',
        description: 'Kind-hearted, caring, and secretly emotional.'
    },
    {
        name: 'The Strategist ♟️',
        description: 'Thinks several moves ahead before making a decision.'
    },
    {
        name: 'The Legend 🐐',
        description: 'Rare character unlocked. Extremely difficult to replace.'
    }
];

const getRandomCharacter = () => {
    return characters[
        Math.floor(Math.random() * characters.length)
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
    name: 'character',

    aliases: [
        'char',
        'personality',
        'person',
        'type',
        'charactercheck'
    ],

    category: 'fun',

    description: 'Generate a random character profile',

    usage: '.character [@user]',

    async execute({ sock, m }) {
        const target = getTarget(m);
        const character = getRandomCharacter();

        const targetNumber = String(target)
            .split('@')[0]
            .split(':')[0];

        const text =
`╭━━━〔 🎭 CHARACTER CHECK 〕━━━╮
┃
┃ 🎯 @${targetNumber}
┃
┃ 🎭 Character:
┃ ${character.name}
┃
┃ 📖 Description:
┃ ${character.description}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🔥 DARK-EYE V2`;

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
    characters,
    getRandomCharacter
};

export default command;
