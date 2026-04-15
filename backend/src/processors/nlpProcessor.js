const { extractKeywords } = require('../services/trendService');
const { analyzeSentiment } = require('../services/sentimentService');
const { getCategory }      = require('../services/categoryService');

function enrichPost(post) {
  const keywords = extractKeywords(post.title);
  const { sentiment, sentimentScore } = analyzeSentiment(post.title);
  const category = getCategory(keywords);

  // Score d'engagement normalisé
  const engagementScore = Math.log1p(post.score) * 
    (1 + post.upvoteRatio) * 
    Math.log1p(post.numComments + 1);

  return {
    ...post,
    keywords,
    sentiment,
    sentimentScore,
    category,
    engagementScore: Math.round(engagementScore * 100) / 100,
    enrichedAt: new Date(),
  };
}

module.exports = { enrichPost };