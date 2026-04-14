const Post = require('../models/Post');

const TECH_KEYWORDS = [
  // Langages
  'python', 'javascript', 'typescript', 'rust', 'golang', 'java',
  'kotlin', 'swift', 'php', 'ruby', 'scala', 'cpp', 'c++',
  // Frameworks
  'react', 'vue', 'angular', 'nextjs', 'svelte', 'fastapi',
  'django', 'flask', 'express', 'spring', 'laravel',
  // IA / ML
  'ai', 'machine learning', 'deep learning', 'llm', 'gpt',
  'chatgpt', 'claude', 'gemini', 'tensorflow', 'pytorch',
  'neural network', 'nlp', 'computer vision',
  // DevOps / Cloud
  'docker', 'kubernetes', 'aws', 'azure', 'gcp',
  'terraform', 'devops', 'ci/cd', 'linux',
  // Bases de données
  'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
  'sqlite', 'supabase', 'prisma',
  // Tendances
  'webassembly', 'wasm', 'blockchain', 'web3', 'graphql',
  'microservices', 'serverless', 'edge computing',
];

function extractKeywords(title) {
  const lower = title.toLowerCase();
  return TECH_KEYWORDS.filter(kw => lower.includes(kw));
}

async function computeTrends(hoursBack = 24) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const posts = await Post.find({ collectedAt: { $gte: since } });
  const recentPosts = await Post.find({ collectedAt: { $gte: oneHourAgo } });

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
          totalComments: 0,
          recentCount: recentMap[kw] || 0,
          sentimentScores: [],
          subreddits: new Set(),
          posts: [],
        };
      }
      map[kw].count++;
      map[kw].totalScore += post.score;
      map[kw].totalComments += post.numComments;
      map[kw].subreddits.add(post.subreddit);
      map[kw].sentimentScores.push(post.sentimentScore || 0);
      map[kw].posts.push({ title: post.title, score: post.score, url: post.url });
    }
  }

  return Object.values(map)
    .map(d => {
      const avgScore = Math.round(d.totalScore / d.count);
      const momentum = d.count > 0 
        ? Math.round((d.recentCount / d.count) * 100) 
        : 0;
      const avgSentiment = d.sentimentScores.length > 0
        ? d.sentimentScores.reduce((a, b) => a + b, 0) / d.sentimentScores.length
        : 0;

      return {
        keyword: d.keyword,
        count: d.count,
        totalScore: d.totalScore,
        avgScore,
        totalComments: d.totalComments,
        momentum,        // % des mentions dans la dernière heure
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        subreddits: [...d.subreddits],
        topPost: d.posts.sort((a, b) => b.score - a.score)[0],
      };
    })
    .filter(d => d.count >= 2)
    .sort((a, b) => (b.totalScore + b.momentum * 10) - (a.totalScore + a.momentum * 10))
    .slice(0, 50);
}

module.exports = { extractKeywords, computeTrends };