const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Output directory and intermediate files
const OUTPUT_DIR = path.join(__dirname, 'output');
const INTERMEDIATE_FILE = path.join(OUTPUT_DIR, 'song_links.txt');
const YOUTUBE_LINKS_FILE = path.join(OUTPUT_DIR, 'youtube_links.txt');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'songlink_progress.json');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchYouTubeLinks(songLinks) {
    console.log("Fetching YouTube links from song.link pages...");
    try {
        for (; progress.index < songLinks.length; progress.index++) {
            console.log(`Processing song.link ${progress.index + 1} of ${songLinks.length}`)
            const link = songLinks[progress.index];
            const response = await axios.get(link, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br'
                }
            });
            const $ = cheerio.load(response.data);
            $('a').each((i, elem) => {
                const href = $(elem).attr('href');
                if (href && (href.includes('www.youtube.com') || href.includes('youtu.be'))) {
                    progress.links.add(href);
                }
            });

            saveProgress();
            // Sleep for 10 second between requests
            await sleep(10000);
        }
    } catch (error) {
        console.error(`Error fetching ${link}: ${error.message}`);
    }
}

function writeLinksToFile() {
    // Write the file to the output directory
    console.log(`Writing ${progress.links.length} YouTube links to file...`);
    fs.writeFileSync(YOUTUBE_LINKS_FILE, Array.from(progress.links).join('\n'), 'utf8');
}

function saveProgress() {
    const data = {
        links: Array.from(progress.links),
        index: progress.index
    };

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
        const parsed = JSON.parse(data);
        progress = {
            links: new Set(parsed.links),
            index: parsed.index
        }
    } else {
        progress = {
            links: new Set(),
            index: 0
        };
    }
}
async function main() {
    try {
        loadProgress();

        console.log("Reading song.link URLs from intermediate file...");
        const songLinks = fs.readFileSync(INTERMEDIATE_FILE, 'utf8').split('\n').filter(link => link);

        if (!songLinks.length) {
            console.log("No song.link URLs found in the intermediate file.");
            return;
        }

        await fetchYouTubeLinks(songLinks);

        writeLinksToFile();

        console.log("Done.");
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();