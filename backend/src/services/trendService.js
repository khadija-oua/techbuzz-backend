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

  const posts = await Post.find({ collectedAt: { $gte: since } });

  const map = {};

  for (const post of posts) {
    for (const kw of post.keywords || []) {
      if (!map[kw]) {
        map[kw] = {
          keyword:    kw,
          count:      0,
          totalScore: 0,
          totalComments: 0,
          subreddits: new Set(),
          posts:      [],
        };
      }
      map[kw].count++;
      map[kw].totalScore    += post.score;
      map[kw].totalComments += post.numComments;
      map[kw].subreddits.add(post.subreddit);
      map[kw].posts.push({
        title: post.title,
        score: post.score,
        url:   post.url,
      });
    }
  }

  return Object.values(map)
    .map(d => ({
      keyword:       d.keyword,
      count:         d.count,
      totalScore:    d.totalScore,
      avgScore:      Math.round(d.totalScore / d.count),
      totalComments: d.totalComments,
      subreddits:    [...d.subreddits],
      topPost:       d.posts.sort((a, b) => b.score - a.score)[0],
    }))
    .filter(d => d.count >= 2)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 25);
}

module.exports = { extractKeywords, computeTrends };