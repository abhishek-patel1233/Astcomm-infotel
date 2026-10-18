const BankAccount = require('../models/BankAccount');

// "dd/mm/yyyy" -> Date
const parseDate = (str) => {
  if (!str) return new Date();
  const [d, m, y] = String(str).split('/');
  const parsed = new Date(`${y}-${m}-${d}T00:00:00`);
  return isNaN(parsed) ? new Date() : parsed;
};

// Date -> "dd/mm/yyyy"
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

// GET /api/bank-accounts
exports.getBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(accounts.map((a) => ({ ...a, asOnDate: formatDate(a.asOnDate) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/bank-accounts
exports.addBankAccount = async (req, res) => {
  try {
    const {
      displayName, openingBalance, asOnDate, printBankDetails, printUpiQr,
      upiId, accountHolderName, accountNumber, ifscCode, branchName,
    } = req.body;

    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ message: 'Bank name is required' });
    }
    if (!accountNumber || !String(accountNumber).trim()) {
      return res.status(400).json({ message: 'Account number is required' });
    }

    const opening = Number(openingBalance) || 0;

    const account = await BankAccount.create({
      user: req.user.id,
      displayName,
      openingBalance: opening,
      currentBalance: opening,
      asOnDate: parseDate(asOnDate),
      printBankDetails: !!printBankDetails,
      printUpiQr: !!printUpiQr,
      upiId,
      accountHolderName,
      accountNumber: String(accountNumber),
      ifscCode,
      branchName,
    });

    res.status(201).json({ message: 'Bank account added', account });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/bank-accounts/:id
exports.deleteBankAccount = async (req, res) => {
  try {
    const deleted = await BankAccount.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!deleted) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Bank account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};