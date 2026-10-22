import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';

const API = 'https://softwareb.onrender.com/api';

const todayStr = () => {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
};

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const emptyItem = () => ({ itemName: '', quantity: '', unit: 'Pcs', rate: '', gstRate: '0' });

export default function AddPurchase() {
  const [paymentType, setPaymentType] = useState('Credit'); // Credit | Cash
  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState(todayStr());
  const [supplier, setSupplier] = useState('');
  const [phone, setPhone] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  const [items, setItems] = useState([]);
  const [masterItems, setMasterItems] = useState([]); // Items page ki list (suggestions ke liye)
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyItem());
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const setF = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const fetchNextBillNo = async () => {
    try {
      const res = await axios.get(`${API}/transactions/add`, { ...authHeader, params: { type: 'PURCHASE' } });
      setBillNo(String(res.data.invoiceNo || 1));
    } catch (err) {
      setBillNo('1');
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchNextBillNo();
    axios
      .get(`${API}/items`, authHeader)
      .then((res) => setMasterItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
    // eslint-disable-next-line
  }, []);

  // Item name chuni to purchase price aur unit khud bhar do
  const handleItemName = (value) => {
    const match = masterItems.find((m) => m.itemName.toLowerCase() === value.trim().toLowerCase());
    setForm((f) => ({
      ...f,
      itemName: value,
      ...(match ? { unit: match.unit || f.unit, rate: f.rate || String(match.purchasePrice || '') } : {}),
    }));
  };

  // ---------- Item add ----------
  const handleAddItem = (close = true) => {
    if (!form.itemName.trim() || !form.rate) return alert('Please enter Item Name and Rate');

    const qty = Number(form.quantity) || 1;
    const rate = Number(form.rate);
    const gstPercent = Number(form.gstRate);
    const base = qty * rate;
    const gstAmount = (base * gstPercent) / 100;

    setItems((prev) => [
      ...prev,
      {
        itemName: form.itemName.trim(),
        quantity: qty,
        unit: form.unit,
        rate,
        gstRate: gstPercent,
        gstAmount,
        amount: base + gstAmount,
      },
    ]);
    setForm(emptyItem());
    if (close) setShowModal(false);
  };

  // ---------- Calculations ----------
  const subTotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const totalGst = items.reduce((s, i) => s + i.gstAmount, 0);
  const total = items.reduce((s, i) => s + i.amount, 0);
  const paid = paymentType === 'Cash' ? total : Math.min(total, Math.max(0, Number(paidAmount) || 0));
  const balance = total - paid;

  // ---------- Save ----------
  const handleSave = async (goHome = true) => {
    if (!supplier.trim()) return alert('Please enter Supplier Name');
    if (items.length === 0) return alert('Please add at least one item');
    if (!token) {
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API}/transactions/add`,
        {
          type: 'PURCHASE',
          invoiceNo: billNo,
          date,
          partyName: supplier,
          phone,
          paymentType,
          paidAmount: paid,
          items,
        },
        authHeader
      );

      alert('Purchase bill saved successfully!');
      if (goHome) {
        navigate('/home');
      } else {
        setSupplier('');
        setPhone('');
        setPaidAmount('');
        setItems([]);
        fetchNextBillNo();
      }
    } catch (err) {
      console.error('Error saving purchase', err);
      alert(err.response?.data?.message || 'Failed to save purchase');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col pb-24 md:pb-16">
      <Navbar />

      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-black">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Purchase Bill</h1>
        </div>

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
      </header>

      <main className="p-4 flex-1 space-y-4 max-w-2xl mx-auto w-full">
        {/* Bill no & date */}
        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-sm">
          <div>
            <span className="text-xs text-slate-400 block">Bill No.</span>
            <input
              type="text"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value.replace(/\D/g, ''))}
              className="w-full font-semibold text-slate-800 focus:outline-none bg-transparent"
            />
          </div>
          <div className="border-l pl-3">
            <span className="text-xs text-slate-400 block">Date</span>
            <input
              type="text"
              value={date}
              placeholder="dd/mm/yyyy"
              onChange={(e) => setDate(e.target.value)}
              className="w-full font-semibold text-slate-800 focus:outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Supplier */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-bold text-blue-600 block mb-1">Supplier / Party Name *</label>
            <input
              type="text"
              placeholder="Enter Supplier Name"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className={inputCls}
            />
          </div>
          <input
            type="tel"
            placeholder="Phone Number"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className={inputCls}
          />

          {/* Items list */}
          {items.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-400">Bill Items:</span>
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

          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2.5 border-2 border-dashed border-blue-400 text-blue-600 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-blue-50 transition text-sm mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Items with GST</span>
          </button>
        </div>

        {/* Summary */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-sm">
          <div className="flex justify-between text-slate-600 text-xs">
            <span>Subtotal</span>
            <span>₹ {fmt(subTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-xs border-b pb-2">
            <span>Total GST Tax</span>
            <span className="text-violet-600 font-semibold">+ ₹ {fmt(totalGst)}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="font-bold text-slate-800 text-base">Grand Total</span>
            <span className="text-xl font-black text-slate-900">₹ {fmt(total)}</span>
          </div>

          {/* Paid amount (sirf Credit me) */}
          {paymentType === 'Credit' && (
            <div className="flex justify-between items-center pt-3 border-t border-dashed">
              <span className="text-slate-600 text-xs font-semibold">Paid Amount (₹)</span>
              <input
                type="number"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-32 text-right px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-slate-600">Paid</span>
            <span className="font-semibold text-emerald-700">₹ {fmt(paid)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-slate-700">Balance (Dena Hai)</span>
            <span className={balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>₹ {fmt(balance)}</span>
          </div>
        </div>
      </main>

      {/* Add item modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Add Item & GST</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-blue-600 block mb-1">Item Name</label>
                <input
                  type="text"
                  list="master-items"
                  placeholder="Item chunein ya naya naam likhein"
                  value={form.itemName}
                  onChange={(e) => handleItemName(e.target.value)}
                  className={inputCls}
                />
                <datalist id="master-items">
                  {masterItems.map((m) => (
                    <option key={m._id} value={m.itemName} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Quantity</label>
                  <input type="number" placeholder="Qty" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setF('unit', e.target.value)} className={inputCls}>
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
                  <label className="text-xs font-bold text-slate-600 block mb-1">Purchase Rate (₹)</label>
                  <input type="number" placeholder="Price per unit" value={form.rate} onChange={(e) => setF('rate', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">GST Rate</label>
                  <select value={form.gstRate} onChange={(e) => setF('gstRate', e.target.value)} className={`${inputCls} font-semibold text-violet-600`}>
                    <option value="0">None (0%)</option>
                    <option value="5">GST @ 5%</option>
                    <option value="12">GST @ 12%</option>
                    <option value="18">GST @ 18%</option>
                    <option value="28">GST @ 28%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => handleAddItem(false)} className="py-3 bg-slate-200 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-300 transition">
                Save & New
              </button>
              <button onClick={() => handleAddItem(true)} className="py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition shadow-md">
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className=" pd-24 bg-white border-t border-slate-200 p-3 grid grid-cols-2 gap-3 fixed bottom-0 left-0 right-0 z-20 shadow-lg">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className=" py-3.5 bg-slate-200 text-slate-800 rounded-xl font-bold text-sm shadow hover:bg-slate-300 transition disabled:opacity-60"
        >
          Save & New
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className=" pd-20  py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Bill'}
        </button>
      </div>
    </div>
  );
}