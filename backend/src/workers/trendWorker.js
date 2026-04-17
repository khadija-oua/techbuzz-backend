const { createWorker }   = require('../queues/index');
const { computeTrends }  = require('../services/trendService');
const { publishTrends }  = require('../services/redisService');
const TrendSnapshot      = require('../models/TrendSnapshot');



let trendCount   = 0;
let failedCount  = 0;

// Worker qui écoute la queue enriched_posts
const trendWorker = createWorker('enriched_posts', async (job) => {
    return { queued: true};
    },{
      concurrency: 1, 
    });
    setInterval(async () => {
    console.log('[TrendWorker] Calcul périodique des tendances…');
    try {

      // 1. Calcule les tendances
      const trends = await computeTrends();

      if (trends.length > 0) {
      await TrendSnapshot.insertMany(
        trends.map(t => ({ ...t, snapshotAt: new Date() }))
      );

      trendCount += trends.length;

      // 3. Publie sur Redis → WebSocket → Frontend
      await publishTrends(trends);

      console.log(`[TrendWorker] ${trends.length} tendances insérées et publiées`);
    } else {
      console.log('[TrendWorker] Aucune tendance calculée');
      }
    } catch (err) {
      failedCount++;
      console.error('[TrendWorker] Erreur calcul tendances:', err.message);
    }
  }, 60000); // toutes les 60 secondesb

// Stats toutes les minutes
setInterval(() => {
  console.log(`[TrendWorker] Stats — snapshots: ${trendCount} | erreurs: ${failedCount}`);
}, 60000);

module.exports = trendWorker;

