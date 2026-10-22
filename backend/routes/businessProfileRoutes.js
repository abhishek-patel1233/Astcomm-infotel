const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, saveProfile } = require('../controllers/businessProfileController');

router.get('/', auth, getProfile);
router.put('/', auth, saveProfile);

module.exports = router;