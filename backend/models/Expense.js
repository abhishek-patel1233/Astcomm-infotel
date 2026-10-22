const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expenseNo: { type: Number, default: 0 },
    category: { type: String, trim: true, default: 'Other' },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    paymentMode: { type: String, enum: ['Cash', 'Bank', 'UPI'], default: 'Cash' },
    paidTo: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);