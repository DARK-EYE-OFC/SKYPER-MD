import os from 'os';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';

/*
 * ╔══════════════════════════════════════════════╗
 * ║          DARK-EYE V2 MAIN MENU              ║
 * ╚══════════════════════════════════════════════╝
 *
 * All commands created so far are listed here.
 *
 * IMPORTANT:
 * - Commands are arranged A-Z inside categories.
 * - Total command count is calculated automatically.
 * - This menu lists command names, not every alias.
 */

/*
 * COMMAND DATABASE
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
 * Sort every category A-Z.
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
 * Calculate total commands.
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
 * Format uptime.
 */

const formatUptime = (seconds) => {
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
 * Format bytes.
 */

const formatBytes = (
    bytes = 0
) => {
    if (
        !Number.isFinite(
            Number(bytes)
        ) ||
        Number(bytes) <= 0
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

    let size =
        Number(bytes);

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
 * Calculate the size of the bot
 * project directory.
 *
 * This represents approximate
 * local bot storage usage.
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
            /*
             * Avoid counting node_modules,
             * Git data and temporary folders
             * because these can make the
             * menu unnecessarily expensive.
             */

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
 * Build command category text.
 */

const buildCategory = (
    title,
    commands
) => {
    const iconMap = {
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

    const icon =
        iconMap[title] || '📌';

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
 * Build complete menu.
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
┃ 🤖 *Bot name:* ${botName}
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
┃ 🔥 All DARK-EYE V2 commands
┃ 📌 Commands are arranged A-Z
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
        menu += buildCategory(
            category,
            commands
        );
    }

    menu +=
`╭━━━〔 ⚡ DARK-EYE OFC 〕━━━╮
┃
┃ 🚀 DARK-EYE V2
┃ 🛡️ Advanced WhatsApp Multi-Device Bot
┃
┃ 💙 Powered by DARK-EYE OFC
┃ 🔥 Built for speed & power
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

> © ${new Date().getFullYear()} DARK-EYE OFC
> ⚡ DARK-EYE V2 • ${version}`;

    return menu;
};

/*
 * MENU COMMAND
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
        'Display the complete DARK-EYE V2 command menu.',

    usage:
        '.menu',

    async execute({
        sock,
        m
    }) {
        try {
            /*
             * BOT INFORMATION
             */

            const botName =
                config.botName ||
                'DARK-EYE V2';

            const version =
                config.version ||
                '2.0.0';

            const owner =
                config.ownerName ||
                'Theon Alex';

            /*
             * MEMORY
             *
             * RSS = total memory currently
             * held by the Node.js process.
             */

            const memoryUsage =
                process.memoryUsage();

            const memory =
                formatBytes(
                    memoryUsage.rss
                );

            /*
             * STORAGE
             *
             * Approximate project directory
             * size, excluding node_modules
             * and .git.
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
             * UPTIME
             */

            const uptimeData =
                formatUptime(
                    process.uptime()
                );

            const uptime =
`${uptimeData.days} day${uptimeData.days === 1 ? '' : 's'} - ${String(uptimeData.hours).padStart(2, '0')} hours - ${String(uptimeData.minutes).padStart(2, '0')} minutes - ${String(uptimeData.seconds).padStart(2, '0')} seconds`;

            /*
             * RUNTIME
             */

            const runtime =
                `Node.js ${process.version}`;

            /*
             * TOTAL COMMANDS
             */

            const totalCommands =
                getTotalCommands();

            /*
             * BUILD MENU
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
             * BOT IMAGE
             *
             * Project:
             *
             * DARK-EYE-V2/
             * └── Assets/
             *     └── bot_image.jpg
             */

            const imagePath =
                path.resolve(
                    process.cwd(),
                    'Assets',
                    'bot_image.jpg'
                );

            /*
             * Send image if available.
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
             * Fallback if bot image
             * does not exist.
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
                '[MENU ERROR]',
                error
            );

            return sock.sendMessage(
                m.from,
                {
                    text:
`❌ Failed to load the DARK-EYE V2 menu.

Please check:
• Assets/bot_image.jpg
• Command menu configuration
• Bot permissions

⚡ DARK-EYE OFC`
                },
                {
                    quoted: m.raw
                }
            );
        }
    }
};

export {
    commandCategories,
    getTotalCommands,
    formatBytes,
    formatUptime,
    getDirectorySize,
    buildMenu
};

export default menu;
