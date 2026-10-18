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

// Database Connection
mongoose.connect('mongodb://localhost:27017/astcomm_billing')
.then(() => console.log('MongoDB Connected Successfully'))
.catch((err) => console.log('MongoDB Connection Failed:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions',transactionRoutes);
app.use('/api/parties',party);
app.use('/api/bank-accounts', require('./routes/bankAccountRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});