         import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Pencil, X, Wallet, TrendingDown, CalendarDays, Receipt } from 'lucide-react';
import Navbar from '../components/Navbar';

const API = 'https://softwareb.onrender.com/api/expenses';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORIES = [
  'Rent', 'Salary', 'Electricity', 'Internet & Phone', 'Transport', 'Office Supplies',
  'Marketing', 'Repair & Maintenance', 'Tea & Food', 'Tax & Fees', 'Other',
];

const CAT_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b', '#14b8a6'];

const MODES = ['Cash', 'Bank', 'UPI'];

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const todayStr = () => {
  const t = new Date();
  return `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
};

const parseDate = (str) => {
  const [d, m, y] = String(str || '').split('/').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const emptyForm = () => ({
  category: 'Rent',
  amount: '',
  date: todayStr(),
  paymentMode: 'Cash',
  paidTo: '',
  note: '',
});

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthKey, setMonthKey] = useState('all'); // all | "YYYY-M"
  const [catFilter, setCatFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const setF = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(API, authHeader);
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchExpenses();
    // eslint-disable-next-line
  }, []);

  // Pichle 12 mahine ke options
  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` };
    });
  }, []);

  const filtered = useMemo(
    () =>
      expenses.filter((e) => {
        const d = parseDate(e.date);
        const monthOk = monthKey === 'all' || `${d.getFullYear()}-${d.getMonth()}` === monthKey;
        const catOk = catFilter === 'All' || e.category === catFilter;
        return monthOk && catOk;
      }),
    [expenses, monthKey, catFilter]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const thisKey = `${now.getFullYear()}-${now.getMonth()}`;
    const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
    const thisMonth = expenses
      .filter((e) => {
        const d = parseDate(e.date);
        return `${d.getFullYear()}-${d.getMonth()}` === thisKey;
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    // category-wise (selected month ke hisab se, category filter ke bina)
    const monthOnly = expenses.filter((e) => {
      const d = parseDate(e.date);
      return monthKey === 'all' || `${d.getFullYear()}-${d.getMonth()}` === monthKey;
    });
    const byCat = {};
    monthOnly.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0);
    });
    const catList = Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const catTotal = catList.reduce((s, c) => s + c.value, 0);

    return { total, thisMonth, count: filtered.length, catList, catTotal };
  }, [filtered, expenses, monthKey]);

  const usedCategories = useMemo(() => ['All', ...new Set(expenses.map((e) => e.category))], [expenses]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (e) => {
    setEditingId(e._id);
    setForm({
      category: e.category,
      amount: e.amount,
      date: e.date,
      paymentMode: e.paymentMode || 'Cash',
      paidTo: e.paidTo || '',
      note: e.note || '',
    });
    setShowForm(true);
  };

  const handleSave = async (keepOpen = false) => {
    if (!Number(form.amount) || Number(form.amount) <= 0) return alert('Please enter amount');
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.date)) return alert('Date dd/mm/yyyy me likhein');

    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, form, authHeader);
      } else {
        await axios.post(API, form, authHeader);
      }
      await fetchExpenses();
      if (keepOpen && !editingId) {
        setForm((f) => ({ ...emptyForm(), category: f.category, date: f.date }));
      } else {
        setShowForm(false);
        setEditingId(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Expense save nahi ho paya');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await axios.delete(`${API}/${id}`, authHeader);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      alert('Delete nahi ho paya');
    }
  };

  const inputCls =
    'w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const StatCard = ({ label, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 font-semibold">{label}</p>
        <p className="text-base sm:text-lg font-extrabold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col pb-32 md:pb-8">
      <Navbar />

      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-black">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Expenses</h1>
        </div>
        <button
          onClick={openAdd}
          className="hidden md:flex items-center space-x-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:bg-rose-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </header>

      <main className="p-4 sm:p-6 flex-1 space-y-4 w-full max-w-5xl mx-auto">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            label={monthKey === 'all' ? 'Total Expense' : 'Selected Month'}
            value={`₹ ${fmt(stats.total)}`}
            icon={TrendingDown}
            color="text-rose-600"
            bg="bg-rose-50"
          />
          <StatCard label="Is Mahine" value={`₹ ${fmt(stats.thisMonth)}`} icon={CalendarDays} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Entries" value={stats.count} icon={Receipt} color="text-blue-600" bg="bg-blue-50" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">Sab mahine</option>
            {monthOptions.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {usedCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  catFilter === c ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        {stats.catList.length > 0 && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Category wise kharch</h3>

            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
              {stats.catList.map((c, i) => (
                <div
                  key={c.name}
                  title={c.name}
                  style={{ width: `${(c.value / stats.catTotal) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {stats.catList.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center space-x-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <span className="text-slate-600 truncate">{c.name}</span>
                  </span>
                  <span className="font-bold text-slate-800 shrink-0 pl-2">
                    ₹ {fmt(c.value)} <span className="text-slate-400 font-semibold">({((c.value / stats.catTotal) * 100).toFixed(0)}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className="text-center text-sm text-slate-500 py-10">Loading expenses...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Koi expense nahi mila.</p>
            <p className="text-xs text-slate-400 mt-1">Add Expense dabakar pehla kharch likhein.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {filtered.map((e) => (
              <div key={e._id} className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-sm">{e.category}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">{e.paymentMode}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    #{e.expenseNo} • {e.date}
                    {e.paidTo ? ` • ${e.paidTo}` : ''}
                  </p>
                  {e.note && <p className="text-xs text-slate-500 mt-1">{e.note}</p>}
                </div>

                <div className="text-right shrink-0">
                  <p className="font-extrabold text-rose-600 text-sm">- ₹ {fmt(e.amount)}</p>
                  <div className="flex justify-end space-x-1 mt-1">
                    <button onClick={() => openEdit(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(e._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mobile floating add button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none z-20">
        <button
          onClick={openAdd}
          className="pointer-events-auto flex items-center space-x-2 bg-rose-600 text-white px-8 py-3.5 rounded-full font-extrabold shadow-lg hover:bg-rose-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-blue-600 block mb-1">Expense Category</label>
                <select value={form.category} onChange={(e) => setF('category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {!CATEGORIES.includes(form.category) && <option value={form.category}>{form.category}</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Amount (₹) *</label>
                  <input type="number" placeholder="0" value={form.amount} onChange={(e) => setF('amount', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Date</label>
                  <input type="text" placeholder="dd/mm/yyyy" value={form.date} onChange={(e) => setF('date', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setF('paymentMode', m)}
                      className={`py-2.5 rounded-xl text-sm font-bold transition ${
                        form.paymentMode === m ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Paid To (optional)</label>
                <input type="text" placeholder="Kisko diya" value={form.paidTo} onChange={(e) => setF('paidTo', e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Note (optional)</label>
                <textarea rows={2} placeholder="Kis cheez ka kharch" value={form.note} onChange={(e) => setF('note', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className={`grid gap-3 pt-2 ${editingId ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {!editingId && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="py-3 bg-slate-200 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-300 transition disabled:opacity-60"
                >
                  Save & New
                </button>
              )}
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition shadow-md disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}