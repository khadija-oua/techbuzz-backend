const { createClient } = require('redis');

const publisher  = createClient({ url: process.env.REDIS_URL });
const subscriber = createClient({ url: process.env.REDIS_URL });

async function connect() {
  await publisher.connect();
  await subscriber.connect();
  console.log('[Redis] Connecté');
}

async function publishTrends(trends) {
  await publisher.publish('trends:update', JSON.stringify(trends));
  await publisher.setEx('trends:latest', 300, JSON.stringify(trends));
  console.log('[Redis] Tendances publiées');
}

async function getLatestTrends() {
  const cached = await publisher.get('trends:latest');
  return cached ? JSON.parse(cached) : null;
}

module.exports = { connect, publishTrends, getLatestTrends, subscriber, publisher };