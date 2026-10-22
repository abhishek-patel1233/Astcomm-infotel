import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Search, Landmark } from 'lucide-react';
import Navbar from '../components/Navbar';

const API = 'https://softwareb.onrender.com/api/bank-accounts';

const todayStr = () => {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
};

const emptyForm = () => ({
  displayName: '',
  openingBalance: '',
  asOnDate: todayStr(),
  printBankDetails: true,
  printUpiQr: false,
  upiId: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
});

// Floating-label input (outlined style like the app screenshot)
function Field({ label, children, active }) {
  return (
    <div className="relative">
      <span className={`absolute -top-2 left-3 px-1 bg-white text-xs z-10 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
        {label}
      </span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full p-1 transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function BankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [focus, setFocus] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(API, authHeader);
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to fetch bank accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAccounts();
    // eslint-disable-next-line
  }, []);

  // IFSC search -> auto fill branch name
  const handleIfscSearch = async () => {
    const code = form.ifscCode.trim();
    if (code.length !== 11) return alert('Please enter valid 11 character IFSC code');
    setIfscLoading(true);
    try {
      const res = await axios.get(`https://ifsc.razorpay.com/${code}`);
      setForm((f) => ({
        ...f,
        branchName: res.data.BRANCH || f.branchName,
        displayName: f.displayName || res.data.BANK || '',
      }));
    } catch (err) {
      alert('IFSC code not found');
    } finally {
      setIfscLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) return alert('Please enter Bank Name');
    if (!form.accountNumber.trim()) return alert('Please enter Account Number');

    setSaving(true);
    try {
      await axios.post(API, form, authHeader);
      setForm(emptyForm());
      setShowForm(false);
      fetchAccounts();
    } catch (err) {
      console.error('Error saving bank account', err);
      alert(err.response?.data?.message || 'Failed to save bank account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bank account?')) return;
    try {
      await axios.delete(`${API}/${id}`, authHeader);
      setAccounts((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const inputCls =
    'w-full px-3 py-3.5 rounded-lg bg-white border text-slate-800 text-base focus:outline-none';
  const borderCls = (name) => (focus === name ? 'border-blue-600' : 'border-slate-300');

  // ---------------- ADD FORM VIEW ----------------
  if (showForm) {
    return (
      <div className="min-h-screen bg-white max-w-7xl mx-auto shadow-xl flex flex-col pb-20">
        <Navbar />
        <header className="bg-white px-4 py-3 flex items-center space-x-3 border-b border-slate-200 shadow-sm">
          <button onClick={() => setShowForm(false)} className="text-slate-700 hover:text-black">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Add Bank Account</h1>
        </header>

        <main className="flex-1 max-w-2xl mx-auto w-full">
          <div className="p-4 space-y-5">
            <Field label="Bank Name/ Account Display Name" active={focus === 'displayName'}>
              <input
                type="text"
                value={form.displayName}
                onFocus={() => setFocus('displayName')}
                onBlur={() => setFocus('')}
                onChange={(e) => setField('displayName', e.target.value)}
                className={`${inputCls} ${borderCls('displayName')}`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Opening Balance" active={focus === 'opening'}>
                <input
                  type="number"
                  value={form.openingBalance}
                  onFocus={() => setFocus('opening')}
                  onBlur={() => setFocus('')}
                  onChange={(e) => setField('openingBalance', e.target.value)}
                  className={`${inputCls} ${borderCls('opening')}`}
                />
              </Field>
              <Field label="As On" active={focus === 'asOn'}>
                <input
                  type="text"
                  value={form.asOnDate}
                  placeholder="dd/mm/yyyy"
                  onFocus={() => setFocus('asOn')}
                  onBlur={() => setFocus('')}
                  onChange={(e) => setField('asOnDate', e.target.value)}
                  className={`${inputCls} ${borderCls('asOn')}`}
                />
              </Field>
            </div>
          </div>

          <div className="bg-blue-50 h-3" />

          <div className="p-4 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-slate-800 text-base">Print bank details on invoices</span>
              <Toggle checked={form.printBankDetails} onChange={(v) => setField('printBankDetails', v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-800 text-base">Print UPI QR Code on invoices</span>
              <Toggle checked={form.printUpiQr} onChange={(v) => setField('printUpiQr', v)} />
            </div>

            {form.printUpiQr && (
              <input
                type="text"
                placeholder="UPI ID (e.g. name@sbi)"
                value={form.upiId}
                onChange={(e) => setField('upiId', e.target.value)}
                className={`${inputCls} border-slate-300 focus:border-blue-600`}
              />
            )}

            <input
              type="text"
              placeholder="Account Holder Name"
              value={form.accountHolderName}
              onChange={(e) => setField('accountHolderName', e.target.value)}
              className={`${inputCls} border-slate-300 focus:border-blue-600`}
            />
            <input
              type="text"
              placeholder="Account Number *"
              value={form.accountNumber}
              onChange={(e) => setField('accountNumber', e.target.value)}
              className={`${inputCls} border-slate-300 focus:border-blue-600`}
            />

            <div className="relative">
              <input
                type="text"
                placeholder="IFSC Code"
                maxLength={11}
                value={form.ifscCode}
                onChange={(e) => setField('ifscCode', e.target.value.toUpperCase())}
                className={`${inputCls} border-slate-300 focus:border-blue-600 pr-12`}
              />
              <button
                type="button"
                onClick={handleIfscSearch}
                disabled={ifscLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600"
              >
                <Search className={`w-5 h-5 ${ifscLoading ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Branch Name"
              value={form.branchName}
              onChange={(e) => setField('branchName', e.target.value)}
              className={`${inputCls} border-slate-300 focus:border-blue-600`}
            />
          </div>
        </main>

        <button
          onClick={handleSave}
          disabled={saving}
          className="fixed bottom-14 md:bottom-0 left-0 right-0 max-w-7xl mx-auto bg-red-500 border-t border-slate-200 p-3 z-20 shadow-lg">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    );
  }

  // ---------------- LIST VIEW ----------------
  return (
    <div className="min-h-screen bg-slate-100 max-w-7xl mx-auto shadow-xl flex flex-col pb-24">
      <Navbar />
      <header className="bg-white px-4 py-3 flex items-center space-x-3 border-b border-slate-200">
        <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-black">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Bank Accounts</h1>
      </header>

      <main className="p-4 flex-1 space-y-3 max-w-2xl mx-auto w-full">
        {loading ? (
          <p className="text-center text-sm text-slate-500 py-8">Loading bank accounts...</p>
        ) : accounts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No bank accounts added.</p>
            <p className="text-xs text-slate-400 mt-1">Click below to add your first bank account.</p>
          </div>
        ) : (
          accounts.map((acc) => (
            <div key={acc._id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{acc.displayName}</h3>
                    <p className="text-xs text-slate-400">
                      A/c: {'•'.repeat(Math.max(acc.accountNumber.length - 4, 0))}
                      {acc.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Balance</p>
                  <p className="font-black text-slate-900">
                    ₹ {Number(acc.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>
                  {acc.ifscCode ? `IFSC: ${acc.ifscCode}` : 'No IFSC'}
                  {acc.branchName ? ` • ${acc.branchName}` : ''}
                </span>
                <button
                  onClick={() => handleDelete(acc._id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </main>

    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 max-w-7xl mx-auto bg-white border-t border-slate-200 p-3 z-20 shadow-lg">
  <button
    onClick={() => setShowForm(true)}
    className="fixed bottom-20 left-4 right-4 z-50
             rounded-lg bg-blue-600 px-4 py-3
             text-white shadow-lg md:static md:w-auto"
>
    <Plus className="w-4 h-4" />
    <span>Add Bank Account</span>
  </button>
</div>
    </div>
  );
}