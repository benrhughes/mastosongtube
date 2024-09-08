const Mastodon = require('mastodon-api');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Mastodon instance URL and username
let MASTODON_INSTANCE_URL = 'https://YOURSERVER';
let USERNAME = 'YOURUSERNAME'; 
// Mastodon access token (create an app in your Mastodon instance to get this token)
let ACCESS_TOKEN = 'YOURTOKEN';

// Output directory and intermediate file
const OUTPUT_DIR = path.join(__dirname, 'output');
const INTERMEDIATE_FILE = path.join(OUTPUT_DIR, 'song_links.txt');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'masto_progress.json');

// Initialize Mastodon API
let M = new Mastodon({
    access_token: ACCESS_TOKEN,
    api_url: `${MASTODON_INSTANCE_URL}/api/v1/`,
});

let progress;

async function getUserId(username) {
    const response = await M.get('accounts/lookup', { acct: username });
    return response.data.id;
}

async function fetchUserFeed(userId) {
    while (true) {
        const params = progress.maxId ? { max_id: progress.maxId } : {};
        params.limit = 1000;
        const response = await M.get(`accounts/${userId}/statuses`, params);
        const fetchedPosts = response.data;

        if (fetchedPosts.length === 0) {
            break;
        }

        const mapped = fetchedPosts.map(x => { return { id: x.id, content: x.content } });
        progress.posts = progress.posts.concat(mapped);
        console.log(`Fetched ${progress.posts.length} posts...`);
        progress.maxId = fetchedPosts[fetchedPosts.length - 1]?.id;
        saveProgress();

    }
}

function filterSongLinkPosts() {
    const songLinkUrlsSet = new Set();
    progress.posts.forEach(post => {
        if (post.content.includes('song.link')) {
            const $ = cheerio.load(post.content);
            $('a').each((i, elem) => {
                const href = $(elem).attr('href');
                if (href && href.includes('song.link')) {
                    songLinkUrlsSet.add(href);
                }
            });
        }
    });
    return Array.from(songLinkUrlsSet);
}

function saveProgress() {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
        progress = JSON.parse(data);
    } else {
        progress = {
            posts: [],
            maxId: null
        };
    }
}

function writeLinksToFile(links) {
    fs.writeFileSync(INTERMEDIATE_FILE, links.join('\n'), 'utf8');
}

function loadConfig() {
    if (fs.existsSync('config.json')) {
        const data = fs.readFileSync('config.json', 'utf8');
        config = JSON.parse(data);
        MASTODON_INSTANCE_URL = config.server;
        USERNAME = config.username;
        ACCESS_TOKEN = config.token; 

        M = new Mastodon({
            access_token: ACCESS_TOKEN,
            api_url: `${MASTODON_INSTANCE_URL}/api/v1/`,
        });
    }
} 

async function main() {
    try {
        loadConfig();

        // Ensure the output directory exists
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        loadProgress();

        console.log(`Fetching user ID for @${USERNAME}...`);
        const userId = await getUserId(USERNAME);

        console.log(`Fetching public feed for @${USERNAME}...`);
        const posts = await fetchUserFeed(userId);

        console.log("Filtering posts with song.link URLs...");
        const songLinks = filterSongLinkPosts();

        if (!songLinks.length) {
            console.log("No song.link URLs found in the user's feed.");
            return;
        }

        console.log(`Writing ${songLinks.length} song.link URLs to intermediate file...`);
        writeLinksToFile(songLinks, 'song_links.txt');

        console.log("Done.");
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();