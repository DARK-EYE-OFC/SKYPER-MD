import fs from 'fs'
import express from 'express'
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers
} from '@whiskeysockets/baileys'
import P from 'pino'
import axios from 'axios'
import pkg from 'wa-sticker-formatter'
const { Sticker, StickerTypes } = pkg
import QRCode from 'qrcode'
import moment from 'moment'
import yts from 'yt-search'
import ytdl from 'ytdl-core'

// ============================================================
// SKYPER-MD
// DARK-EYE OFC DEV
// Version 2.0.5
// ============================================================

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT || 10000
const DASHBOARD_URL = 'https://skyper-md.onrender.com'

let sock = null
let latestCode = 'Waiting for bot to start...'

global.totalCommands = 0

// ============================================================
// CONFIG
// ============================================================

const config = {
    prefix: '.',
    ownerName: 'DARK-EYE OFC DEV',
    ownerNumber: '263783546271',
    botName: 'SKYPER-MD',
    version: '2.0.5',
    mode: 'public',

    watermark: '> *♤powered by DARK-EYE OFC DEV*',

    apiKeys: {
        openweather: process.env.OPENWEATHER_API_KEY || '',
        removebg: process.env.REMOVEBG_API_KEY || '',
        lovable: process.env.LOVABLE_API_KEY || '',
        unsplash: process.env.UNSPLASH_API_KEY || '',
        news: process.env.NEWS_API_KEY || ''
    }
}

const WM = config.watermark
const PREFIX = config.prefix
const OWNER = config.ownerName
const OWNER_NUM = config.ownerNumber
const VERSION = config.version
const OWNER_JID = `${OWNER_NUM}@s.whatsapp.net`

// ============================================================
// DATABASE
// ============================================================

const dbDir = './database'
const tmpDir = './tmp'

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
}

if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
}

const ecoFile = `${dbDir}/economy.json`
const settingsFile = `${dbDir}/settings.json`

if (!fs.existsSync(ecoFile)) {
    fs.writeFileSync(ecoFile, '{}')
}

if (!fs.existsSync(settingsFile)) {
    fs.writeFileSync(settingsFile, '{}')
}

let economy = JSON.parse(fs.readFileSync(ecoFile, 'utf8'))

let BOT_SETTINGS = JSON.parse(
    fs.readFileSync(settingsFile, 'utf8')
)

// Make sure required settings always exist
BOT_SETTINGS.afk ??= {}
BOT_SETTINGS.mode ??= config.mode
BOT_SETTINGS.darkeye ??= false

let groupSettings = {}
let warns = {}

const saveEco = () => {
    fs.writeFileSync(
        ecoFile,
        JSON.stringify(economy, null, 2)
    )
}

const saveSettings = () => {
    fs.writeFileSync(
        settingsFile,
        JSON.stringify(BOT_SETTINGS, null, 2)
    )
}

saveSettings()

// ============================================================
// HELPERS
// ============================================================

const boxMenu = (title, lines = []) => {
    let text = `╭───❒「 *${title}* 」❒───╮\n`

    for (const line of lines) {
        text += `│≈♤ ${line}\n`
    }

    text += `╰────────────────────❒`

    return text
}

function formatUptime(seconds) {
    seconds = Math.floor(seconds)

    const days = Math.floor(seconds / 86400)
    seconds %= 86400

    const hours = Math.floor(seconds / 3600)
    seconds %= 3600

    const minutes = Math.floor(seconds / 60)
    seconds %= 60

    const parts = []

    if (days) parts.push(`${days}d`)
    if (hours) parts.push(`${hours}h`)
    if (minutes) parts.push(`${minutes}m`)

    parts.push(`${seconds}s`)

    return parts.join(' ')
}

const downloadMedia = async (msg) => {
    return await sock.downloadMediaMessage(msg)
}

function getUser(id) {
    if (!economy[id]) {
        economy[id] = {
            balance: 1000,
            xp: 0,
            level: 1,
            inventory: [],
            lastDaily: 0,
            lastWork: 0,
            lastWeekly: 0
        }
    }

    return economy[id]
}

function addXP(id, amount) {
    const user = getUser(id)

    user.xp += amount
    user.level = Math.floor(user.xp / 100) + 1

    saveEco()
}

async function askAI(prompt) {
    if (!config.apiKeys.lovable) {
        return 'AI API key is not configured.'
    }

    try {
        const res = await axios.post(
            config.apiKeys.lovable,
            {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            },
            {
                timeout: 30000
            }
        )

        return (
            res.data?.reply ||
            res.data?.response ||
            res.data?.choices?.[0]?.message?.content ||
            'No response.'
        )
    } catch (e) {
        return `AI Error: ${e.message}`
    }
}

function toSeconds(timestamp) {
    const parts = timestamp.split(':').map(Number)

    if (parts.length === 3) {
        return (
            parts[0] * 3600 +
            parts[1] * 60 +
            parts[2]
        )
    }

    return parts[0] * 60 + parts[1]
}

// ============================================================
// EXPRESS / DASHBOARD
// ============================================================

app.get('/', (req, res) => {
    const file = './public/dashboard.html'

    if (fs.existsSync(file)) {
        return res.sendFile(file, { root: '.' })
    }

    res.send(`
        <html>
        <head>
            <title>${config.botName}</title>
        </head>
        <body style="background:#111;color:white;font-family:Arial;text-align:center;padding:50px">
            <h1>🤖 ${config.botName}</h1>
            <p>WhatsApp Multi-Device Bot</p>
            <p>Status: ${sock?.user ? 'ONLINE ✅' : 'STARTING...'}</p>
        </body>
        </html>
    `)
})

// ============================================================
// PAIR PAGE
// ============================================================

app.get('/pair', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
<title>${config.botName} Pair Code</title>

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<style>

body{
    font-family:Arial;
    background:#0f0f0f;
    color:white;
    text-align:center;
    padding:20px;
}

.box{
    background:#1a1a1a;
    padding:30px;
    border-radius:20px;
    max-width:400px;
    margin:auto;
}

input{
    width:90%;
    padding:12px;
    margin:10px 0;
    border-radius:10px;
    border:none;
    background:#2a2a2a;
    color:white;
}

button{
    width:95%;
    padding:12px;
    margin:10px 0;
    border-radius:10px;
    border:none;
    background:black;
    color:white;
    font-weight:bold;
    cursor:pointer;
}

.code{
    background:#2a2a2a;
    padding:15px;
    border-radius:10px;
    margin:10px 0;
    font-size:20px;
}

</style>
</head>

<body>

<div class="box">

<h2>🤖 ${config.botName}</h2>

<p>Link your WhatsApp device</p>

<form action="/pair" method="POST">

<input
type="text"
name="number"
placeholder="+263783546271"
required
>

<button type="submit">
🔑 Generate Pair Code
</button>

</form>

<div class="code">
${latestCode}
</div>

<button onclick="
navigator.clipboard.writeText(
document.querySelector('.code').innerText
)">
📋 Copy Code
</button>

<p style="font-size:12px">
© 2026 ${config.ownerName}
</p>

</div>

</body>
</html>
`)
})

app.post('/pair', async (req, res) => {
    let number = req.body.number || ''

    number = number.replace(/[^0-9]/g, '')

    if (!number) {
        latestCode = 'Invalid number'
        return res.redirect('/pair')
    }

    if (!sock) {
        latestCode = 'Bot is still starting...'
        return res.redirect('/pair')
    }

    try {
        const code = await sock.requestPairingCode(number)

        latestCode =
            code.match(/.{1,4}/g)?.join('-') ||
            code

        console.log(
            `Pairing code generated for ${number}: ${latestCode}`
        )

        res.redirect('/pair')

    } catch (e) {

        console.error('Pairing error:', e)

        latestCode = `Error: ${e.message}`

        res.redirect('/pair')
    }
})

// ============================================================
// API
// ============================================================

app.get('/api/insights', async (req, res) => {

    res.json({
        users: Object.keys(economy).length,
        ttlBots: 1,
        onlineBots: sock?.user ? 1 : 0,
        speed: `${Math.floor(Math.random() * 50 + 50)}ms`,
        ttlCmds: global.totalCommands,
        uptime: process.uptime()
    })
})

app.post('/api/command', (req, res) => {

    global.totalCommands++

    res.json({
        status: 'ok'
    })
})

app.post('/api/add-user', (req, res) => {

    if (req.body?.number) {
        getUser(req.body.number)
        saveEco()
    }

    res.json({
        status: 'ok'
    })
})

// ============================================================
// START WEB SERVER
// ============================================================

app.listen(PORT, () => {
    console.log(`Web server on port ${PORT}`)
})

// ============================================================
// START WHATSAPP
// ============================================================

async function startBot() {

    try {

        console.log('🔌 Starting WhatsApp connection...')

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState('session')

        const {
            version
        } = await fetchLatestBaileysVersion()

        sock = makeWASocket({

            version,

            logger: P({
                level: 'error'
            }),

            auth: state,

            browser: Browsers.ubuntu('Firefox'),

            markOnlineOnConnect: true,

            syncFullHistory: false

        })

        sock.ev.on(
            'creds.update',
            saveCreds
        )

        // ====================================================
        // CONNECTION
        // ====================================================

        sock.ev.on(
            'connection.update',
            async (update) => {

                const {
                    connection,
                    lastDisconnect
                } = update

                if (connection === 'close') {

                    const statusCode =
                        lastDisconnect?.error?.output?.statusCode

                    console.log(
                        `WhatsApp connection closed. Code: ${statusCode}`
                    )

                    const shouldReconnect =
                        statusCode !== DisconnectReason.loggedOut

                    if (shouldReconnect) {

                        console.log(
                            '🔄 Reconnecting in 3 seconds...'
                        )

                        setTimeout(
                            startBot,
                            3000
                        )
                    }

                } else if (connection === 'open') {

                    console.log(
                        `${config.botName} IS CONNECTED ✅`
                    )

                    try {

                        const number =
                            sock.user?.id
                                ?.split(':')[0]
                                ?.replace('@s.whatsapp.net', '')

                        await axios.post(
                            `${DASHBOARD_URL}/api/add-user`,
                            {
                                number,
                                name:
                                    sock.user?.name ||
                                    'Unknown'
                            }
                        )

                    } catch (e) {

                        console.log(
                            'Dashboard sync skipped:',
                            e.message
                        )
                    }
                }
            }
        )

        // ====================================================
        // GROUP PARTICIPANTS
        // ====================================================

        sock.ev.on(
            'group-participants.update',
            async (update) => {

                try {

                    if (
                        !groupSettings[update.id]?.welcome
                    ) {
                        return
                    }

                    const meta =
                        await sock.groupMetadata(
                            update.id
                        )

                    for (
                        const participant
                        of update.participants
                    ) {

                        if (update.action === 'add') {

                            const pp =
                                await sock
                                    .profilePictureUrl(
                                        participant,
                                        'image'
                                    )
                                    .catch(
                                        () =>
                                            'https://i.imgur.com/2WZl0Q3.png'
                                    )

                            await sock.sendMessage(
                                update.id,
                                {
                                    image: {
                                        url: pp
                                    },

                                    caption:
                                        boxMenu(
                                            'WELCOME',
                                            [
                                                `Welcome to ${meta.subject}`,
                                                `You are member no: ${meta.participants.length}`
                                            ]
                                        ) +
                                        `\n${WM}`,

                                    mentions: [
                                        participant
                                    ]
                                }
                            )
                        }

                        if (
                            update.action ===
                            'remove'
                        ) {

                            const pp =
                                await sock
                                    .profilePictureUrl(
                                        participant,
                                        'image'
                                    )
                                    .catch(
                                        () =>
                                            'https://i.imgur.com/2WZl0Q3.png'
                                    )

                            await sock.sendMessage(
                                update.id,
                                {
                                    image: {
                                        url: pp
                                    },

                                    caption:
                                        boxMenu(
                                            'GOODBYE',
                                            [
                                                `Goodbye @${participant.split('@')[0]}`,
                                                `We will miss you from ${meta.subject}`
                                            ]
                                        ) +
                                        `\n${WM}`,

                                    mentions: [
                                        participant
                                    ]
                                }
                            )
                        }
                    }

                } catch (e) {

                    console.error(
                        'Group participant error:',
                        e
                    )
                }
            }
        )

        // ====================================================
        // MESSAGE HANDLER
        // ====================================================

        sock.ev.on(
            'messages.upsert',
            async ({ messages }) => {

                try {

                    if (
                        !messages?.length ||
                        !messages[0]?.message
                    ) {
                        return
                    }

                    const m = messages[0]

                    if (m.key.fromMe) {
                        return
                    }

                    if (
                        m.key.remoteJid ===
                        'status@broadcast'
                    ) {
                        return
                    }

                    const from =
                        m.key.remoteJid

                    const sender =
                        m.key.participant ||
                        m.key.remoteJid

                    const body =
                        m.message?.conversation ||
                        m.message?.extendedTextMessage?.text ||
                        m.message?.imageMessage?.caption ||
                        m.message?.videoMessage?.caption ||
                        m.message?.documentMessage?.caption ||
                        ''

                    const isCmd =
                        body.startsWith(PREFIX)

                    const args =
                        body
                            .slice(PREFIX.length)
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean)

                    const cmd =
                        args.shift()?.toLowerCase()

                    const reply = (
                        text,
                        opts = {}
                    ) =>
                        sock.sendMessage(
                            from,
                            {
                                text,
                                ...opts
                            },
                            {
                                quoted: m
                            }
                        )

                    const isOwner =
                        sender === OWNER_JID

                    const isGroup =
                        from.endsWith('@g.us')

                    const isAdmin = async () => {

                        if (!isGroup) {
                            return false
                        }

                        const meta =
                            await sock
                                .groupMetadata(from)
                                .catch(
                                    () => null
                                )

                        if (!meta) {
                            return false
                        }

                        const participant =
                            meta.participants.find(
                                p =>
                                    p.id ===
                                    sender
                            )

                        return Boolean(
                            participant?.admin
                        )
                    }

                    // =================================================
                    // AFK
                    // =================================================

                    BOT_SETTINGS.afk ??= {}

                    if (
                        BOT_SETTINGS.afk[sender]
                    ) {

                        delete BOT_SETTINGS.afk[
                            sender
                        ]

                        saveSettings()

                        await reply(
                            boxMenu(
                                'WELCOME BACK',
                                [
                                    'You are no longer AFK'
                                ]
                            ) +
                            `\n${WM}`
                        )
                    }

                    const mentionedJid =
                        m.message
                            ?.extendedTextMessage
                            ?.contextInfo
                            ?.mentionedJid || []

                    if (
                        mentionedJid.length
                    ) {

                        for (
                            const jid
                            of mentionedJid
                        ) {

                            if (
                                BOT_SETTINGS.afk[jid]
                            ) {

                                const afk =
                                    BOT_SETTINGS.afk[jid]

                                const time =
                                    Math.floor(
                                        (
                                            Date.now() -
                                            afk.time
                                        ) /
                                        1000 /
                                        60
                                    )

                                await reply(
                                    boxMenu(
                                        'AFK',
                                        [
                                            `@${jid.split('@')[0]} is AFK`,
                                            `Reason: ${afk.reason}`,
                                            `For: ${time} minutes`
                                        ]
                                    ) +
                                    `\n${WM}`,
                                    {
                                        mentions: [
                                            jid
                                        ]
                                    }
                                )
                            }
                        }
                    }

                    // =================================================
                    // ANTILINK
                    // =================================================

                    if (
                        isGroup &&
                        groupSettings[from]?.antilink &&
                        body.includes(
                            'chat.whatsapp.com'
                        )
                    ) {

                        if (await isAdmin()) {
                            return
                        }

                        await sock.sendMessage(
                            from,
                            {
                                delete: m.key
                            }
                        )

                        await reply(
                            boxMenu(
                                'ANTILINK',
                                [
                                    'WhatsApp group links are not allowed.'
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    if (!isCmd) {
                        return
                    }

                    global.totalCommands++

                    // =================================================
                    // DASHBOARD COMMAND COUNTER
                    // =================================================

                    try {

                        await axios.post(
                            `${DASHBOARD_URL}/api/command`,
                            {}
                        )

                    } catch (e) {}

                    // =================================================
                    // MENU
                    // =================================================

                    if (cmd === 'menu') {

                        const uptime =
                            formatUptime(
                                process.uptime()
                            )

                        const menu = `*╔═══❰ SKYPER-MD ❱═══╗*
*║* 👑 *OWNER:* @${OWNER_NUM}
*║* 🤖 *VERSION:* ${VERSION}
*║* ⚖️ *UPTIME:* ${uptime}
*╚══════════════════╝*

*╭───❰ OWNER ❱───╮*
│ ${PREFIX}mode
│ ${PREFIX}public
│ ${PREFIX}private
│ ${PREFIX}groups
│ ${PREFIX}inbox
*╰────────────╯*

*╭───❰ SYSTEM ❱───╮*
│ ${PREFIX}alive
│ ${PREFIX}ping
│ ${PREFIX}uptime
│ ${PREFIX}update
│ ${PREFIX}repo
│ ${PREFIX}menu
*╰─────────────╯*

*╭────❰ GROUP ❱────╮*
│ ${PREFIX}glink
│ ${PREFIX}tagall
│ ${PREFIX}groupinfo
│ ${PREFIX}listadmin
│ ${PREFIX}kick
│ ${PREFIX}close
│ ${PREFIX}open
│ ${PREFIX}setgname
│ ${PREFIX}del
│ ${PREFIX}antilink
│ ${PREFIX}antimention
*╰────────────╯*

*╭────❰ DOWNLOAD ❱───╮*
│ ${PREFIX}song
│ ${PREFIX}play
│ ${PREFIX}video
│ ${PREFIX}movie
*╰───────────────╯*

*╭───❰ AI ❱───╮*
│ ${PREFIX}ai
│ ${PREFIX}meta
*╰───────────╯*

*╭───❰ SETTINGS ❱───╮*
│ ${PREFIX}listsudo
│ ${PREFIX}addsudo
│ ${PREFIX}antidelete
│ ${PREFIX}autoread
│ ${PREFIX}autotyping
*╰───────────────╯*

> *©𝑝𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 𝐃𝐀𝐑𝐊 𝐄𝐘𝐄 𝐎𝐅𝐂 𝐃𝐄𝐕*`

                        await sock.sendMessage(
                            from,
                            {
                                text: menu,
                                mentions: [
                                    OWNER_JID
                                ]
                            },
                            {
                                quoted: m
                            }
                        )

                        return
                    }

                    // =================================================
                    // PING
                    // =================================================

                    if (cmd === 'ping') {

                        const start =
                            Date.now()

                        const speed =
                            Date.now() -
                            start

                        await reply(
                            boxMenu(
                                'PING',
                                [
                                    `Speed: ${speed}ms`,
                                    'Status: ONLINE ✅'
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // ALIVE
                    // =================================================

                    if (cmd === 'alive') {

                        await reply(
                            boxMenu(
                                'SKYPER-MD',
                                [
                                    'Bot is alive ✅',
                                    `Version: ${VERSION}`,
                                    `Uptime: ${formatUptime(process.uptime())}`,
                                    `Mode: ${BOT_SETTINGS.mode}`
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // UPTIME
                    // =================================================

                    if (cmd === 'uptime') {

                        await reply(
                            boxMenu(
                                'UPTIME',
                                [
                                    formatUptime(
                                        process.uptime()
                                    )
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // OWNER
                    // =================================================

                    if (cmd === 'owner') {

                        await reply(
                            boxMenu(
                                'OWNER INFO',
                                [
                                    `Name: ${OWNER}`,
                                    `Number: +${OWNER_NUM}`
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // STATUS
                    // =================================================

                    if (cmd === 'status') {

                        const uptime =
                            Math.floor(
                                process.uptime() /
                                60
                            )

                        const ram =
                            (
                                process
                                    .memoryUsage()
                                    .heapUsed /
                                1024 /
                                1024
                            ).toFixed(2)

                        await reply(
                            boxMenu(
                                'BOT STATUS',
                                [
                                    'Status: ONLINE ✅',
                                    `Uptime: ${uptime} minutes`,
                                    `RAM: ${ram} MB`
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // JOKE
                    // =================================================

                    if (cmd === 'joke') {

                        const jokes = [
                            "Why don't skeletons fight each other? They don't have the guts.",
                            "Why did the computer go to the doctor? It had a virus.",
                            "Why was the phone wearing glasses? It lost its contacts."
                        ]

                        const joke =
                            jokes[
                                Math.floor(
                                    Math.random() *
                                    jokes.length
                                )
                            ]

                        await reply(
                            boxMenu(
                                'JOKE 😂',
                                [joke]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // STICKER
                    // =================================================

                    if (
                        cmd === 's' ||
                        cmd === 'sticker'
                    ) {

                        const imageMessage =
                            m.message
                                ?.imageMessage

                        const quotedMessage =
                            m.message
                                ?.extendedTextMessage
                                ?.contextInfo
                                ?.quotedMessage

                        if (
                            !imageMessage &&
                            !quotedMessage?.imageMessage
                        ) {

                            return reply(
                                boxMenu(
                                    'STICKER',
                                    [
                                        `Send or reply to an image with ${PREFIX}s`
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        try {

                            let media

                            if (imageMessage) {

                                media =
                                    await downloadMedia(
                                        m
                                    )

                            } else {

                                const quoted = {
                                    message:
                                        quotedMessage
                                }

                                media =
                                    await downloadMedia(
                                        quoted
                                    )
                            }

                            const sticker =
                                new Sticker(
                                    media,
                                    {
                                        pack:
                                            'SKYPER-MD',
                                        author:
                                            OWNER,
                                        type:
                                            StickerTypes.FULL
                                    }
                                )

                            await sock.sendMessage(
                                from,
                                await sticker.toMessage(),
                                {
                                    quoted: m
                                }
                            )

                        } catch (e) {

                            await reply(
                                boxMenu(
                                    'STICKER ERROR',
                                    [
                                        e.message
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        return
                    }

                    // =================================================
                    // DATE
                    // =================================================

                    if (cmd === 'date') {

                        await reply(
                            boxMenu(
                                'DATE',
                                [
                                    `Today: ${moment().format(
                                        'dddd, DD MMMM YYYY'
                                    )}`
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // QR
                    // =================================================

                    if (cmd === 'qr') {

                        const text =
                            args.join(' ')

                        if (!text) {

                            return reply(
                                boxMenu(
                                    'QR',
                                    [
                                        `Usage: ${PREFIX}qr <text>`
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        try {

                            const qr =
                                await QRCode.toBuffer(
                                    text
                                )

                            await sock.sendMessage(
                                from,
                                {
                                    image: qr,
                                    caption:
                                        boxMenu(
                                            'QR CODE',
                                            [text]
                                        ) +
                                        `\n${WM}`
                                },
                                {
                                    quoted: m
                                }
                            )

                        } catch (e) {

                            await reply(
                                boxMenu(
                                    'QR ERROR',
                                    [e.message]
                                ) +
                                `\n${WM}`
                            )
                        }

                        return
                    }

                    // =================================================
                    // GOOGLE
                    // =================================================

                    if (cmd === 'google') {

                        const query =
                            args.join(' ')

                        if (!query) {

                            return reply(
                                boxMenu(
                                    'GOOGLE',
                                    [
                                        `Usage: ${PREFIX}google <query>`
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        try {

                            const res =
                                await axios.get(
                                    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`,
                                    {
                                        timeout: 15000
                                    }
                                )

                            const answer =
                                res.data?.AbstractText ||
                                res.data?.Answer ||
                                res.data
                                    ?.RelatedTopics?.[0]
                                    ?.Text ||
                                'No result found.'

                            await reply(
                                boxMenu(
                                    'GOOGLE',
                                    [
                                        `Query: ${query}`,
                                        `Result: ${answer}`
                                    ]
                                ) +
                                `\n${WM}`
                            )

                        } catch (e) {

                            await reply(
                                boxMenu(
                                    'GOOGLE ERROR',
                                    [
                                        e.message
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        return
                    }

                    // =================================================
                    // PLAY / SONG
                    // =================================================

                    if (
                        cmd === 'play' ||
                        cmd === 'song'
                    ) {

                        const query =
                            args.join(' ')

                        if (!query) {

                            return reply(
                                boxMenu(
                                    'DOWNLOAD',
                                    [
                                        `Usage: ${PREFIX}${cmd} <song name>`
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        try {

                            const search =
                                await yts(query)

                            if (
                                !search.videos?.length
                            ) {

                                return reply(
                                    boxMenu(
                                        'DOWNLOAD',
                                        [
                                            'No results found.'
                                        ]
                                    ) +
                                    `\n${WM}`
                                )
                            }

                            const song =
                                search.videos[0]

                            const file =
                                `./tmp/${Date.now()}.mp3`

                            await reply(
                                boxMenu(
                                    'DOWNLOADING AUDIO',
                                    [
                                        song.title
                                    ]
                                ) +
                                `\n${WM}`
                            )

                            const stream =
                                ytdl(
                                    song.url,
                                    {
                                        filter:
                                            'audioonly',
                                        quality:
                                            'highestaudio'
                                    }
                                )

                            const output =
                                fs.createWriteStream(
                                    file
                                )

                            stream.pipe(output)

                            output.on(
                                'finish',
                                async () => {

                                    try {

                                        await sock.sendMessage(
                                            from,
                                            {
                                                audio: {
                                                    url: file
                                                },
                                                mimetype:
                                                    'audio/mpeg',
                                                fileName:
                                                    `${song.title}.mp3`
                                            },
                                            {
                                                quoted: m
                                            }
                                        )

                                    } catch (e) {

                                        console.error(
                                            'Audio send error:',
                                            e
                                        )

                                    } finally {

                                        if (
                                            fs.existsSync(
                                                file
                                            )
                                        ) {
                                            fs.unlinkSync(
                                                file
                                            )
                                        }
                                    }
                                }
                            )

                            stream.on(
                                'error',
                                async (e) => {

                                    if (
                                        fs.existsSync(
                                            file
                                        )
                                    ) {
                                        fs.unlinkSync(
                                            file
                                        )
                                    }

                                    await reply(
                                        boxMenu(
                                            'DOWNLOAD ERROR',
                                            [
                                                e.message
                                            ]
                                        ) +
                                        `\n${WM}`
                                    )
                                }
                            )

                        } catch (e) {

                            await reply(
                                boxMenu(
                                    'DOWNLOAD ERROR',
                                    [
                                        e.message
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        return
                    }

                    // =================================================
                    // KICK
                    // =================================================

                    if (cmd === 'kick') {

                        if (!isGroup) {

                            return reply(
                                boxMenu(
                                    'ERROR',
                                    [
                                        'This command is for groups only.'
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        if (
                            !(await isAdmin())
                        ) {

                            return reply(
                                boxMenu(
                                    'ERROR',
                                    [
                                        'Only group admins can use this command.'
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        const users =
                            m.message
                                ?.extendedTextMessage
                                ?.contextInfo
                                ?.mentionedJid ||
                            []

                        if (!users.length) {

                            return reply(
                                boxMenu(
                                    'KICK',
                                    [
                                        'Mention the user you want to remove.'
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        try {

                            await sock.groupParticipantsUpdate(
                                from,
                                users,
                                'remove'
                            )

                            await reply(
                                boxMenu(
                                    'KICKED',
                                    [
                                        `Removed: ${users.length} user(s)`
                                    ]
                                ) +
                                `\n${WM}`
                            )

                        } catch (e) {

                            await reply(
                                boxMenu(
                                    'KICK ERROR',
                                    [
                                        e.message
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        return
                    }

                    // =================================================
                    // TAG ALL
                    // =================================================

                    if (cmd === 'tagall') {

                        if (!isGroup) {

                            return reply(
                                boxMenu(
                                    'ERROR',
                                    [
                                        'This command is for groups only.'
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        try {

                            const meta =
                                await sock.groupMetadata(
                                    from
                                )

                            const participants =
                                meta.participants.map(
                                    p => p.id
                                )

                            const text =
                                args.join(' ') ||
                                'Attention everyone!'

                            const mentions =
                                participants
                                    .map(
                                        p =>
                                            `@${p.split('@')[0]}`
                                    )
                                    .join(' ')

                            await sock.sendMessage(
                                from,
                                {
                                    text:
                                        boxMenu(
                                            'TAG ALL',
                                            [text]
                                        ) +
                                        `\n${mentions}\n\n${WM}`,

                                    mentions:
                                        participants
                                },
                                {
                                    quoted: m
                                }
                            )

                        } catch (e) {

                            await reply(
                                boxMenu(
                                    'TAGALL ERROR',
                                    [
                                        e.message
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        return
                    }

                    // =================================================
                    // AI
                    // =================================================

                    if (
                        [
                            'ai',
                            'chatgpt',
                            'gpt4'
                        ].includes(cmd)
                    ) {

                        const prompt =
                            args.join(' ')

                        if (!prompt) {

                            return reply(
                                boxMenu(
                                    'AI',
                                    [
                                        `Usage: ${PREFIX}ai <question>`
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        const result =
                            await askAI(
                                prompt
                            )

                        await reply(
                            boxMenu(
                                'AI',
                                [result]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // BALANCE
                    // =================================================

                    if (cmd === 'balance') {

                        const user =
                            getUser(sender)

                        await reply(
                            boxMenu(
                                'BALANCE',
                                [
                                    `Money: $${user.balance}`,
                                    `Level: ${user.level}`,
                                    `XP: ${user.xp}`
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // DAILY
                    // =================================================

                    if (cmd === 'daily') {

                        const user =
                            getUser(sender)

                        if (
                            Date.now() -
                            user.lastDaily <
                            86400000
                        ) {

                            return reply(
                                boxMenu(
                                    'DAILY',
                                    [
                                        'You already claimed your daily reward.'
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        user.balance += 500
                        user.lastDaily =
                            Date.now()

                        addXP(
                            sender,
                            10
                        )

                        saveEco()

                        await reply(
                            boxMenu(
                                'DAILY',
                                [
                                    'Claimed $500 + 10 XP'
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // AFK
                    // =================================================

                    if (cmd === 'afk') {

                        BOT_SETTINGS.afk ??= {}

                        BOT_SETTINGS.afk[
                            sender
                        ] = {
                            reason:
                                args.join(' ') ||
                                'AFK',
                            time:
                                Date.now()
                        }

                        saveSettings()

                        await reply(
                            boxMenu(
                                'AFK',
                                [
                                    `You are now AFK`,
                                    `Reason: ${
                                        BOT_SETTINGS.afk[
                                            sender
                                        ].reason
                                    }`
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // SETTINGS
                    // =================================================

                    if (cmd === 'settings') {

                        await reply(
                            boxMenu(
                                'BOT SETTINGS',
                                [
                                    `Prefix: ${PREFIX}`,
                                    `Mode: ${BOT_SETTINGS.mode}`,
                                    `DarkEye: ${
                                        BOT_SETTINGS.darkeye
                                            ? 'ON'
                                            : 'OFF'
                                    }`
                                ]
                            ) +
                            `\n${WM}`
                        )

                        return
                    }

                    // =================================================
                    // OWNER-ONLY
                    // =================================================

                    if (
                        [
                            'eval',
                            'exec',
                            'restart'
                        ].includes(cmd) &&
                        !isOwner
                    ) {

                        return reply(
                            boxMenu(
                                'OWNER',
                                [
                                    'Only the bot owner can use this command.'
                                ]
                            ) +
                            `\n${WM}`
                        )
                    }

                    // =================================================
                    // EVAL
                    // =================================================

                    if (cmd === 'eval') {

                        try {

                            const result =
                                await eval(
                                    args.join(' ')
                                )

                            await reply(
                                boxMenu(
                                    'EVAL',
                                    [
                                        String(
                                            result
                                        )
                                    ]
                                ) +
                                `\n${WM}`
                            )

                        } catch (e) {

                            await reply(
                                boxMenu(
                                    'EVAL ERROR',
                                    [
                                        e.message
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        return
                    }

                    // =================================================
                    // RESTART
                    // =================================================

                    if (cmd === 'restart') {

                        await reply(
                            boxMenu(
                                'RESTART',
                                [
                                    'Restarting...'
                                ]
                            ) +
                            `\n${WM}`
                        )

                        setTimeout(
                            () => process.exit(1),
                            1000
                        )

                        return
                    }

                    // =================================================
                    // QURAN
                    // =================================================

                    if (cmd === 'quran') {

                        try {

                            const res =
                                await axios.get(
                                    'https://api.alquran.cloud/v1/ayah/1:1/editions/quran-uthmani,en.asad',
                                    {
                                        timeout: 15000
                                    }
                                )

                            const data =
                                res.data?.data ||
                                []

                            const lines =
                                data.map(
                                    item =>
                                        item.text
                                )

                            await reply(
                                boxMenu(
                                    'QURAN',
                                    lines
                                ) +
                                `\n${WM}`
                            )

                        } catch (e) {

                            await reply(
                                boxMenu(
                                    'QURAN ERROR',
                                    [
                                        e.message
                                    ]
                                ) +
                                `\n${WM}`
                            )
                        }

                        return
                    }

                    // =================================================
                    // UNKNOWN COMMAND
                    // =================================================

                    await reply(
                        boxMenu(
                            'UNKNOWN COMMAND',
                            [
                                `Command: ${cmd}`,
                                `Use ${PREFIX}menu to view commands.`
                            ]
                        ) +
                        `\n${WM}`
                    )

                } catch (e) {

                    console.error(
                        'Message handler error:',
                        e
                    )

                    try {

                        await sock.sendMessage(
                            m.key.remoteJid,
                            {
                                text:
                                    boxMenu(
                                        'ERROR',
                                        [
                                            e.message ||
                                            'An unexpected error occurred.'
                                        ]
                                    ) +
                                    `\n${WM}`
                            },
                            {
                                quoted: m
                            }
                        )

                    } catch (sendError) {
                        console.error(
                            'Error reply failed:',
                            sendError
                        )
                    }
                }
            }
        )

    } catch (e) {

        console.error(
            'Bot startup error:',
            e
        )

        setTimeout(
            startBot,
            5000
        )
    }
}

// ============================================================
// START
// ============================================================

startBot()
