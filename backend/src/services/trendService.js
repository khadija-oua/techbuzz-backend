const EnrichedPost = require('../models/EnrichedPost');


function extractKeywords(title) {
  if (!title) return [];
  return title
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9]/gi, '')) // nettoyage des caractères spéciaux
    .filter(word => word.length > 3); // filtre les stopwords trop courts
}

async function computeTrends(hoursBack = 24) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const posts = await EnrichedPost.find({ enrichedAt: { $gte: since } });
  const recentPosts = await EnrichedPost.find({ enrichedAt: { $gte: oneHourAgo } });

  // Compter les occurrences récentes pour le momentum
  const recentMap = {};
  for (const post of recentPosts) {
    for (const kw of post.keywords || []) {
      recentMap[kw] = (recentMap[kw] || 0) + 1;
    }
  }

  const map = {};
  for (const post of posts) {
    for (const kw of post.keywords || []) {
      if (!map[kw]) {
        map[kw] = {
          keyword: kw,
          count: 0,
          totalScore: 0,
          recentCount: recentMap[kw] || 0,
          sentimentScores: [],
          sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
          category: post.category || null,
        };
      }
      map[kw].count++;
      map[kw].totalScore += post.engagementScore || 0;
      map[kw].sentimentScores.push(post.sentimentScore || 0);

      // Distribution des sentiments
      if (post.sentiment === 'positive') map[kw].sentimentDistribution.positive++;
      else if (post.sentiment === 'negative') map[kw].sentimentDistribution.negative++;
      else map[kw].sentimentDistribution.neutral++;
    }
  }

  return Object.values(map)
    .map(d => {
      const avgScore = d.count > 0 ? Math.round(d.totalScore / d.count) : 0;
      const momentum = d.count > 0 ? Math.round((d.recentCount / d.count) * 100) : 0;
      const avgSentiment = d.sentimentScores.length > 0
        ? d.sentimentScores.reduce((a, b) => a + b, 0) / d.sentimentScores.length
        : 0;

      return {
        keyword: d.keyword,
        count: d.count,
        totalScore: d.totalScore,
        avgScore,
        momentum,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        sentimentDistribution: d.sentimentDistribution,
        category: d.category,
      };
    })
    .filter(d => d.count >= 2)
    .sort((a, b) => (b.totalScore + b.momentum * 10) - (a.totalScore + a.momentum * 10))
    .slice(0, 40);
}

module.exports = { extractKeywords, computeTrends};
