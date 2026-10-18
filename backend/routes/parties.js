const router = require('express').Router();
const Party = require('../models/Party');
const auth = require('../middleware/auth');

// GET all parties for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const parties = await Party.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(parties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD a new party
router.post('/add', auth, async (req, res) => {
  try {
    const { name, phone, address, balance, balanceType } = req.body;
    
    const newParty = new Party({
      user: req.user.id,
      name,
      phone,
      address,
      balance,
      balanceType
    });

    const savedParty = await newParty.save();
    res.status(201).json(savedParty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;