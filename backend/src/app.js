require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');

const { connect: connectRedis, subscriber, getLatestTrends } = require('./services/redisService');
const { startScheduler } = require('./services/scheduler');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Route santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route tendances actuelles (depuis cache Redis)
app.get('/api/trends/current', async (req, res) => {
  const trends = await getLatestTrends();
  res.json(trends || []);
});

// WebSocket : relais Redis → Frontend
async function setupRedisListener() {
  await subscriber.subscribe('trends:update', (message) => {
    console.log('[Socket.io] Push tendances vers frontend');
    io.emit('trends:update', JSON.parse(message));
  });
}

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[MongoDB] Connecté');

  await connectRedis();
  await setupRedisListener();

  startScheduler();

  server.listen(process.env.PORT || 3001, () => {
    console.log(`[Express] Serveur actif sur http://localhost:${process.env.PORT || 3001}`);
  });
}

start().catch(console.error);