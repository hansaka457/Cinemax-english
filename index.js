const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const youtubedl = require('yt-dlp-exec');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
    console.log('QR Code එක Scan කරපන් මචං');
});

client.on('ready', () => {
    console.log('Cinemax-english Bot වැඩ කරනවා! 🔥');
});

client.on('message', async msg => {
    const text = msg.body;

    // .help command
    if (text === '.help') {
        msg.reply(`*Cinemax-english Bot* 🎬\n\n*Commands:*\n.dl <link> - YouTube/TikTok/FB/Insta Video Download\n\n*Example:* .dl https://youtu.be/dQw4w9WgXcQ`);
    }

    // .dl command - Video Download
    if (text.startsWith('.dl ')) {
        const url = text.slice(4).trim();
        if (!url) return msg.reply('Link එකක් දාපන් මචං ❌');

        await msg.reply('Video එක බාගන්නවා... ටිකක් ඉන්න 😎');
        
        try {
            const filename = `video_${Date.now()}.mp4`;
            
            // yt-dlp use කරලා download කරනවා
            await youtubedl(url, {
                output: filename,
                format: 'mp4[height<=480][filesize<15M]', // 480p, 15MB අඩු
                noPlaylist: true,
                mergeOutputFormat: 'mp4'
            });

            // File එක තියෙනවද බලනවා
            if (!fs.existsSync(filename)) {
                return msg.reply('Download fail උනා මචං. Link එක හරිද බලපන්');
            }

            // Size check - 16MB limit
            const stats = fs.statSync(filename);
            if (stats.size > 16 * 1024 * 1024) {
                 await msg.reply('File එක 16MB ට වඩා ලොකුයි මචං. පොඩි Video එකක් දාපන් ❌');
                 fs.unlinkSync(filename);
                 return;
            }

            const media = MessageMedia.fromFilePath(filename);
            await client.sendMessage(msg.from, media, { caption: 'Downloaded by Cinemax Bot 🎬' });
            
            // Download කරපු File එක Delete කරනවා
            fs.unlinkSync(filename);

        } catch (error) {
            console.log(error);
            await msg.reply('අවුලක් උනා මචං ❌\nLink එක Public ද? Private/Story Video බෑ.');
        }
    }
});

client.initialize();
