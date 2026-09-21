import 'dotenv/config'

import fs from 'fs'
import path from 'path'
import express from 'express'
import axios from 'axios'
import pino from 'pino'

import {
    default as makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} from '@whiskeysockets/baileys'

import { fileURLToPath } from 'url'

import {
    loadCommands,
    handleCommand
} from './commands/commandHandler.js'


// ═══════════════════════════════════════════════════════════════
// PATHS
// ═══════════════════════════════════════════════════════════════

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = __dirname

const SESSION_DIR = path.join(ROOT, 'session')
const DATABASE_DIR = path.join(ROOT, 'database')
const TMP_DIR = path.join(ROOT, 'tmp')
const PUBLIC_DIR = path.join(ROOT, 'public')


// ═══════════════════════════════════════════════════════════════
// CREATE REQUIRED DIRECTORIES
// ═══════════════════════════════════════════════════════════════

for (const dir of [
    SESSION_DIR,
    DATABASE_DIR,
    TMP_DIR,
    PUBLIC_DIR
]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}


// ═══════════════════════════════════════════════════════════════
// DATABASE FILES
// ═══════════════════════════════════════════════════════════════

const ECONOMY_FILE =
    path.join(DATABASE_DIR, 'economy.json')

const SETTINGS_FILE =
    path.join(DATABASE_DIR, 'settings.json')


function createJSONFile(file, defaultData) {

    if (!fs.existsSync(file)) {

        fs.writeFileSync(
            file,
            JSON.stringify(
                defaultData,
                null,
                2
            )
        )
    }
}


createJSONFile(
    ECONOMY_FILE,
    {}
)

createJSONFile(
    SETTINGS_FILE,
    {
        mode: 'public',
        afk: {},
        darkeye: false,
        aishield: {},
        chatbot: {}
    }
)


// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const config = {

    botName:
        process.env.BOT_NAME ||
        'SKYPER-MD',

    version:
        process.env.VERSION ||
        '2.0.5',

    ownerName:
        process.env.OWNER_NAME ||
        'DARK-EYE OFC DEV',

    ownerNumber:
        process.env.OWNER_NUMBER ||
        '263783546271',

    sudoNumber:
        process.env.SUDO_NUMBER ||
        '',

    prefix:
        process.env.PREFIX ||
        '.',

    mode:
        'public',

    watermark:
        '> *♤powered by DARK-EYE OFC DEV*',

    sessionPath:
        './session',

    dashboardUrl:
        process.env.DASHBOARD_URL ||
        'https://skyper-md.onrender.com',

    apiKeys: {

        openweather:
            process.env.OPENWEATHER_API_KEY || '',

        removebg:
            process.env.REMOVEBG_API_KEY || '',

        lovable:
            process.env.LOVABLE_API_KEY || '',

        unsplash:
            process.env.UNSPLASH_API_KEY || '',

        news:
            process.env.NEWS_API_KEY || '',

        gemini:
            process.env.GEMINI_API_KEY || '',

        openai:
            process.env.OPENAI_API_KEY || '',

        googleSafeBrowsing:
            process.env.GOOGLE_SAFE_BROWSING_API_KEY || '',

        urlhaus:
            process.env.URLHAUS_AUTH_KEY || ''
    }
}


// ═══════════════════════════════════════════════════════════════
// OWNER NUMBERS
// ═══════════════════════════════════════════════════════════════

const ownerNumbers =
    String(config.ownerNumber)
        .split(',')
        .map(number =>
            number
                .replace(/\D/g, '')
                .trim()
        )
        .filter(Boolean)


const OWNER_NUM =
    ownerNumbers[0] || ''


const OWNER_JID =
    OWNER_NUM
        ? `${OWNER_NUM}@s.whatsapp.net`
        : ''


// ═══════════════════════════════════════════════════════════════
// SUDO NUMBERS
// ═══════════════════════════════════════════════════════════════

const sudoNumbers =
    String(config.sudoNumber)
        .split(',')
        .map(number =>
            number
                .replace(/\D/g, '')
                .trim()
        )
        .filter(Boolean)


// ═══════════════════════════════════════════════════════════════
// EXPRESS SERVER
// ═══════════════════════════════════════════════════════════════

const app =
    express()

const PORT =
    process.env.PORT || 10000


app.use(
    express.json()
)

app.use(
    express.urlencoded({
        extended: true
    })
)

app.use(
    express.static(PUBLIC_DIR)
)


// ═══════════════════════════════════════════════════════════════
// JSON HELPERS
// ═══════════════════════════════════════════════════════════════

function readJSON(
    file,
    fallback = {}
) {

    try {

        return JSON.parse(
            fs.readFileSync(
                file,
                'utf8'
            )
        )

    } catch {

        return fallback
    }
}


function writeJSON(
    file,
    data
) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        )
    )
}


// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

const BOT_SETTINGS =
    readJSON(
        SETTINGS_FILE,
        {
            mode: 'public',
            afk: {},
            darkeye: false,
            aishield: {},
            chatbot: {}
        }
    )


BOT_SETTINGS.afk ??= {}

BOT_SETTINGS.aishield ??= {}

BOT_SETTINGS.chatbot ??= {}

BOT_SETTINGS.mode ??=
    config.mode

BOT_SETTINGS.darkeye ??=
    false


function saveSettings() {

    writeJSON(
        SETTINGS_FILE,
        BOT_SETTINGS
    )
}


// ═══════════════════════════════════════════════════════════════
// ECONOMY
// ═══════════════════════════════════════════════════════════════

const economy =
    readJSON(
        ECONOMY_FILE,
        {}
    )


function saveEconomy() {

    writeJSON(
        ECONOMY_FILE,
        economy
    )
}


function getUser(
    jid,
    name = 'User'
) {

    if (!economy[jid]) {

        economy[jid] = {

            name,

            balance:
                1000,

            xp:
                0,

            level:
                1
        }

        saveEconomy()
    }

    return economy[jid]
}


function addXP(
    jid,
    amount = 1
) {

    const user =
        getUser(jid)

    user.xp += amount

    const required =
        user.level * 100

    if (
        user.xp >=
        required
    ) {

        user.xp -= required

        user.level++

        saveEconomy()

        return true
    }

    saveEconomy()

    return false
}


// ═══════════════════════════════════════════════════════════════
// GROUP SETTINGS
// ═══════════════════════════════════════════════════════════════

const groupSettings = {}


// ═══════════════════════════════════════════════════════════════
// BOT STATE
// ═══════════════════════════════════════════════════════════════

let sock = null

let reconnecting = false

let totalCommands = 0

let pairingInProgress = false


// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function formatUptime(seconds) {

    seconds =
        Math.floor(seconds)

    const days =
        Math.floor(
            seconds / 86400
        )

    seconds %= 86400

    const hours =
        Math.floor(
            seconds / 3600
        )

    seconds %= 3600

    const minutes =
        Math.floor(
            seconds / 60
        )

    seconds %= 60

    return [

        days
            ? `${days}d`
            : '',

        hours
            ? `${hours}h`
            : '',

        minutes
            ? `${minutes}m`
            : '',

        `${seconds}s`

    ]
        .filter(Boolean)
        .join(' ')
}


function getText(message) {

    if (!message?.message) {
        return ''
    }

    const msg =
        message.message

    return (

        msg.conversation ||

        msg.extendedTextMessage?.text ||

        msg.imageMessage?.caption ||

        msg.videoMessage?.caption ||

        msg.documentMessage?.caption ||

        msg.buttonsResponseMessage?.selectedButtonId ||

        msg.listResponseMessage?.singleSelectReply?.selectedRowId ||

        ''
    )
}


function getSender(m) {

    return (

        m.key.participant ||

        m.key.remoteJid ||

        ''
    )
}


function isGroupJid(jid) {

    return jid?.endsWith('@g.us')
}


function normalizeNumber(value) {

    return String(value || '')
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '')
}


function isOwnerNumber(jid) {

    const number =
        normalizeNumber(jid)

    return ownerNumbers.includes(
        number
    )
}


function isSudoNumber(jid) {

    const number =
        normalizeNumber(jid)

    return sudoNumbers.includes(
        number
    )
}


function getMentionedJids(m) {

    return (

        m.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid ||

        m.message
            ?.imageMessage
            ?.contextInfo
            ?.mentionedJid ||

        m.message
            ?.videoMessage
            ?.contextInfo
            ?.mentionedJid ||

        []
    )
}


// ═══════════════════════════════════════════════════════════════
// ADMIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function isAdmin(
    jid,
    groupJid
) {

    try {

        if (
            !isGroupJid(groupJid)
        ) {
            return false
        }

        if (!sock) {
            return false
        }

        const metadata =
            await sock.groupMetadata(
                groupJid
            )

        const participant =
            metadata.participants.find(
                p =>
                    p.id === jid ||
                    normalizeNumber(p.id) ===
                    normalizeNumber(jid)
            )

        return Boolean(
            participant?.admin
        )

    } catch {

        return false
    }
}


async function isBotAdmin(
    groupJid
) {

    try {

        if (
            !sock?.user?.id
        ) {
            return false
        }

        const botNumber =
            normalizeNumber(
                sock.user.id
            )

        const metadata =
            await sock.groupMetadata(
                groupJid
            )

        const participant =
            metadata.participants.find(
                p =>
                    normalizeNumber(p.id) ===
                    botNumber
            )

        return Boolean(
            participant?.admin
        )

    } catch {

        return false
    }
}


// ═══════════════════════════════════════════════════════════════
// MESSAGE REPLY
// ═══════════════════════════════════════════════════════════════

async function reply(
    text,
    m
) {

    if (
        !sock ||
        !m ||
        !m.key?.remoteJid
    ) {
        return
    }

    return sock.sendMessage(
        m.key.remoteJid,
        {
            text: String(text)
        },
        {
            quoted: m
        }
    )
}


// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

app.get(
    '/',
    (req, res) => {

        const dashboard =
            path.join(
                PUBLIC_DIR,
                'dashboard.html'
            )

        if (
            fs.existsSync(
                dashboard
            )
        ) {

            return res.sendFile(
                dashboard
            )
        }

        res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${config.botName}</title>
</head>

<body style="font-family:Arial;text-align:center;padding:50px">

<h1>${config.botName}</h1>

<p>Bot is running.</p>

<p>Version: ${config.version}</p>

<p>
<a href="/pair">
Get Pair Code
</a>
</p>

</body>
</html>
`)
    }
)


// ═══════════════════════════════════════════════════════════════
// PAIRING PAGE
// ═══════════════════════════════════════════════════════════════

app.get(
    '/pair',
    (req, res) => {

        res.send(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>
${config.botName} Pair
</title>

<style>

body {
    font-family: Arial, sans-serif;
    background: #111;
    color: white;
    text-align: center;
    padding: 50px 20px;
}

input {
    padding: 14px;
    width: 280px;
    max-width: 90%;
    border-radius: 8px;
    border: none;
    margin-bottom: 15px;
}

button {
    padding: 14px 25px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

#result {
    margin-top: 25px;
    font-size: 25px;
    font-weight: bold;
    word-break: break-word;
}

</style>

</head>

<body>

<h1>
${config.botName}
</h1>

<p>
Enter your WhatsApp number
with country code.
</p>

<input
id="number"
placeholder="263783546271"
inputmode="numeric"
/>

<br>

<button
onclick="pair()">

GET PAIR CODE

</button>

<div id="result"></div>

<script>

async function pair() {

    const number =
        document
            .getElementById('number')
            .value
            .trim()

    if (!number) {

        alert(
            'Enter your WhatsApp number'
        )

        return
    }

    const result =
        document
            .getElementById('result')

    result.innerText =
        '⏳ Connecting to WhatsApp...'

    try {

        const response =
            await fetch(
                '/api/pair?number=' +
                encodeURIComponent(number)
            )

        const data =
            await response.json()

        if (data.code) {

            result.innerText =
                data.code

        } else {

            result.innerText =
                '❌ ' +
                (
                    data.error ||
                    'Failed'
                )
        }

    } catch {

        result.innerText =
            '❌ Connection failed'
    }
}

</script>

</body>

</html>
`)
    }
)


// ═══════════════════════════════════════════════════════════════
// PAIRING API
// ═══════════════════════════════════════════════════════════════

app.get(
    '/api/pair',
    async (req, res) => {

        try {

            const number =
                String(
                    req.query.number ||
                    ''
                )
                    .replace(
                        /\D/g,
                        ''
                    )

            if (!number) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        error:
                            'WhatsApp number is required'
                    })
            }

            if (!sock) {

                return res
                    .status(503)
                    .json({
                        success: false,
                        error:
                            'WhatsApp socket is not ready yet. Please wait a few seconds.'
                    })
            }

            if (
                sock.authState
                    ?.creds
                    ?.registered
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        error:
                            'This bot is already registered. Delete the session folder before pairing a new number.'
                    })
            }

            if (
                pairingInProgress
            ) {

                return res
                    .status(429)
                    .json({
                        success: false,
                        error:
                            'A pairing request is already in progress. Please wait.'
                    })
            }

            pairingInProgress =
                true

            console.log('')

            console.log(
                '╭──────────────────────────────╮'
            )

            console.log(
                '│       PAIRING REQUEST        │'
            )

            console.log(
                '├──────────────────────────────┤'
            )

            console.log(
                `│ Number: ${number}`
            )

            console.log(
                '│ Requesting pairing code...'
            )

            console.log(
                '╰──────────────────────────────╯'
            )

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        2000
                    )
            )

            if (!sock) {

                throw new Error(
                    'WhatsApp socket is no longer available.'
                )
            }

            console.log(
                '🔗 Requesting WhatsApp pairing code...'
            )

            const code =
                await sock.requestPairingCode(
                    number
                )

            const formatted =
                code
                    ?.match(/.{1,4}/g)
                    ?.join('-') ||
                code

            console.log(
                `✅ Pairing code generated: ${formatted}`
            )

            return res.json({
                success: true,
                code: formatted
            })

        } catch (error) {

            console.error(
                '[PAIRING ERROR]',
                error
            )

            return res
                .status(500)
                .json({
                    success: false,
                    error:
                        error.message ||
                        'Unable to generate pairing code'
                })

        } finally {

            pairingInProgress =
                false
        }
    }
)


// ═══════════════════════════════════════════════════════════════
// BOT INSIGHTS
// ═══════════════════════════════════════════════════════════════

app.get(
    '/api/insights',
    (req, res) => {

        let users = {}

        try {

            users =
                JSON.parse(
                    fs.readFileSync(
                        ECONOMY_FILE,
                        'utf8'
                    )
                )

        } catch {

            users = {}
        }

        res.json({

            users:
                Object.keys(
                    users
                ).length,

            ttlBots:
                sock
                    ? 1
                    : 0,

            onlineBots:
                sock?.user
                    ? 1
                    : 0,

            totalCommands,

            uptime:
                process.uptime(),

            version:
                config.version,

            botName:
                config.botName,

            mode:
                BOT_SETTINGS.mode,

            connectedNumber:
                sock?.user?.id
                    ? normalizeNumber(
                        sock.user.id
                    )
                    : null
        })
    }
)


// ═══════════════════════════════════════════════════════════════
// COMMAND COUNTER
// ═══════════════════════════════════════════════════════════════

app.post(
    '/api/command',
    (req, res) => {

        res.json({

            success:
                true,

            totalCommands
        })
    }
)


// ═══════════════════════════════════════════════════════════════
// ADD USER
// ═══════════════════════════════════════════════════════════════

app.post(
    '/api/add-user',
    (req, res) => {

        try {

            const {
                jid,
                name
            } = req.body

            if (!jid) {

                return res
                    .status(400)
                    .json({
                        error:
                            'jid required'
                    })
            }

            const economyData =
                readJSON(
                    ECONOMY_FILE,
                    {}
                )

            if (
                !economyData[jid]
            ) {

                economyData[jid] = {

                    name:
                        name ||
                        'User',

                    balance:
                        1000,

                    xp:
                        0,

                    level:
                        1
                }

                writeJSON(
                    ECONOMY_FILE,
                    economyData
                )
            }

            res.json({
                success: true
            })

        } catch (error) {

            res
                .status(500)
                .json({
                    error:
                        error.message
                })
        }
    }
)


// ═══════════════════════════════════════════════════════════════
// START EXPRESS
// ═══════════════════════════════════════════════════════════════

app.listen(
    PORT,
    () => {

        console.log('')

        console.log(
            '╭──────────────────────────────╮'
        )

        console.log(
            `│      ${config.botName} ONLINE       │`
        )

        console.log(
            '├──────────────────────────────┤'
        )

        console.log(
            `│ Port: ${PORT}`
        )

        console.log(
            `│ Version: ${config.version}`
        )

        console.log(
            `│ Mode: ${config.mode}`
        )

        console.log(
            '╰──────────────────────────────╯'
        )

        console.log('')

        console.log(
            `👑 Owner numbers: ${ownerNumbers.length}`
        )

        console.log(
            `🔐 Sudo numbers: ${sudoNumbers.length}`
        )
    }
)


// ═══════════════════════════════════════════════════════════════
// WELCOME / GOODBYE
// ═══════════════════════════════════════════════════════════════

async function handleGroupParticipantsUpdate(
    update
) {

    try {

        const {
            id,
            participants,
            action
        } = update

        if (
            !isGroupJid(id)
        ) {
            return
        }

        if (
            !groupSettings[id]?.welcome
        ) {
            return
        }

        for (
            const participant
            of participants
        ) {

            const number =
                participant
                    .split('@')[0]

            if (
                action === 'add'
            ) {

                await sock.sendMessage(
                    id,
                    {

                        text:
`╭───❒ *WELCOME* ❒───╮
│ 👋 Welcome @${number}
│ 🤖 ${config.botName}
╰────────────────────❒

${config.watermark}`,

                        mentions: [
                            participant
                        ]
                    }
                )
            }

            if (
                action === 'remove'
            ) {

                await sock.sendMessage(
                    id,
                    {

                        text:
`╭───❒ *GOODBYE* ❒───╮
│ 👋 Goodbye @${number}
│ 🤖 ${config.botName}
╰────────────────────❒

${config.watermark}`,

                        mentions: [
                            participant
                        ]
                    }
                )
            }
        }

    } catch (error) {

        console.error(
            '[WELCOME ERROR]',
            error.message
        )
    }
}


// ═══════════════════════════════════════════════════════════════
// AFK HANDLER
// ═══════════════════════════════════════════════════════════════

async function handleAFK(
    m,
    from,
    sender
) {

    const afk =
        BOT_SETTINGS.afk || {}

    if (
        afk[sender]
    ) {

        const old =
            afk[sender]

        delete afk[sender]

        saveSettings()

        await reply(
`╭───❒ *AFK* ❒───╮
│ Welcome back!
│ You were AFK for:
│ ${formatUptime(
    (
        Date.now() -
        old.time
    ) / 1000
)}
╰────────────────❒`,
            m
        )
    }

    const mentions =
        getMentionedJids(m)

    for (
        const jid
        of mentions
    ) {

        if (
            !afk[jid]
        ) {
            continue
        }

        const data =
            afk[jid]

        const duration =
            formatUptime(
                (
                    Date.now() -
                    data.time
                ) / 1000
            )

        await reply(
`╭───❒ *AFK USER* ❒───╮
│ 👤 @${jid.split('@')[0]}
│ 💬 ${data.reason || 'AFK'}
│ ⏱️ ${duration}
╰────────────────────❒`,
            m
        )

        break
    }
}


// ═══════════════════════════════════════════════════════════════
// ANTI-LINK
// ═══════════════════════════════════════════════════════════════

async function handleAntiLink(
    m,
    from,
    sender,
    body
) {

    if (
        !isGroupJid(from)
    ) {
        return false
    }

    if (
        !groupSettings[from]?.antilink
    ) {
        return false
    }

    if (
        !body.includes(
            'chat.whatsapp.com'
        )
    ) {
        return false
    }

    const admin =
        await isAdmin(
            sender,
            from
        )

    if (admin) {
        return false
    }

    const botAdmin =
        await isBotAdmin(
            from
        )

    if (!botAdmin) {

        await reply(
            '⚠️ Anti-link is enabled, but I need admin permission to delete links.',
            m
        )

        return true
    }

    try {

        await sock.sendMessage(
            from,
            {
                delete:
                    m.key
            }
        )

        await reply(
`╭───❒ *ANTI-LINK* ❒───╮
│ 🚫 WhatsApp group links
│ are not allowed here.
╰──────────────────────❒`,
            m
        )

    } catch (error) {

        console.error(
            '[ANTILINK]',
            error.message
        )
    }

    return true
}


// ═══════════════════════════════════════════════════════════════
// COMMAND PROCESSOR
// ═══════════════════════════════════════════════════════════════

async function processMessage(
    m
) {

    try {

        if (
            !m?.message
        ) {
            return
        }

        const from =
            m.key.remoteJid

        if (!from) {
            return
        }

        // Allow the connected bot account to use commands
// if (m.key.fromMe) return

        const sender =
            getSender(m)

        const body =
            getText(m).trim()

        // DEBUG
        console.log(
            `[MESSAGE] from=${from} sender=${sender} body=${body}`
        )

        if (!body) {
            return
        }

        await handleAFK(
            m,
            from,
            sender
        )

        const blocked =
            await handleAntiLink(
                m,
                from,
                sender,
                body
            )

        if (blocked) {
            return
        }

        const prefix =
            config.prefix

        if (
            !body.startsWith(
                prefix
            )
        ) {
            return
        }

        const withoutPrefix =
            body
                .slice(
                    prefix.length
                )
                .trim()

        if (!withoutPrefix) {
            return
        }

        const parts =
            withoutPrefix.split(
                /\s+/
            )

        const cmd =
            parts
                .shift()
                .toLowerCase()

        const args =
            parts

        const text =
            args.join(' ')

        const isGroup =
            isGroupJid(from)

        const isOwner =
            isOwnerNumber(sender)

        const isSudo =
            isSudoNumber(sender)

        let senderIsAdmin =
            false

        if (
            isGroup
        ) {

            senderIsAdmin =
                await isAdmin(
                    sender,
                    from
                )
        }

        const pushName =
            m.pushName ||
            'User'

        const user =
            getUser(
                sender,
                pushName
            )

        console.log(
            `[COMMAND] cmd=${cmd} sender=${sender} owner=${isOwner} sudo=${isSudo} group=${isGroup}`
        )

        const context = {

            sock,

            m,

            from,

            sender,

            body,

            cmd,

            args,

            text,

            config,

            prefix,

            OWNER_NUM,

            OWNER_JID,

            ownerNumbers,

            sudoNumbers,

            isOwner,

            isSudo,

            isGroup,

            isAdmin:
                senderIsAdmin,

            isBotAdmin:
                isGroup
                    ? await isBotAdmin(
                        from
                    )
                    : false,

            groupSettings,

            user,

            getUser,

            addXP,

            saveEconomy,

            BOT_SETTINGS,

            saveSettings,

            reply:
                text =>
                    reply(
                        text,
                        m
                    ),

            getText,

            getMentionedJids,

            formatUptime,

            normalizeNumber,

            ROOT,

            DATABASE_DIR,

            TMP_DIR,

            SESSION_DIR,

            get totalCommands() {
                return totalCommands
            }
        }

        const executed =
            await handleCommand(
                context
            )

        if (
            executed
        ) {

            totalCommands++

            console.log(
                `[COMMAND SUCCESS] ${cmd}`
            )

            try {

                await axios.post(
                    `${config.dashboardUrl}/api/command`,
                    {
                        command:
                            cmd
                    },
                    {
                        timeout:
                            5000
                    }
                )

            } catch {
                // Dashboard is optional.
            }

        } else {

            console.log(
                `[COMMAND NOT FOUND] ${cmd}`
            )
        }

    } catch (error) {

        console.error(
            '[MESSAGE ERROR]',
            error
        )

        try {

            await reply(
                `❌ *Command Error*\n\n${error.message}`,
                m
            )

        } catch {
            // Ignore reply failure.
        }
    }
}


// ═══════════════════════════════════════════════════════════════
// START WHATSAPP
// ═══════════════════════════════════════════════════════════════

async function startBot() {

    if (
        reconnecting
    ) {
        return
    }

    try {

        const {
            state,
            saveCreds
        } =
            await useMultiFileAuthState(
                SESSION_DIR
            )

        const {
            version
        } =
            await fetchLatestBaileysVersion()

        console.log(
            `Using WhatsApp version ${version.join('.')}`
        )

        sock =
            makeWASocket({

                version,

                auth:
                    state,

                logger:
                    pino({
                        level:
                            'info'
                    }),

                printQRInTerminal:
                    false,

                browser:
                    Browsers.ubuntu(
                        'Firefox'
                    ),

                generateHighQualityLinkPreview:
                    true,

                markOnlineOnConnect:
                    true
            })


        sock.ev.on(
            'creds.update',
            saveCreds
        )


        // ═══════════════════════════════════════════════════════
        // CONNECTION UPDATE
        // ═══════════════════════════════════════════════════════

        sock.ev.on(
            'connection.update',
            async update => {

                const {
                    connection,
                    lastDisconnect
                } = update

                if (
                    connection ===
                    'connecting'
                ) {

                    console.log(
                        '⏳ Connecting to WhatsApp...'
                    )
                }

                if (
                    connection ===
                    'open'
                ) {

                    reconnecting =
                        false

                    console.log('')

                    console.log(
                        '╭──────────────────────────────╮'
                    )

                    console.log(
                        `│       ${config.botName} CONNECTED      │`
                    )

                    console.log(
                        '├──────────────────────────────┤'
                    )

                    console.log(
                        `│ Version: ${config.version}`
                    )

                    console.log(
                        `│ Mode: ${BOT_SETTINGS.mode}`
                    )

                    console.log(
                        `│ Uptime: ${formatUptime(
                            process.uptime()
                        )}`
                    )

                    console.log(
                        `│ Number: ${normalizeNumber(
                            sock.user?.id
                        )}`
                    )

                    console.log(
                        '╰──────────────────────────────╯'
                    )

                    console.log('')

                    console.log(
                        '📥 Message listener: ACTIVE'
                    )

                    try {

                        if (
                            sock.user?.id
                        ) {

                            await axios.post(
                                `${config.dashboardUrl}/api/add-user`,
                                {

                                    jid:
                                        normalizeNumber(
                                            sock.user.id
                                        ) +
                                        '@s.whatsapp.net',

                                    name:
                                        sock.user.name ||
                                        config.botName
                                },
                                {
                                    timeout:
                                        5000
                                }
                            )
                        }

                    } catch {
                        // Dashboard optional.
                    }
                }

                if (
                    connection ===
                    'close'
                ) {

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode

                    const shouldReconnect =
                        statusCode !==
                        DisconnectReason.loggedOut

                    console.log(
                        `❌ WhatsApp disconnected. Code: ${statusCode}`
                    )

                    if (
                        shouldReconnect
                    ) {

                        reconnecting =
                            true

                        console.log(
                            '🔄 Reconnecting in 5 seconds...'
                        )

                        setTimeout(
                            () => {

                                reconnecting =
                                    false

                                startBot()

                            },
                            5000
                        )

                    } else {

                        console.log(
                            '❌ Logged out. Delete the session folder and pair again.'
                        )
                    }
                }
            }
        )


        // ═══════════════════════════════════════════════════════
        // INCOMING MESSAGES
        // ═══════════════════════════════════════════════════════

        sock.ev.on(
            'messages.upsert',
            async ({
                messages,
                type
            }) => {

                console.log(
                    `[WA EVENT] messages.upsert type=${type} count=${messages?.length || 0}`
                )

                if (
                    type !== 'notify'
                ) {
                    return
                }

                for (
                    const message
                    of messages
                ) {

                    try {

                        await processMessage(
                            message
                        )

                    } catch (error) {

                        console.error(
                            '[MESSAGE EVENT ERROR]',
                            error
                        )
                    }
                }
            }
        )


        // ═══════════════════════════════════════════════════════
        // GROUP PARTICIPANTS
        // ═══════════════════════════════════════════════════════

        sock.ev.on(
            'group-participants.update',
            handleGroupParticipantsUpdate
        )

    } catch (error) {

        reconnecting =
            false

        console.error(
            '[START BOT ERROR]',
            error
        )

        console.log(
            'Retrying in 10 seconds...'
        )

        setTimeout(
            startBot,
            10000
        )
    }
}


// ═══════════════════════════════════════════════════════════════
// LOAD COMMANDS THEN START BOT
// ═══════════════════════════════════════════════════════════════

async function boot() {

    try {

        console.log('')

        console.log(
            '╭──────────────────────────────╮'
        )

        console.log(
            `│       ${config.botName} BOOTING        │`
        )

        console.log(
            '╰──────────────────────────────╯'
        )

        console.log('')

        console.log(
            `👑 Owner numbers: ${ownerNumbers.join(', ') || 'none'}`
        )

        console.log(
            `🔐 Sudo numbers: ${sudoNumbers.join(', ') || 'none'}`
        )

        console.log(
            `⚡ Prefix: ${config.prefix}`
        )

        console.log('')

        await loadCommands()

        console.log('')

        await startBot()

    } catch (error) {

        console.error(
            '[BOOT ERROR]',
            error
        )

        process.exit(1)
    }
}


boot()
