// worker.js
const { Worker } = require('bullmq');
const { fetchLatestVideos } = require('./jobs/youtubeFetcher');

const redisConnection = { host: 'redis', port: 6379 };

console.log('Worker started...');

new Worker('video-fetch-queue', async job => {
  console.log(`[Worker] Processing job: ${job.id}`);
  await fetchLatestVideos();
}, { connection: redisConnection });