// Commands/General/menu.js

import fs from 'fs';
import path from 'path';
import config from '../../config.js';

/*
 * ╔══════════════════════════════════════════════╗
 * ║             SKYPER-MD MAIN MENU             ║
 * ╚══════════════════════════════════════════════╝
 *
 * Complete SKYPER-MD command menu.
 *
 * Features:
 * • Commands arranged A-Z
 * • Automatic command count
 * • Memory information
 * • Storage information
 * • Uptime information
 * • Node.js runtime information
 * • Owner information
 * • Automatic bot image
 * • Text fallback if image is missing
 */


/*
 * ═══════════════════════════════════════════════
 * COMMAND DATABASE
 * ═══════════════════════════════════════════════
 */

const commandCategories = {

    AI: [
        'ai',
        'ask',
        'gpt',
        'summarize',
        'translate'
    ],

    Download: [
        'apk',
        'play',
        'song',
        'tiktok',
        'video',
        'ytmp3',
        'ytmp4'
    ],

    Fun: [
        'character',
        'compliment',
        'confused',
        'flirt',
        'gay',
        'goodnight',
        'heart',
        'insult',
        'joke',
        'lolice',
        'passed',
        'rate',
        'roseday',
        'ship',
        'shy',
        'tweet'
    ],

    Games: [
        '8ball',
        'hangman',
        'snake',
        'tictactoe',
        'trivia'
    ],

    General: [
        'alive',
        'calculator',
        'define',
        'jid',
        'menu',
        'news',
        'owner',
        'ping',
        'simage',
        'sticker',
        'weather'
    ],

    Group: [
        'antibadword',
        'antibot',
        'antilink',
        'antimention',
        'antisticker',
        'antitag',
        'demote',
        'goodbye',
        'groupinfo',
        'grouplink',
        'kick',
        'leave',
        'lock',
        'pin',
        'poll',
        'promote',
        'resetlink',
        'setdesc',
        'setgcpic',
        'setgname',
        'setgstatus',
        'staff',
        'tagall',
        'unlock',
        'warn',
        'warnlist',
        'welcome'
    ],

    Owner: [
        'antidelete',
        'getpp',
        'owner',
        'pair',
        'settings',
        'vv',
        'winfo'
    ],

    Search: [
        'aisearch',
        'google',
        'image',
        'wallpaper'
    ],

    Settings: [
        'alwaysoffline',
        'alwaysonline',
        'autoreact',
        'autoread',
        'autorecording',
        'autoreply',
        'autostatusreact',
        'autotyping',
        'autoviewstatus',
        'hidestatusview',
        'mode',
        'setbotname',
        'setlastseen',
        'setprefix'
    ],

    System: [
        'gitzip',
        'repo',
        'restart',
        'update'
    ],

    Textmaker: [
        'box',
        'boxmenu',
        'metallic',
        'proname',
        'textmaker',
        'textstyle'
    ]
};


/*
 * ═══════════════════════════════════════════════
 * SORT COMMANDS A-Z
 * ═══════════════════════════════════════════════
 */

for (
    const category of Object.keys(
        commandCategories
    )
) {

    commandCategories[category].sort(
        (a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    numeric: true,
                    sensitivity: 'base'
                }
            )
    );
}


/*
 * ═══════════════════════════════════════════════
 * TOTAL COMMANDS
 * ═══════════════════════════════════════════════
 */

const getTotalCommands = () => {

    return Object.values(
        commandCategories
    ).reduce(
        (total, commands) =>
            total + commands.length,
        0
    );
};


/*
 * ═══════════════════════════════════════════════
 * FORMAT UPTIME
 * ═══════════════════════════════════════════════
 */

const formatUptime = (
    seconds = 0
) => {

    seconds = Math.floor(
        Number(seconds) || 0
    );

    const days =
        Math.floor(
            seconds / 86400
        );

    seconds %= 86400;

    const hours =
        Math.floor(
            seconds / 3600
        );

    seconds %= 3600;

    const minutes =
        Math.floor(
            seconds / 60
        );

    seconds %= 60;

    return {
        days,
        hours,
        minutes,
        seconds
    };
};


/*
 * ═══════════════════════════════════════════════
 * FORMAT BYTES
 * ═══════════════════════════════════════════════
 */

const formatBytes = (
    bytes = 0
) => {

    const value =
        Number(bytes);

    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {
        return '0 B';
    }

    const units = [
        'B',
        'KB',
        'MB',
        'GB',
        'TB'
    ];

    let size = value;
    let index = 0;

    while (
        size >= 1024 &&
        index <
            units.length - 1
    ) {

        size /= 1024;
        index++;
    }

    return `${size.toFixed(
        index === 0 ? 0 : 2
    )} ${units[index]}`;
};


/*
 * ═══════════════════════════════════════════════
 * CALCULATE PROJECT STORAGE
 * ═══════════════════════════════════════════════
 *
 * node_modules and .git are excluded.
 */

const getDirectorySize = (
    directory
) => {

    let total = 0;

    try {

        const entries =
            fs.readdirSync(
                directory,
                {
                    withFileTypes: true
                }
            );

        for (
            const entry of entries
        ) {

            if (
                entry.name ===
                    'node_modules' ||
                entry.name ===
                    '.git'
            ) {
                continue;
            }

            const fullPath =
                path.join(
                    directory,
                    entry.name
                );

            try {

                if (
                    entry.isDirectory()
                ) {

                    total +=
                        getDirectorySize(
                            fullPath
                        );

                } else {

                    total +=
                        fs.statSync(
                            fullPath
                        ).size;
                }

            } catch {
                // Ignore inaccessible files.
            }
        }

    } catch {
        return 0;
    }

    return total;
};


/*
 * ═══════════════════════════════════════════════
 * CATEGORY ICONS
 * ═══════════════════════════════════════════════
 */

const categoryIcons = {

    AI: '🤖',

    Download: '📥',

    Fun: '🎭',

    Games: '🎮',

    General: '⚙️',

    Group: '👥',

    Owner: '👑',

    Search: '🔎',

    Settings: '🛠️',

    System: '💻',

    Textmaker: '🎨'
};


/*
 * ═══════════════════════════════════════════════
 * BUILD CATEGORY
 * ═══════════════════════════════════════════════
 */

const buildCategory = (
    title,
    commands
) => {

    const icon =
        categoryIcons[title] ||
        '📌';

    const lines =
        commands.map(
            command =>
                `┃ ${icon} .${command}`
        );

    return [
        `╭━━━〔 ${icon} ${title.toUpperCase()} 〕━━━╮`,
        ...lines,
        '╰━━━━━━━━━━━━━━━━━━━━━━╯',
        ''
    ].join('\n');
};


/*
 * ═══════════════════════════════════════════════
 * BUILD COMPLETE MENU
 * ═══════════════════════════════════════════════
 */

const buildMenu = ({
    botName,
    version,
    memory,
    storage,
    uptime,
    runtime,
    owner,
    totalCommands
}) => {

    let menu =
`╭━━━〔 ⚡ ${botName} 〕━━━╮
┃
┃ 🤖 *Bot Name:* ${botName}
┃ 🔢 *Version:* ${version}
┃ 🧠 *Memory:* ${memory}
┃ 💾 *Storage:* ${storage}
┃ ⏱️ *Uptime:* ${uptime}
┃ 💻 *Runtime:* ${runtime}
┃ 👑 *Owner:* ${owner}
┃ 📚 *Total Cmds:* ${totalCommands}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📖 COMMAND MENU 〕━━━╮
┃
┃ ⚡ All ${botName} commands
┃ 📌 Commands arranged A-Z
┃ 🚀 Built for speed & power
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

`;

    for (
        const [
            category,
            commands
        ] of Object.entries(
            commandCategories
        )
    ) {

        menu +=
            buildCategory(
                category,
                commands
            );
    }


    /*
     * SKYPER-MD FOOTER
     */

    menu +=
`╭━━━〔 ⚡ SKYPER-MD 〕━━━╮
┃
┃ 🤖 SKYPER-MD
┃ 🛡️ WhatsApp Multi-Device Bot
┃
┃ ⚡ Fast • Smart • Powerful
┃ 🔥 Built for speed & power
┃
┃ 💙 Powered by DARK-EYE OFC
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

> © ${new Date().getFullYear()} SKYPER-MD
> ⚡ SKYPER-MD • ${version}`;

    return menu;
};


/*
 * ═══════════════════════════════════════════════
 * MENU COMMAND
 * ═══════════════════════════════════════════════
 */

const menu = {

    name: 'menu',

    aliases: [
        'help',
        'commands',
        'command',
        'list',
        'cmds',
        'cmd',
        'menuall',
        'allmenu'
    ],

    description:
        'Display the complete SKYPER-MD command menu.',

    usage:
        '.menu',


    async execute({
        sock,
        m
    }) {

        try {

            /*
             * ═════════════════════════════════════
             * BOT INFORMATION
             * ═════════════════════════════════════
             */

            const botName =
                config.botName ||
                'SKYPER-MD';

            const version =
                config.version ||
                '2.0.0';

            const owner =
                config.ownerName ||
                'ALEX THEON';


            /*
             * ═════════════════════════════════════
             * MEMORY
             * ═════════════════════════════════════
             */

            const memoryUsage =
                process.memoryUsage();

            const memory =
                formatBytes(
                    memoryUsage.rss
                );


            /*
             * ═════════════════════════════════════
             * STORAGE
             * ═════════════════════════════════════
             */

            const projectDirectory =
                path.resolve(
                    process.cwd()
                );

            const storageBytes =
                getDirectorySize(
                    projectDirectory
                );

            const storage =
                formatBytes(
                    storageBytes
                );


            /*
             * ═════════════════════════════════════
             * UPTIME
             * ═════════════════════════════════════
             */

            const uptimeData =
                formatUptime(
                    process.uptime()
                );

            const uptime =
`${uptimeData.days} day${uptimeData.days === 1 ? '' : 's'} - ${String(uptimeData.hours).padStart(2, '0')} hours - ${String(uptimeData.minutes).padStart(2, '0')} minutes - ${String(uptimeData.seconds).padStart(2, '0')} seconds`;


            /*
             * ═════════════════════════════════════
             * NODE.JS RUNTIME
             * ═════════════════════════════════════
             */

            const runtime =
                `Node.js ${process.version}`;


            /*
             * ═════════════════════════════════════
             * TOTAL COMMANDS
             * ═════════════════════════════════════
             */

            const totalCommands =
                getTotalCommands();


            /*
             * ═════════════════════════════════════
             * BUILD MENU
             * ═════════════════════════════════════
             */

            const menuText =
                buildMenu({
                    botName,
                    version,
                    memory,
                    storage,
                    uptime,
                    runtime,
                    owner,
                    totalCommands
                });


            /*
             * ═════════════════════════════════════
             * MENU IMAGE
             * ═════════════════════════════════════
             *
             * Project structure:
             *
             * SKYPER-MD/
             * ├── assets/
             * │   └── bot_image.jpg
             * └── Commands/
             *     └── General/
             *         └── menu.js
             *
             */

            const imagePath =
                path.resolve(
                    process.cwd(),
                    'assets',
                    'bot_image.jpg'
                );


            /*
             * ═════════════════════════════════════
             * SEND IMAGE MENU
             * ═════════════════════════════════════
             */

            if (
                fs.existsSync(
                    imagePath
                )
            ) {

                await sock.sendMessage(
                    m.from,
                    {
                        image: {
                            url: imagePath
                        },
                        caption: menuText
                    },
                    {
                        quoted: m.raw
                    }
                );

                return true;
            }


            /*
             * ═════════════════════════════════════
             * TEXT FALLBACK
             * ═════════════════════════════════════
             */

            await sock.sendMessage(
                m.from,
                {
                    text: menuText
                },
                {
                    quoted: m.raw
                }
            );

            return true;


        } catch (error) {

            console.error(
                '[SKYPER-MD MENU ERROR]',
                error
            );

            try {

                await sock.sendMessage(
                    m.from,
                    {
                        text:
`╭━━━〔 ❌ MENU ERROR 〕━━━╮
┃
┃ Failed to load SKYPER-MD menu.
┃
┃ Please check:
┃ • assets/bot_image.jpg
┃ • Menu configuration
┃ • Bot permissions
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

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


/*
 * ═══════════════════════════════════════════════
 * EXPORTS
 * ═══════════════════════════════════════════════
 */

export {
    commandCategories,
    getTotalCommands,
    formatBytes,
    formatUptime,
    getDirectorySize,
    buildCategory,
    buildMenu
};

export default menu;
