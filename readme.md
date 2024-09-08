# MastoSongTube

## Mastodon -> song.link -> youtube

For a given Mastodon account, these scripts:
- find all public posts that contain song.link links
- for each song.link link, find any youtube links
- add the youtube links to a text file 

The file of youtube links can then be passed to other applications for further processing.

## Install

## Prerequisites
Lastest [node.js](https://nodejs.org)

### Get the scripts
```
git clone https://github.com/benrhughes/mastosongtube.git
cd mastosongtube
npm install
```

### Create a Mastodon application
In order to access to mastodon API, you'll need to create a Mastodon application: https://yourserver/settings/applications

### Configure get-masto-songlink
- Open `get-masto-songlinkjs` in a text editor
- Copy your Mastodon application access token to here:
```
const ACCESS_TOKEN = 'YOURTOKEN';
```
- Set the Mastodon instance and username for the user whose posts you want to parse:
```
const MASTODON_INSTANCE_URL = 'https://YOURSERVER';
const USERNAME = 'YOURUSERNAME'; 
```

## Running
There are two scripts; the first to extract data from Mastodon, the second to extra data from song.link. Both store their progress in a temporary file, so if the process is interrupted you can pick it up from where you were.

First, run `get-masto-songlink.js`:
```
node get-masto-songlink.js
```

Then, run `get-songlink-yt.js`:
```
node get-songlink-yt.js
```

An `output` directory will be created, which will contain:
- masto_progress.json : the progress file for the first script
- songlink_progress.json : the progress file for the second script
- song_links.txt : a list of extracted song.link urls
- youtube_links.txt: a list of youtube urls

### NB
If you want to change the account or otherwise start from scratch, delete the `output` folder - otherwise the cached data from the previous run will be used.