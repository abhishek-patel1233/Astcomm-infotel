const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTransactions,
  getNextInvoiceNo,
  addTransaction,
} = require('../controllers/transactions');

router.get('/', auth, getTransactions);
router.get('/add', auth, getNextInvoiceNo);
router.post('/add', auth, addTransaction);


module.exports = router;