const { gql } = require('graphql-tag');

const typeDefs = gql`
  type TopPost {
    title: String
    score: Int
    url: String
  }

  type Trend {
    keyword: String
    count: Int
    totalScore: Int
    avgScore: Int
    totalComments: Int
    subreddits: [String]
    topPost: TopPost
  }

  type Post {
    title: String
    score: Int
    subreddit: String
    keywords: [String]
    createdAt: String
  }

  type Query {
    currentTrends: [Trend]
    history(limit: Int): [Post]
    bySubreddit(name: String): [Post]
  }

  type Subscription {
    trendsUpdated: [Trend]
  }
`;

module.exports = { typeDefs };