const { createWorker }   = require('../queues/index');
const { computeTrends }  = require('../services/trendService');
const { publishTrends }  = require('../services/redisService');
const TrendSnapshot      = require('../models/TrendSnapshot');

// Debounce — calcule les tendances max 1 fois par minute
let trendTimeout = null;
let jobCount     = 0;

const trendWorker = createWorker('enriched_posts', async (job) => {
  jobCount++;

  // Attend d'avoir traité un batch avant de recalculer
  if (trendTimeout) clearTimeout(trendTimeout);

  trendTimeout = setTimeout(async () => {
    console.log(`[TrendWorker] Calcul tendances après ${jobCount} posts traités`);
    jobCount = 0;

    // 1. Calcule les tendances
    const trends = await computeTrends();

    // 2. Sauvegarde snapshots
    await TrendSnapshot.insertMany(
      trends.map(t => ({ ...t, snapshotAt: new Date() }))
    );

    // 3. Publie sur Redis → WebSocket → Frontend
    await publishTrends(trends);

    console.log(`[TrendWorker] ${trends.length} tendances publiées`);
  }, 30000); // attend 30 secondes après le dernier job

  return { queued: true };
}, {
  concurrency: 1,  // un seul à la fois pour les tendances
});

module.exports = trendWorker;