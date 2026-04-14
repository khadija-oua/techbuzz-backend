const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { getLatestTrends } = require('../services/redisService');

// Tendances actuelles (depuis cache Redis)
router.get('/current', async (req, res) => {
  const trends = await getLatestTrends();
  res.json(trends || []);
});

// Historique des posts MongoDB
router.get('/history', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
  res.json(posts);
});

// Filtrer par subreddit
router.get('/subreddit/:name', async (req, res) => {
  const posts = await Post.find({ subreddit: req.params.name })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(posts);
});

module.exports = router;