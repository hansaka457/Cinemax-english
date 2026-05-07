const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const youtubedl = require('yt-dlp-exec')
const fs = require('fs')
const pino = require('pino')
const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => res.send('Cinemax Bot Online! 🔥'))
app.listen(PORT, () => console.log('Server Started'))

// GitHub Secret එකෙන් Session ගන්න
async function writeSession() {
    const SESSION_ID = process.env.SESSION_ID
    if (!SESSION_ID) return console.log('Scan QR First')

    const decoded = Buffer.from(SESSION_ID, 'base64').toString('utf-8')
    if (!fs.existsSync('./auth')) fs.mkdirSync('./auth')
    fs.writeFileSync('./auth/creds.json', decoded)
}

async function startBot() {
    await writeSession()
    const { state, saveCreds } = await useMultiFileAuthState('auth')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['Cinemax Bot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if(qr) console.log('QR:', qr)

        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('Cinemax Bot වැඩ කරනවා! 🔥')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if(!msg.message || msg.key.fromMe) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        const from = msg.key.remoteJid

        if(text === '.help') {
            await sock.sendMessage(from, { text: '*Cinemax Bot* 🎬\n\n.dl <link> - Video Download' })
        }

        if(text?.startsWith('.dl ')) {
            const url = text.slice(4).trim()
            if(!url) return await sock.sendMessage(from, { text: 'Link එකක් දාපන් මචං ❌' })

            await sock.sendMessage(from, { text: 'Video එක බාගන්නවා... ටිකක් ඉන්න 😎' })

            try {
                const filename = `video_${Date.now()}.mp4`
                await youtubedl(url, {
                    output: filename,
                    format: 'best[ext=mp4][filesize<16M]/best[filesize<16M]'
                })

                if (!fs.existsSync(filename)) {
                    return await sock.sendMessage(from, { text: 'Download fail උනා මචං' })
                }

                await sock.sendMessage(from, {
                    video: fs.readFileSync(filename),
                    caption: 'Downloaded by Cinemax Bot 🎬'
                })
                fs.unlinkSync(filename)
            } catch (error) {
                await sock.sendMessage(from, { text: 'අවුලක් උනා මචං ❌' })
            }
        }
    })
}

startBot()
