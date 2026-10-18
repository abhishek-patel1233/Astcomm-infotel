const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  balance: { type: Number, default: 0 },
  balanceType: { type: String, enum: ['Receive', 'Pay'], default: 'Receive' }
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);