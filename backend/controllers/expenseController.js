const Expense = require('../models/Expense');

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
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const MODES = ['Cash', 'Bank', 'UPI'];

// GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const list = await Expense.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 }).lean();
    res.json(list.map((e) => ({ ...e, date: formatDate(e.date) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/expenses
exports.addExpense = async (req, res) => {
  try {
    const { category, amount, date, paymentMode, paidTo, note } = req.body;

    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ message: 'Amount 0 se zyada hona chahiye' });

    const last = await Expense.findOne({ user: req.user.id }).sort({ expenseNo: -1 }).select('expenseNo');

    const expense = await Expense.create({
      user: req.user.id,
      expenseNo: last ? last.expenseNo + 1 : 1,
      category: (category || 'Other').trim(),
      amount: amt,
      date: parseDate(date),
      paymentMode: MODES.includes(paymentMode) ? paymentMode : 'Cash',
      paidTo,
      note,
    });

    res.status(201).json({ message: 'Expense added', expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const { category, amount, date, paymentMode, paidTo, note } = req.body;

    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ message: 'Amount 0 se zyada hona chahiye' });

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        $set: {
          category: (category || 'Other').trim(),
          amount: amt,
          date: parseDate(date),
          paymentMode: MODES.includes(paymentMode) ? paymentMode : 'Cash',
          paidTo: paidTo || '',
          note: note || '',
        },
      },
      { new: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    res.json({ message: 'Expense updated', expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};