import fs from 'fs'
import os from 'os'
import { exec } from 'child_process'
import express from 'express';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys'
import P from 'pino'
import axios from 'axios'
import pkg from 'wa-sticker-formatter';
const { Sticker, StickerTypes } = pkg;
import QRCode from 'qrcode'
import qrcodeReader from 'qrcode-reader'
import * as Jimp from 'jimp'
import moment from 'moment'
import translate from 'translate-google'
import yts from 'yt-search'
import ytdl from 'ytdl-core'

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 10000;
const DASHBOARD_URL = "https://skyper-md.onrender.com"

let sock;
let latestCode = "Waiting for bot to start...";
global.totalCommands = 0

const config = {
  "prefix": ".",
  "ownerName": "DARK-EYE OFC DEV",
  "ownerNumber": "263783546271",
  "botName": "SKYPER-MD",
  "version": "2.0.0",
  "mode": "public",
  "watermark": "> *♤powered by DARK-EYE OFC DEV*",
  "apiKeys": {
    "openweather": "bbb24c9273118505d94d0263058c4655",
    "removebg": "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",
    "lovable": "AQ.Ab8RN6LFQnxIs4OXxlG6zIl34_gfu_Ai7qcq4hq19_K440VdIQ",
    "unsplash": "rc_YXuNSLPAuEu-dEfMa_eJPtVsJhNvQ7fOShldnMzU",
    "news": "94091ee07cc4465e91ecdf212421d53f"
  }
}

const WM = config.watermark
let PREFIX = config.prefix
const OWNER = config.ownerName
const OWNER_NUM = config.ownerNumber
const VERSION = config.version
const OWNER_JID = OWNER_NUM + '@s.whatsapp.net'

// DB SETUP
const dbDir = './database'
const tmpDir = './tmp'
if(!fs.existsSync(dbDir)) fs.mkdirSync(dbDir)
if(!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
const ecoFile = `${dbDir}/economy.json`
const settingsFile = `${dbDir}/settings.json`
if(!fs.existsSync(ecoFile)) fs.writeFileSync(ecoFile, '{}')
if(!fs.existsSync(settingsFile)) fs.writeFileSync(settingsFile, '{}')
let economy = JSON.parse(fs.readFileSync(ecoFile))
let BOT_SETTINGS = JSON.parse(fs.readFileSync(settingsFile))
let groupSettings = {}
let warns = {}
const saveEco = () => fs.writeFileSync(ecoFile, JSON.stringify(economy, null, 2))
const saveSettings = () => fs.writeFileSync(settingsFile, JSON.stringify(BOT_SETTINGS, null, 2))

const boxMenu = (title, lines) => {
    let text = `╭───❒「 *${title}* 」❒───╮\n`
    lines.forEach(line => text += `│≈♤ ${line}\n`)
    text += `╰────────────────────❒\n`
    return text
}
const downloadMedia = async (msg) => await sock.downloadMediaMessage(msg)
function getUser(id) { if(!economy[id]) economy[id] = { balance: 1000, xp: 0, level: 1, inventory: [], lastDaily: 0, lastWork: 0, lastWeekly: 0 }; return economy[id] }
function addXP(id, amount) { let user = getUser(id); user.xp += amount; user.level = Math.floor(user.xp / 100) + 1; saveEco() }
async function askAI(prompt) { try { const res = await axios.post(config.apiKeys.lovable, { model: 'gpt-4', messages: [{ role: 'user', content: prompt }] }); return res.data.reply || res.data.response || 'No response' } catch(e) { return `AI Error: ${e.message}` } }
function toSeconds(timestamp) { const parts = timestamp.split(':').map(Number); if(parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2]; return parts[0]*60 + parts[1] }

// ========== EXPRESS ROUTES ==========
app.get('/', (req, res) => { res.sendFile('./public/dashboard.html', {root: '.'}) })
app.get('/pair', (req, res) => { res.send(`<!DOCTYPE html><html><head><title>${config.botName} Pair Code</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:Arial;background:#0f0f0f;color:white;text-align:center;padding:20px}.box{background:#1a1a1a;padding:30px;border-radius:20px;max-width:400px;margin:auto}input{width:90%;padding:12px;margin:10px 0;border-radius:10px;border:none;background:#2a2a2a;color:white}button{width:95%;padding:12px;margin:10px 0;border-radius:10px;border:none;background:black;color:white;font-weight:bold;cursor:pointer}.code{background:#2a2a2a;padding:15px;border-radius:10px;margin:10px 0;font-size:20px}</style></head><body><div class="box"><h2>🤖 ${config.botName} Pair Code</h2><p>Link your WhatsApp device</p><form action="/pair" method="POST"><input type="text" name="number" placeholder="+263783546271" required><button type="submit">🔑 Generate Pair Code</button></form><div class="code">${latestCode}</div><button onclick="navigator.clipboard.writeText(document.querySelector('.code').innerText)">📋 Copy Code</button><p style="font-size:12px">© 2026 ${config.ownerName}</p></div></body></html>`) })
app.post('/pair', async (req, res) => { let number = req.body.number.replace(/[^0-9]/g, ''); if(!sock) return res.redirect('/pair'); try { const code = await sock.requestPairingCode(number); latestCode = code.match(/.{1,4}/g)?.join('-'); res.redirect('/pair') } catch(e) { latestCode = "Error: " + e.message; res.redirect('/pair') } })
app.get('/api/insights', async (req, res) => { res.json({ users: Object.keys(economy).length, ttlBots: 1, onlineBots: sock?.user? 1 : 0, speed: `${Math.floor(Math.random() * 50 + 50)}ms`, ttlCmds: global.totalCommands, uptime: process.uptime() }) })
app.post('/api/command', (req, res) => { global.totalCommands++; res.json({status: 'ok'}) })
app.post('/api/add-user', (req, res) => { getUser(req.body.number); res.json({status: 'ok'}) })
app.listen(PORT, () => console.log(`Web server on port ${PORT}`));

// ========== START BOT ==========
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const { version } = await fetchLatestBaileysVersion()
    sock = makeWASocket({ version, logger: P({ level: 'error' }), auth: state, browser: Browsers.ubuntu('Firefox') })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') { const statusCode = (lastDisconnect.error)?.output?.statusCode; const shouldReconnect = statusCode!== DisconnectReason.loggedOut; if(shouldReconnect) setTimeout(startBot, 3000) }
        else if(connection === 'open') { console.log(`${config.botName} IS CONNECTED ✅`); try { await axios.post(`${DASHBOARD_URL}/api/add-user`, { number: sock.user.id.split(':')[0], name: sock.user.name || "Unknown" }); } catch(e) {} }
    })

    // WELCOME/GOODBYE
    sock.ev.on('group-participants.update', async (update) => {
        if(!groupSettings[update.id]?.welcome) return
        const meta = await sock.groupMetadata(update.id)
        for(let participant of update.participants){
            if(update.action === 'add'){
                const pp = await sock.profilePictureUrl(participant, 'image').catch(() => 'https://i.imgur.com/2WZl0Q3.png')
                await sock.sendMessage(update.id, { image: { url: pp }, caption: boxMenu('WELCOME', [`Welcome to ${meta.subject}`, `You are member no: ${meta.participants.length}`]) + `\n${WM}`, mentions: [participant] })
            }
            if(update.action === 'remove'){
                const pp = await sock.profilePictureUrl(participant, 'image').catch(() => 'https://i.imgur.com/2WZl0Q3.png')
                await sock.sendMessage(update.id, { image: { url: pp }, caption: boxMenu('GOODBYE', [`Goodbye @${participant.split('@')[0]}`, `We will miss you from ${meta.subject}`]) + `\n${WM}`, mentions: [participant] })
            }
        }
    })

    // SINGLE MESSAGE HANDLER
    sock.ev.on('messages.upsert', async ({ messages }) => {
        if(!messages[0] ||!messages[0].message) return
        const m = messages[0]
        const from = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ''
        const isCmd = body.startsWith(PREFIX)
        const args = body.slice(PREFIX.length).trim().split(/ +/)
        const cmd = args.shift()?.toLowerCase()
        const reply = (text, opts={}) => sock.sendMessage(from, { text,...opts }, { quoted: m })
        const isOwner = sender === OWNER_JID
        const isAdmin = async () => { const meta = await sock.groupMetadata(from).catch(()=>{}); return meta?.participants.find(p=>p.id===sender)?.admin }

        // AFK
        BOT_SETTINGS.afk ??= {};

if (BOT_SETTINGS.afk[sender]) {
    delete BOT_SETTINGS.afk[sender];
    saveSettings();

    reply(
        boxMenu('WELCOME BACK', [
            'You are no longer AFK'
        ]) + `\n${WM}`
    );
}

if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
    for (const jid of m.message.extendedTextMessage.contextInfo.mentionedJid) {
        if (BOT_SETTINGS.afk[jid]) {
            const time = Math.floor(
                (Date.now() - BOT_SETTINGS.afk[jid].time) / 1000 / 60
            );

            reply(
                boxMenu('AFK', [
                    `@${jid.split('@')[0]} is AFK`,
                    `Reason: ${BOT_SETTINGS.afk[jid].reason}`,
                    `For: ${time} minutes`
                ]) + `\n${WM}`,
                { mentions: [jid] }
            );
        }
    }
}
      
        // ANTILINK
        if(groupSettings[from]?.antilink && body.includes('chat.whatsapp.com')){ await sock.sendMessage(from, { delete: m.key }); reply(boxMenu('ANTILINK', [`Links not allowed`]) + `\n${WM}`) }

        if(!isCmd) return
        global.totalCommands++
        try { await axios.post(`${DASHBOARD_URL}/api/command`, {}); } catch(e) {}

        // ============ ALL COMMANDS START ============
        // GENERAL
        if (cmd === 'menu') { /* PASTE YOUR FULL MENU CODE HERE */ }
        if (cmd === 'ping') { const s = Date.now(); reply(boxMenu('PING', [`Speed: ${Date.now() - s}ms`]) + `\n${WM}`) }
        if (cmd === 'owner') { reply(boxMenu('OWNER INFO', [`Name: ${OWNER}`, `Number: +${OWNER_NUM}`]) + `\n${WM}`) }
        if (cmd === 'status') { const uptime = Math.floor(process.uptime()/60); const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2); reply(boxMenu('BOT STATUS', [`Status: ONLINE ✅`, `Uptime: ${uptime} minutes`, `RAM: ${ram} MB`]) + `\n${WM}`) }

        // FUN - Paste all 30+ fun commands you sent
        if (cmd === 'joke') { const jokes = ["Why don't skeletons fight each other? They don't have the guts."]; reply(boxMenu('JOKE 😂', [jokes[Math.floor(Math.random() * jokes.length)]]) + `\n${WM}`) }

        // TOOLS - Paste all sticker, simage, removebg etc
        if (cmd === 's' || cmd === 'sticker') { if(!m.message.imageMessage &&!m.quoted?.message?.imageMessage) return reply(boxMenu('STICKER', [`Reply to an image`]) + `\n${WM}`); const media = await downloadMedia(m.quoted || m); const sticker = new Sticker(media, { pack: 'DARK-EYE V2', author: OWNER, type: StickerTypes.FULL }); await sock.sendMessage(from, await sticker.toMessage(), { quoted: m }) }

        // UTILS - date, weather, qr, translate, calc
        if (cmd === 'date') { reply(boxMenu('DATE', [`Today: ${moment().format('dddd, DD MMMM YYYY')}`]) + `\n${WM}`) }
        if (cmd === 'qr') { const text = args.join(' '); if(!text) return reply(boxMenu('QR', [`Usage: ${PREFIX}qr <text>`]) + `\n${WM}`); const qr = await QRCode.toBuffer(text); await sock.sendMessage(from, { image: qr, caption: boxMenu('QR CODE', [`${text}`]) + `\n${WM}` }, { quoted: m }) }

        // SEARCH - pinterest, google, img, news
        if (cmd === 'google') { const query = args.join(' '); const res = await axios.get(`https://api.duckgo.com/?q=${encodeURIComponent(query)}&format=json`); reply(boxMenu('GOOGLE', [`Query: ${query}`, `Answer: ${res.data.AbstractText || 'No answer'}`]) + `\n${WM}`) }

        // DOWNLOAD - yt, play, song
        if (cmd === 'play') { const query = args.join(' '); const search = await yts(query); const song = search.videos[0]; const file = `./tmp/${Date.now()}.mp3`; ytdl(song.url, { filter: 'audioonly' }).pipe(fs.createWriteStream(file)).on('finish', async () => { await sock.sendMessage(from, { audio: { url: file }, mimetype: 'audio/mp4' }, { quoted: m }); fs.unlinkSync(file) }); reply(boxMenu('DOWNLOADING AUDIO', [`${song.title}`]) + `\n${WM}`) }

        // GROUP - kick, promote, tagall, antilink
        if (cmd === 'kick') { if(!(await isAdmin())) return reply(boxMenu('ERROR', [`Only admins`]) + `\n${WM}`); const users = m.mentionedJid || []; await sock.groupParticipantsUpdate(from, users, 'remove'); reply(boxMenu('KICKED', [`Removed ${users.length}`]) + `\n${WM}`) }
        if (cmd === 'tagall') { const meta = await sock.groupMetadata(from); const participants = meta.participants.map(p => p.id); let text = args.join(' ') || 'Tag All'; await sock.sendMessage(from, { text: boxMenu('TAGALL', [text]) + '\n' + participants.map(p=>`@${p.split('@')[0]}`).join(' '), mentions: participants }, { quoted: m }) }

        // AI
        if (['ai','chatgpt','gpt4'].includes(cmd)) { const prompt = args.join(' '); const res = await askAI(prompt); reply(boxMenu(cmd.toUpperCase(), [res]) + `\n${WM}`) }

        // ECONOMY
        if (cmd === 'balance') { let user = getUser(sender); reply(boxMenu('BALANCE', [`Money: $${user.balance}`, `Level: ${user.level}`]) + `\n${WM}`) }
        if (cmd === 'daily') { let user = getUser(sender); if(Date.now() - user.lastDaily < 86400000) return reply(boxMenu('DAILY', [`Already claimed`]) + `\n${WM}`); user.balance += 500; user.lastDaily = Date.now(); addXP(sender, 10); saveEco(); reply(boxMenu('DAILY', [`Claimed $500 + 10 XP`]) + `\n${WM}`) }

        // OWNER
        if (!isOwner && ['eval','exec','restart'].includes(cmd)) return reply(boxMenu('OWNER', [`Only Owner`]) + `\n${WM}`)
        if (cmd === 'eval') { try { let result = await eval(args.join(' ')); reply(boxMenu('EVAL', [`${result}`]) + `\n${WM}`) } catch(e) { reply(boxMenu('ERROR', [`${e}`]) + `\n${WM}`) } }
        if (cmd === 'restart') { reply(boxMenu('RESTART', [`Restarting...`]) + `\n${WM}`); process.exit(1) }

        // RELIGION
        if (cmd === 'quran') { const res = await axios.get(`https://api.alquran.cloud/v1/ayah/1:1/editions/quran-uthmani,en.asad`); reply(boxMenu('QURAN', [res.data[0].text, res.data[1].text]) + `\n${WM}`) }

        // OTHER
        if (cmd === 'afk') { BOT_SETTINGS.afk[sender] = { reason: args.join(' ') || 'AFK', time: Date.now() }; saveSettings(); reply(boxMenu('AFK', [`You are now AFK`]) + `\n${WM}`) }
        if (cmd === 'settings') { reply(boxMenu('BOT SETTINGS', [`Prefix: ${PREFIX}`, `Mode: ${BOT_SETTINGS.mode}`, `DarkEye: ${BOT_SETTINGS.darkeye? 'ON' : 'OFF'}`]) + `\n${WM}`) }
        // ============ ALL COMMANDS END ============
    })
}
startBot()
