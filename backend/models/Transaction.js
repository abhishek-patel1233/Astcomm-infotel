const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: 'Pcs' },
    rate: { type: Number, required: true },
    gstRate: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['SALE', 'PURCHASE'], default: 'SALE' },
    invoiceNo: { type: Number, required: true },
    date: { type: Date, required: true },
    partyName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    paymentType: { type: String, enum: ['Credit', 'Cash'], default: 'Credit' },
    items: { type: [itemSchema], default: [] },
    subTotal: { type: Number, default: 0 },
    totalGst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ek user ke liye ek type me invoice number unique
transactionSchema.index({ user: 1, type: 1, invoiceNo: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', transactionSchema);