const CATEGORIES = {
  'AI': ['ai', 'llm', 'gpt', 'claude', 'gemini', 'pytorch', 
         'tensorflow', 'machine learning', 'deep learning', 'nlp'],
  'Languages': ['python', 'javascript', 'typescript', 'rust', 
                'golang', 'java', 'kotlin', 'swift', 'scala', 'c++'],
  'DevOps': ['docker', 'kubernetes', 'ci/cd', 'devops', 
             'terraform', 'linux', 'aws', 'azure', 'gcp'],
  'Database': ['mongodb', 'postgresql', 'redis', 'mysql', 
               'elasticsearch', 'supabase', 'prisma'],
  'Frontend': ['react', 'vue', 'angular', 'nextjs', 'svelte', 'webassembly'],
};

function getCategory(keywords) {
  for (const [category, words] of Object.entries(CATEGORIES)) {
    if (keywords.some(kw => words.includes(kw))) return category;
  }
  return 'Other';
}

module.exports = { getCategory };