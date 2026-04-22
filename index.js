const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1299106202042634341';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let seenLinks = new Set();

// load old data
if (fs.existsSync('data.json')) {
  const saved = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  seenLinks = new Set(saved.seenLinks || []);
}

async function fetchAllPosts() {
  const { data } = await axios.get('https://hypixel.net/skyblock-alpha/');
  const $ = cheerio.load(data);

  const links = [];

  $('a').each((i, el) => {
    const href = $(el).attr('href');

    if (href && href.includes('/threads/')) {
      const fullLink = href.startsWith('http')
        ? href
        : `https://hypixel.net${href}`;

      links.push(fullLink);
    }
  });

  // remove duplicates
  return [...new Set(links)];
}

async function checkAlphaUpdates() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const links = await fetchAllPosts();

    // newest first
    const newLinks = links.filter(link => !seenLinks.has(link));

    if (newLinks.length === 0) return;

    // send oldest first so it reads naturally
    newLinks.reverse();

    for (const link of newLinks) {
      await channel.send(`🧪 SkyBlock Alpha Update:\n${link}`);
      seenLinks.add(link);
    }

    fs.writeFileSync(
      'data.json',
      JSON.stringify({ seenLinks: [...seenLinks] }, null, 2)
    );

  } catch (err) {
    console.error(err);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // 🔥 send all missed posts on startup
  await checkAlphaUpdates();

  setInterval(checkAlphaUpdates, 300000); // 5 min
});

client.login(TOKEN);
