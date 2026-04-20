const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Connexion Redis dédiée pour la communication avec Python
const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
});

// Cache pour les callbacks de réponses (job_id → resolve/reject)
const pendingJobs = new Map();

/**
 * Envoie un post au worker Python pour traitement NLP
 * @param {Object} post - Post IT filtré
 * @returns {Promise<Object>} Résultat NLP (keywords, entities, sentiment)
 */
async function processWithPythonNLP(post) {
  const jobId = uuidv4();
  const timeout = 10000; // 10s max pour le traitement NLP

  return new Promise((resolve, reject) => {
    // 1. Préparer le message pour Python
    const message = {
      job_id: jobId,
      post_id: post._id?.toString() || post.redditId,
      title: post.title || '',
      content: post.content || '',
      source: 'reddit',
      language: 'en',
      timeout_ms: timeout
    };

    // 2. Enregistrer le callback pour la réponse
    const timeoutId = setTimeout(() => {
      pendingJobs.delete(jobId);
      logger.warn(`⏰ Timeout NLP pour job ${jobId}`);
      reject(new Error('NLP processing timeout'));
    }, timeout);

    pendingJobs.set(jobId, { resolve, reject, timeoutId });

    // 3. Publier dans la queue Redis
    redis.lpush('nlp_queue', JSON.stringify(message))
      .then(() => {
        logger.debug(`📤 Post envoyé au NLP worker: job_id=${jobId}`);
      })
      .catch(err => {
        pendingJobs.delete(jobId);
        clearTimeout(timeoutId);
        logger.error(`❌ Erreur envoi NLP queue: ${err.message}`);
        reject(err);
      });
  });
}

/**
 * Écoute les réponses du worker Python (à appeler une fois au démarrage de l'app)
 */
function listenForNLPResults() {
  logger.info('👂 Écoute des réponses NLP sur "nlp_results_queue"...');
  
  // Utiliser blpop pour bloquer jusqu'à recevoir un message
  async function waitForResults() {
    while (true) {
      try {
        const result = await redis.brpop('nlp_results_queue', 0); // 0 = bloquant infini
        if (!result) continue;
        
        const [, rawResponse] = result;
        const response = JSON.parse(rawResponse);
        const jobId = response.job_id;
        
        const callback = pendingJobs.get(jobId);
        if (callback) {
          clearTimeout(callback.timeoutId);
          pendingJobs.delete(jobId);
          
          if (response.status === 'success') {
            logger.debug(`✅ Réponse NLP reçue: job_id=${jobId}`);
            callback.resolve(response.result);
          } else {
            logger.warn(`⚠️ Erreur NLP pour job ${jobId}: ${response.error?.message}`);
            callback.reject(new Error(response.error?.message || 'NLP processing failed'));
          }
        } else {
          logger.debug(`ℹ️  Réponse NLP orpheline (job_id=${jobId})`);
        }
      } catch (err) {
        logger.error(`❌ Erreur écoute résultats NLP: ${err.message}`);
        await new Promise(r => setTimeout(r, 1000)); // Backoff simple
      }
    }
  }
  
  // Démarrer la boucle d'écoute en arrière-plan
  waitForResults().catch(err => logger.error('🛑 Boucle écoute NLP arrêtée:', err));
}

// Connexion initiale
redis.connect().catch(err => logger.error('❌ Échec connexion Redis bridge:', err));

module.exports = {
  processWithPythonNLP,
  listenForNLPResults,
  redis
};