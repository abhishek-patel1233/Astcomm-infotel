require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const  party = require('./routes/parties');

console.log(process.env.PORT);
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB Connection Failed:", err));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions',transactionRoutes);
app.use('/api/parties',party);
app.use('/api/bank-accounts', require('./routes/bankAccountRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/business-profile', require('./routes/businessProfileRoutes'));





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
