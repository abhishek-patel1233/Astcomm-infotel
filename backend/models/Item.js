const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemName: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: '' },
    unit: { type: String, default: 'Pcs' },
    salePrice: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    openingStock: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
  },
  { timestamps: true } // createdAt / updatedAt, jo detail popup me "Added On" aur "Last Updated" dikhate hain
);

module.exports = mongoose.model('Item', itemSchema);