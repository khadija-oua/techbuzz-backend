const { createWorker }   = require('../queues/index');
const { computeTrends }  = require('../services/trendService');
const { publishTrends }  = require('../services/redisService');
const TrendSnapshot      = require('../models/TrendSnapshot');

let trendTimeout = null;
let jobCount     = 0;
let trendCount   = 0;
let failedCount  = 0;

const trendWorker = createWorker('enriched_posts', async (job) => {
  jobCount++;

  if (trendTimeout) clearTimeout(trendTimeout);

  trendTimeout = setTimeout(async () => {
    console.log(`[TrendWorker] Calcul tendances après ${jobCount} posts traités`);
    jobCount = 0;

    try {
      // 1. Calcule les tendances
      const trends = await computeTrends();

      // 2. Sauvegarde snapshots
      await TrendSnapshot.insertMany(
        trends.map(t => ({ ...t, snapshotAt: new Date() }))
      );

      trendCount += trends.length;

      // 3. Publie sur Redis → WebSocket → Frontend
      await publishTrends(trends);

      console.log(`[TrendWorker] ${trends.length} tendances publiées`);
    } catch (err) {
      failedCount++;
      console.error('[TrendWorker] Erreur calcul tendances:', err.message);
    }
  }, 60000); // 1 minute après le dernier job

  return { queued: true };
}, {
  concurrency: 1,
});

// Stats toutes les minutes
setInterval(() => {
  console.log(`[TrendWorker] Stats — snapshots: ${trendCount} | erreurs: ${failedCount}`);
}, 60000);

module.exports = trendWorker;
