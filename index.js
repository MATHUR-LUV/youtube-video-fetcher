// index.js
require('dotenv').config();
const express = require('express');
const { Queue } = require('bullmq');
const { Video } = require('./models');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;
const redisConnection = { host: 'redis', port: 6379 };
app.use(cors());

// --- Job Scheduler ---
const videoQueue = new Queue('video-fetch-queue', { connection: redisConnection });

async function addRecurringJob() {
  await videoQueue.add('fetch-videos', {}, {
    repeat: { every: 10000 }, // Every 10 seconds
    removeOnComplete: true,
    removeOnFail: true,
  });
  console.log('[API] Recurring job scheduled: Fetch videos every 10 seconds.');
}
addRecurringJob();

// --- API Endpoints ---
app.get('/', (req, res) => res.send('API is running!'));

// GET /api/videos - Paginated list of all videos
app.get('/api/videos', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Video.findAndCountAll({ limit, offset });
    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      videos: rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve videos' });
  }
});

// GET /api/videos/search - Full-text search
app.get('/api/videos/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Search query "q" is required.' });
  }

  const formattedQuery = query.trim().split(/\s+/).join(' & ');

  try {
    const videos = await Video.sequelize.query(
      `SELECT * FROM "Videos"
       WHERE "searchVector" @@ to_tsquery('english', :query)
       ORDER BY ts_rank("searchVector", to_tsquery('english', :query)) DESC`,
      {
        replacements: { query: formattedQuery },
        model: Video,
        mapToModel: true,
      }
    );
    res.json(videos);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[API] Server is running on http://localhost:${PORT}`);
});