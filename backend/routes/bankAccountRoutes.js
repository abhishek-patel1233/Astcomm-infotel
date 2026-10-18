const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getBankAccounts,
  addBankAccount,
  deleteBankAccount,
} = require('../controllers/bankAccountController');

router.get('/', auth, getBankAccounts);
router.post('/', auth, addBankAccount);
router.delete('/:id', auth, deleteBankAccount);

module.exports = router;