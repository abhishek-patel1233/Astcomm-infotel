import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Settings, Plus, Trash2, Printer } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function AddSale() {
  const [paymentType, setPaymentType] = useState('Credit'); // 'Credit' or 'Cash'
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState('');
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  
  // Items Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [items, setItems] = useState([]);
  
  // Single Item Form State inside Modal (with GST)
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [rate, setRate] = useState('');
  const [gstRate, setGstRate] = useState('0'); // '0', '5', '12', '18', '28'

  const navigate = useNavigate();

  // Load Real Date and Next Invoice Number
  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setDate(`${day}/${month}/${year}`);

    const fetchNextInvoiceNo = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:5000/api/transactions/add', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.invoiceNo) {
          setInvoiceNo(String(response.data.invoiceNo));
        } else {
          setInvoiceNo(String(Math.floor(1000 + Math.random() * 9000)));
        }
      } catch (err) {
        setInvoiceNo(String(Math.floor(Date.now() / 1000).toString().slice(-4)));
      }
    };

    fetchNextInvoiceNo();
  }, []);

  // Add Item to List with GST Calculation
  const handleAddItem = (shouldClose = true) => {
    if (!itemName || !rate) return alert('Please enter Item Name and Rate');
    
    const qty = Number(quantity) || 1;
    const unitRate = Number(rate);
    const baseAmount = qty * unitRate;
    const gstPercent = Number(gstRate);
    
    // Calculate GST Amount
    const gstAmount = (baseAmount * gstPercent) / 100;
    const totalItemAmount = baseAmount + gstAmount;

    const newItem = {
      itemName,
      quantity: qty,
      unit,
      rate: unitRate,
      gstRate: gstPercent,
      gstAmount,
      amount: totalItemAmount
    };

    setItems([...items, newItem]);
    
    // Reset item form
    setItemName('');
    setQuantity('');
    setRate('');
    setGstRate('0');

    if (shouldClose) {
      setShowItemModal(false);
    }
  };

  // Calculations
  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalGst = items.reduce((sum, item) => sum + item.gstAmount, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  // Save Sale to Backend
  const handleSaveSale = async (redirectToHome = true) => {
    if (!customer) return alert('Please enter Customer Name');

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const saleData = {
        invoiceNo,
        date,
        partyName: customer,
        phone,
        paymentType,
        items,
        subTotal,
        totalGst,
        total: totalAmount > 0 ? totalAmount : 0, 
        balance: paymentType === 'Credit' ? (totalAmount > 0 ? totalAmount : 0) : 0,
        type: 'SALE'
      };

      await axios.post('http://localhost:5000/api/transactions/add', saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Sale & GST Invoice saved successfully!');
      if (redirectToHome) {
        navigate('/home');
      } else {
        setCustomer('');
        setPhone('');
        setItems([]);
        setInvoiceNo((prev) => String(Number(prev) + 1));
      }
    } catch (err) {
      console.error('Error saving sale', err);
      alert('Failed to save sale');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between max-w-7xl mx-auto shadow-xl pb-16">
      <Navbar/>
      
      {/* Top Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-black">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">GST Sale Invoice</h1>
        </div>
        <div className="flex items-center space-x-3">
          {/* Credit / Cash Toggle */}
          <div className="bg-slate-200 p-1 rounded-full flex text-xs font-bold">
            <button 
              onClick={() => setPaymentType('Credit')}
              className={`px-3 py-1 rounded-full transition ${paymentType === 'Credit' ? 'bg-emerald-500 text-white shadow' : 'text-slate-600'}`}
            >
              Credit
            </button>
            <button 
              onClick={() => setPaymentType('Cash')}
              className={`px-3 py-1 rounded-full transition ${paymentType === 'Cash' ? 'bg-slate-300 text-slate-800 shadow' : 'text-slate-600'}`}
            >
              Cash
            </button>
          </div>
          <button className="text-slate-600 hover:text-slate-900"><Settings className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Main Form */}
      <main className="p-4 flex-1 space-y-4 max-w-2xl mx-auto w-full">
        
        {/* Invoice & Date Row */}
        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-sm">
          <div>
            <span className="text-xs text-slate-400 block">Invoice No.</span>
            <input 
              type="text" 
              value={invoiceNo} 
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full font-semibold text-slate-800 focus:outline-none bg-transparent" 
            />
          </div>
          <div className="border-l pl-3">
            <span className="text-xs text-slate-400 block">Date</span>
            <input 
              type="text" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full font-semibold text-slate-800 focus:outline-none bg-transparent" 
            />
          </div>
        </div>

        {/* Customer & Phone Inputs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-bold text-blue-600 block mb-1">Customer / Party Name *</label>
            <input 
              type="text" 
              placeholder="Enter Customer Name" 
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              required
            />
          </div>

          <div>
            <input 
              type="tel" 
              placeholder="Phone Number" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* Added Items List Preview */}
          {items.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-400">Invoice Items:</span>
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{it.itemName}</span> 
                    <span className="text-slate-500"> ({it.quantity} {it.unit} × ₹{it.rate})</span>
                    {it.gstRate > 0 && <span className="text-violet-600 font-semibold ml-1">[GST {it.gstRate}%]</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">₹ {it.amount.toFixed(2)}</span>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Items Button */}
          <button 
            onClick={() => setShowItemModal(true)}
            className="w-full py-2.5 border-2 border-dashed border-blue-400 text-blue-600 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-50 transition text-sm mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Items with GST</span>
          </button>
        </div>

        {/* Amount Calculation Summary Card (Vyapar Style) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-sm">
          <div className="flex justify-between text-slate-600 text-xs">
            <span>Subtotal</span>
            <span>₹ {subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-xs border-b pb-2">
            <span>Total GST Tax</span>
            <span className="text-violet-600 font-semibold">+ ₹ {totalGst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="font-bold text-slate-800 text-base">Grand Total</span>
            <span className="text-xl font-black text-slate-900">₹ {totalAmount.toFixed(2)}</span>
          </div>
        </div>

      </main>

      {/* --- ADD ITEMS WITH GST MODAL --- */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Add Item & GST</h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-blue-600 block mb-1">Item Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Web Development / Product" 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Quantity</label>
                  <input 
                    type="number" 
                    placeholder="Qty" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Unit</label>
                  <select 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Box">Box</option>
                    <option value="Hrs">Hrs</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Rate (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Price per unit" 
                    value={rate} 
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">GST Rate</label>
                  <select 
                    value={gstRate} 
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none font-semibold text-violet-600"
                  >
                    <option value="0">None (0%)</option>
                    <option value="5">GST @ 5%</option>
                    <option value="12">GST @ 12%</option>
                    <option value="18">GST @ 18%</option>
                    <option value="28">GST @ 28%</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button 
                onClick={() => handleAddItem(false)}
                className="py-3 bg-slate-200 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-300 transition"
              >
                Save & New
              </button>
              <button 
                onClick={() => handleAddItem(true)}
                className="py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition shadow-md"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="bg-white border-t border-slate-200 p-3 grid grid-cols-2 gap-3 fixed bottom-0 left-0 right-0 max-w-7xl mx-auto z-20 shadow-lg">
        <button 
          onClick={() => handleSaveSale(false)}
          className="py-3.5 bg-slate-200 text-slate-800 rounded-xl font-bold text-sm shadow hover:bg-slate-300 transition"
        >
          Save & New
        </button>
        <button 
          onClick={() => handleSaveSale(true)}
          className="py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition"
        >
          Save Invoice
        </button>
      </div>

    </div>
  );
}