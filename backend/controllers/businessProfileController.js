const BusinessProfile = require('../models/BusinessProfile');

const FIELDS = [
  'businessName', 'gstin', 'showGstin', 'phone1', 'phone2', 'email', 'address', 'pincode',
  'description', 'logo', 'signature', 'theme', 'businessType', 'category', 'state', 'pan',
  'website', 'terms',
];

// GET /api/business-profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ user: req.user.id }).lean();
    res.json({ profile: profile || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/business-profile  (naya ho to create, warna update)
exports.saveProfile = async (req, res) => {
  try {
    const data = {};
    FIELDS.forEach((k) => {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    });

    ['businessName', 'gstin', 'phone1', 'phone2', 'email', 'address', 'pincode', 'description',
      'businessType', 'category', 'state', 'pan', 'website', 'terms'].forEach((k) => {
      if (data[k] !== undefined) data[k] = String(data[k]).trim();
    });
    if (data.gstin) data.gstin = data.gstin.toUpperCase();
    if (data.pan) data.pan = data.pan.toUpperCase();
    if (data.showGstin !== undefined) data.showGstin = !!data.showGstin;
    if (data.theme !== undefined) data.theme = Math.min(3, Math.max(0, Number(data.theme) || 0));

    // Validation
    if (!data.businessName) return res.status(400).json({ message: 'Business name zaroori hai' });
    if (data.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(data.gstin))
      return res.status(400).json({ message: 'GSTIN galat hai' });
    if (data.phone1 && !/^[0-9]{10}$/.test(data.phone1))
      return res.status(400).json({ message: 'Phone 1 10 digit ka hona chahiye' });
    if (data.phone2 && !/^[0-9]{10}$/.test(data.phone2))
      return res.status(400).json({ message: 'Phone 2 10 digit ka hona chahiye' });
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      return res.status(400).json({ message: 'Email sahi nahi hai' });
    if (data.pincode && !/^[0-9]{6}$/.test(data.pincode))
      return res.status(400).json({ message: 'Pincode 6 digit ka hona chahiye' });
    if (data.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(data.pan))
      return res.status(400).json({ message: 'PAN galat hai' });
    if (data.logo && !String(data.logo).startsWith('data:image/'))
      return res.status(400).json({ message: 'Logo ka format galat hai' });
    if (data.signature && !String(data.signature).startsWith('data:image/'))
      return res.status(400).json({ message: 'Signature ka format galat hai' });

    const profile = await BusinessProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: data },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ message: 'Business profile saved', profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};