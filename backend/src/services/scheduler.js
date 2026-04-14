const cron = require('node-cron');
const { fetchAllSubreddits } = require('../collectors/redditCollector');
const { extractKeywords, computeTrends } = require('./trendService');
const { publishTrends } = require('./redisService');
const Post = require('../models/Post');

async function runCollection() {
  console.log('\n[Scheduler] Début de la collecte...');

  // 1. Fetch Reddit
  const posts = await fetchAllSubreddits();

  // 2. Extraire mots-clés et sauvegarder dans MongoDB
  for (const post of posts) {
    post.keywords = extractKeywords(post.title);
    await Post.findOneAndUpdate(
      { redditId: post.redditId },
      post,
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log(`[Scheduler] ${posts.length} posts sauvegardés`);

  // 3. Calculer les tendances
  const trends = await computeTrends();
  console.log(`[Scheduler] ${trends.length} tendances calculées`);

  // 4. Publier sur Redis → Frontend reçoit via Socket.io
  await publishTrends(trends);
}

function startScheduler() {
  // Lancer immédiatement au démarrage
  runCollection().catch(console.error);

  // Puis toutes les 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runCollection().catch(console.error);
  });

  console.log('[Scheduler] Cron job démarré — collecte toutes les 5 min');
}

module.exports = { startScheduler };