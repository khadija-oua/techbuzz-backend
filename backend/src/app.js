require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { createClient } = require('redis');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend opérationnel' });
});

async function start() {
  // Connexion MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connecté');

  // Connexion Redis
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  console.log('Redis connecté');

  app.listen(process.env.PORT, () => {
    console.log(`Serveur actif sur http://localhost:${process.env.PORT}`);
  });
}

start().catch(console.error);