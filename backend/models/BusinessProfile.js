const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema(
  {
    // ek user ka ek hi profile
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    businessName: { type: String, required: true, trim: true },
    gstin: { type: String, trim: true, uppercase: true, default: '' },
    showGstin: { type: Boolean, default: false },
    phone1: { type: String, trim: true, default: '' },
    phone2: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },

    logo: { type: String, default: '' }, // base64 image
    signature: { type: String, default: '' }, // base64 image
    theme: { type: Number, default: 0, min: 0, max: 3 },

    businessType: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pan: { type: String, trim: true, uppercase: true, default: '' },
    website: { type: String, trim: true, default: '' },
    terms: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);