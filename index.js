const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1299106202042634341';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let lastLink = null;

if (fs.existsSync('last.json')) {
  lastLink = JSON.parse(fs.readFileSync('last.json')).link;
}

async function checkAlphaUpdates() {
  try {
    const { data } = await axios.get('https://hypixel.net/skyblock-alpha/');
    const $ = cheerio.load(data);

    const post = $('a').filter((i, el) =>
      $(el).attr('href')?.includes('/threads/')
    ).first();

    if (!post) return;

    const link = post.attr('href');
    const fullLink = link.startsWith('http')
      ? link
      : `https://hypixel.net${link}`;

    if (fullLink !== lastLink) {
      lastLink = fullLink;
      fs.writeFileSync('last.json', JSON.stringify({ link: fullLink }));

      const channel = await client.channels.fetch(CHANNEL_ID);
      await channel.send(`🧪 New SkyBlock Alpha Update:\n${fullLink}`);
    }

  } catch (err) {
    console.error(err);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  setInterval(checkAlphaUpdates, 300000); // 5 minutes
});

client.login(TOKEN);