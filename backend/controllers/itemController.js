const Item = require('../models/Item');

// GET /api/items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/items
exports.addItem = async (req, res) => {
  try {
    const { itemName, category, unit, salePrice, purchasePrice, openingStock } = req.body;

    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    const stock = Number(openingStock) || 0;

    const item = await Item.create({
      user: req.user.id,
      itemName,
      category,
      unit: unit || 'Pcs',
      salePrice: Number(salePrice) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      openingStock: stock,
      currentStock: stock,
    });

    res.status(201).json({ message: 'Item added', item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/items/:id
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const { itemName, category, unit, salePrice, purchasePrice, openingStock } = req.body;

    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    // Opening stock badalne par current stock bhi usi hisab se adjust hoga
    const newOpening = Number(openingStock) || 0;
    item.currentStock += newOpening - item.openingStock;
    item.openingStock = newOpening;

    item.itemName = itemName;
    item.category = category || '';
    item.unit = unit || 'Pcs';
    item.salePrice = Number(salePrice) || 0;
    item.purchasePrice = Number(purchasePrice) || 0;

    await item.save();
    res.json({ message: 'Item updated', item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/items/:id
exports.deleteItem = async (req, res) => {
  try {
    const deleted = await Item.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};