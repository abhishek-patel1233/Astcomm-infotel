const Transaction = require('../models/Transaction');


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

// GET /api/transactions/  -> all transactions of logged-in user
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = transactions.map((t) => ({
      ...t,
      date: formatDate(t.date),
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/transactions/add  -> next invoice number
exports.getNextInvoiceNo = async (req, res) => {
  try {
    const last = await Transaction.findOne({ user: req.user.id, type: 'SALE' })
      .sort({ invoiceNo: -1 })
      .select('invoiceNo');

    res.json({ invoiceNo: last ? last.invoiceNo + 1 : 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/transactions/add  -> save sale
exports.addTransaction = async (req, res) => {
  try {
    const { invoiceNo, date, partyName, phone, paymentType, items, type } = req.body;

    if (!partyName) {
      return res.status(400).json({ message: 'Customer name is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Add at least one item' });
    }

    // Totals backend par dobara calculate (security)
    let subTotal = 0;
    let totalGst = 0;
    const cleanItems = items.map((it) => {
      const quantity = Number(it.quantity) || 1;
      const rate = Number(it.rate) || 0;
      const gstRate = Number(it.gstRate) || 0;
      const base = quantity * rate;
      const gstAmount = (base * gstRate) / 100;
      subTotal += base;
      totalGst += gstAmount;
      return {
        itemName: it.itemName,
        quantity,
        unit: it.unit || 'Pcs',
        rate,
        gstRate,
        gstAmount,
        amount: base + gstAmount,
      };
    });

    const total = subTotal + totalGst;
    const pay = paymentType === 'Cash' ? 'Cash' : 'Credit';

    const transaction = await Transaction.create({
      user: req.user.id,
      type: type || 'SALE',
      invoiceNo: Number(invoiceNo),
      date: parseDate(date),
      partyName,
      phone,
      paymentType: pay,
      items: cleanItems,
      subTotal,
      totalGst,
      total,
      balance: pay === 'Credit' ? total : 0,
    });

    res.status(201).json({ message: 'Sale saved', transaction });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Invoice number already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};