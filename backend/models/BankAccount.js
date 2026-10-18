const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    displayName: { type: String, required: true, trim: true },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    asOnDate: { type: Date, default: Date.now },
    printBankDetails: { type: Boolean, default: true },
    printUpiQr: { type: Boolean, default: false },
    upiId: { type: String, trim: true, default: '' },
    accountHolderName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, required: true, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true, default: '' },
    branchName: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BankAccount', bankAccountSchema);