const mongoose = require('mongoose');

const TrendSnapshotSchema = new mongoose.Schema({
  keyword:       { type: String, required: true },
  count:         { type: Number },
  totalScore:    { type: Number },
  avgScore:      { type: Number },
  momentum:      { type: Number },
  avgSentiment:  { type: Number },
  category:      { type: String },
  snapshotAt:    { type: Date, default: Date.now },
});

TrendSnapshotSchema.index({ keyword: 1, snapshotAt: -1 });

module.exports = mongoose.model('TrendSnapshot', TrendSnapshotSchema);