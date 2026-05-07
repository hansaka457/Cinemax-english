const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const youtubedl = require('yt-dlp-exec');
const fs = require('fs');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

// QR වෙනුවට Phone Number එකෙන් Pair කරනවා
client.on('loading_screen', (percent, message) => {
    console.log('Loading', percent, message);
});

client.initialize();

// Phone number එක ඉල්ලනවා
readline.question('WhatsApp Number එක දාපන් මචං - Country Code එක්ක +94... : ', async (phoneNumber) => {
    const code = await client.requestPairingCode(phoneNumber);
    console.log(`Pairing Code එක: ${code}`);
    console.log('WhatsApp → Linked Devices → Link with phone number → Code එක ගහපන්');
    readline.close();
});

client.on('ready', () => {
    console.log('Cinemax-english Bot වැඩ කරනවා! 🔥');
});

// .dl command එක
client.on('message', async msg => {
    const text = msg.body;

    if (text === '.help') {
        msg.reply(`*Cinemax Bot* 🎬\n\n.dl <link> - Video Download\n\nEx: .dl https://youtu.be/xxx`);
    }

    if (text.startsWith('.dl ')) {
        const url = text.slice(4).trim();
        if (!url) return msg.reply('Link එකක් දාපන් මචං ❌');
        
        await msg.reply('Video එක බාගන්නවා... ටිකක් ඉන්න 😎');
        
        try {
            const filename = `video_${Date.now()}.mp4`;
            
            await youtubedl(url, {
                output: filename,
                format: 'mp4[height<=480][filesize<15M]',
                noPlaylist: true,
                mergeOutputFormat: 'mp4'
            });

            if (!fs.existsSync(filename)) {
                return msg.reply('Download fail උනා මචං. Link එක Public ද?');
            }

            const stats = fs.statSync(filename);
            if (stats.size > 16 * 1024 * 1024) {
                 await msg.reply('File එක 16MB ට වඩා ලොකුයි මචං ❌');
                 fs.unlinkSync(filename);
                 return;
            }

            const media = MessageMedia.fromFilePath(filename);
            await client.sendMessage(msg.from, media, { caption: 'Downloaded by Cinemax Bot 🎬' });
            fs.unlinkSync(filename);

        } catch (error) {
            console.log(error);
            await msg.reply('අවුලක් උනා මචං ❌\nPrivate/Story Video බෑ.');
        }
    }
});
