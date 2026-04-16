const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[MongoDB] Connecté');
 }catch (err) {
    console.error('[DB] Erreur de connexion:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;