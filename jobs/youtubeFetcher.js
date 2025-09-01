// jobs/youtubeFetcher.js
require('dotenv').config();
const { google } = require('googleapis');
const { Video } = require('../models');

// --- API Key Management ---
const API_KEYS = process.env.YOUTUBE_API_KEYS.split(',');
let currentKeyIndex = 0;

const getYoutubeService = () => {
  const key = API_KEYS[currentKeyIndex];
  return google.youtube({ version: 'v3', auth: key });
};

// --- Main Fetch Logic ---
const fetchLatestVideos = async () => {
  let youtube = getYoutubeService();

  const latestVideo = await Video.findOne({ order: [['publishedAt', 'DESC']] });
  const publishedAfter = latestVideo 
    ? new Date(latestVideo.publishedAt.getTime() + 1000).toISOString()
    : new Date(Date.now() - 120000).toISOString(); // Default to 2 mins ago on first run

  try {
    const response = await youtube.search.list({
      q: 'football',
      part: 'snippet',
      type: 'video',
      order: 'date',
      maxResults: 50,
      publishedAfter,
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      console.log('No new videos found.');
      return;
    }

    const videoData = items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails.default.url,
    }));
    
    // Efficiently insert new videos or ignore duplicates
    await Video.bulkCreate(videoData, { ignoreDuplicates: true });
    console.log(`[Worker] Successfully stored ${videoData.length} new videos.`);

  } catch (err) {
    if (err.code === 403 || (err.response && err.response.status === 403)) {
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      console.warn(`[Worker] API key quota likely exhausted. Switched to key index ${currentKeyIndex}.`);
    } else {
      console.error('[Worker] Error fetching videos:', err.message);
    }
  }
};

module.exports = { fetchLatestVideos };