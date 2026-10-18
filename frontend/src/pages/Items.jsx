import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Search, Package, Pencil, X, Boxes, IndianRupee, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';

const API = 'http://localhost:5000/api/items';

const emptyForm = () => ({
  itemName: '',
  category: '',
  unit: 'Pcs',
  salePrice: '',
  purchasePrice: '',
  openingStock: '',
});

const money = (n) =>
  `₹ ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const stockColor = (s) => (s < 0 ? 'text-rose-500' : s <= 5 ? 'text-amber-600' : 'text-emerald-600');

const fmtDate = (d) => {
  if (!d) return '-';
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
};

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | low | negative
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const fetchItems = async () => {
    try {
      const res = await axios.get(API, authHeader);
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchItems();
    // eslint-disable-next-line
  }, []);

  const stats = useMemo(() => {
    const stockValue = items.reduce((s, i) => s + Number(i.currentStock || 0) * Number(i.purchasePrice || 0), 0);
    const low = items.filter((i) => i.currentStock >= 0 && i.currentStock <= 5).length;
    const negative = items.filter((i) => i.currentStock < 0).length;
    return { total: items.length, stockValue, low, negative };
  }, [items]);

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = i.itemName.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ? true : filter === 'low' ? i.currentStock >= 0 && i.currentStock <= 5 : i.currentStock < 0;
    return matchSearch && matchFilter;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (it) => {
    setDetail(null);
    setEditingId(it._id);
    setForm({
      itemName: it.itemName,
      category: it.category || '',
      unit: it.unit || 'Pcs',
      salePrice: it.salePrice,
      purchasePrice: it.purchasePrice,
      openingStock: it.openingStock,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.itemName.trim()) return alert('Please enter Item Name');
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, form, authHeader);
      } else {
        await axios.post(API, form, authHeader);
      }
      setForm(emptyForm());
      setEditingId(null);
      setShowForm(false);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await axios.delete(`${API}/${id}`, authHeader);
      setItems((prev) => prev.filter((i) => i._id !== id));
      setDetail(null);
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const inputCls =
    'w-full px-3 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-blue-600';

  // ---------------- ADD / EDIT FORM ----------------
  if (showForm) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col pb-24">
        <Navbar />
        <header className="bg-white px-4 py-3 flex items-center space-x-3 border-b border-slate-200 shadow-sm">
          <button onClick={() => setShowForm(false)} className="text-slate-700 hover:text-black">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Item' : 'Add Item'}</h1>
        </header>

        <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-blue-600 block mb-1">Item Name *</label>
            <input type="text" value={form.itemName} onChange={(e) => setField('itemName', e.target.value)} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Category</label>
              <input type="text" value={form.category} onChange={(e) => setField('category', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Unit</label>
              <select value={form.unit} onChange={(e) => setField('unit', e.target.value)} className={inputCls}>
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
              <label className="text-xs font-bold text-slate-600 block mb-1">Sale Price (₹)</label>
              <input type="number" value={form.salePrice} onChange={(e) => setField('salePrice', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Purchase Price (₹)</label>
              <input type="number" value={form.purchasePrice} onChange={(e) => setField('purchasePrice', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Opening Stock</label>
            <input type="number" value={form.openingStock} onChange={(e) => setField('openingStock', e.target.value)} className={inputCls} />
          </div>
        </main>

        <button
          onClick={handleSave}
          disabled={saving}
          className=" pb-20 fixed bottom-0 left-0 right-0 py-4 bg-rose-600 text-white font-bold text-base hover:bg-rose-700 transition z-20 disabled:opacity-60"
        >
          {saving ? 'Saving...' : editingId ? 'Update Item' : 'Save'}
        </button>
      </div>
    );
  }

  // ---------------- ITEMS LIST ----------------
  const filterBtn = (key, label) => (
    <button
      onClick={() => setFilter(key)}
      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
        filter === key ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  const StatCard = ({ label, value, icon: Icon, color, bg }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 font-semibold">{label}</p>
        <p className="text-base sm:text-lg font-extrabold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col pb-32 md:pb-8">
      <Navbar />

      <main className="p-4 sm:p-6 flex-1 space-y-4 w-full max-w-6xl mx-auto">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Items" value={stats.total} icon={Boxes} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Stock Value" value={money(stats.stockValue)} icon={IndianRupee} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Low Stock" value={stats.low} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Negative Stock" value={stats.negative} icon={AlertTriangle} color="text-rose-600" bg="bg-rose-50" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search item or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filterBtn('all', 'All')}
            {filterBtn('low', 'Low Stock')}
            {filterBtn('negative', 'Negative')}
          </div>
        <button
  onClick={openAdd}
  className="fixed bottom-20 left-4 right-4 z-50
             flex items-center justify-center gap-2
             rounded-lg bg-red-600 px-4 py-3
             text-white shadow-lg transition hover:bg-blue-700
             md:static md:w-auto"
>
  <Plus className="h-4 w-4" />
  <span>Add New Item</span>
</button>
        </div>

        {loading ? (
          <p className="text-center text-sm text-slate-500 py-10">Loading items...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No items found.</p>
            <p className="text-xs text-slate-400 mt-1">Naya item add karne ke liye Add New Item dabayein.</p>
          </div>
        ) : (
          <>
            {/* Laptop: table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Item</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Sale Price</th>
                    <th className="p-3.5 text-right">Purchase Price</th>
                    <th className="p-3.5 text-right">In Stock</th>
                    <th className="p-3.5 text-right">Stock Value</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((it) => (
                    <tr key={it._id} onClick={() => setDetail(it)} className="hover:bg-blue-50/50 cursor-pointer transition">
                      <td className="p-3.5 font-bold text-slate-900">{it.itemName}</td>
                      <td className="p-3.5">
                        {it.category ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 uppercase">{it.category}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">{money(it.salePrice)}</td>
                      <td className="p-3.5 text-right">{money(it.purchasePrice)}</td>
                      <td className={`p-3.5 text-right font-bold ${stockColor(it.currentStock)}`}>
                        {Number(it.currentStock).toFixed(1)} {it.unit}
                      </td>
                      <td className="p-3.5 text-right text-slate-700">{money(it.currentStock * it.purchasePrice)}</td>
                      <td className="p-3.5">
                        <div className="flex justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openEdit(it)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(it._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((it) => (
                <div key={it._id} onClick={() => setDetail(it)} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{it.itemName}</h3>
                      {it.category && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 uppercase shrink-0">{it.category}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(it._id);
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">Sale Price</p>
                      <p className="font-bold text-slate-900 text-sm">{money(it.salePrice)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Purchase Price</p>
                      <p className="font-bold text-slate-900 text-sm">{money(it.purchasePrice)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">In Stock</p>
                      <p className={`font-bold text-sm ${stockColor(it.currentStock)}`}>{Number(it.currentStock).toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Mobile floating add button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none z-20">
        <button
          onClick={openAdd}
          className="pointer-events-auto flex items-center space-x-2 bg-rose-600 text-white px-8 py-3.5 rounded-full font-extrabold shadow-lg hover:bg-rose-700 transition" 
        >
          <Plus className="w-5 h-5" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* ---------- ITEM DETAIL MODAL ---------- */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDetail(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-slate-900 truncate">{detail.itemName}</h3>
                {detail.category && <span className="text-[11px] font-bold text-slate-400 uppercase">{detail.category}</span>}
              </div>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-[11px] text-slate-400 font-semibold">Sale Price</p>
                  <p className="text-base font-extrabold text-slate-900">{money(detail.salePrice)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-[11px] text-slate-400 font-semibold">Purchase Price</p>
                  <p className="text-base font-extrabold text-slate-900">{money(detail.purchasePrice)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-[11px] text-slate-400 font-semibold">Margin / Unit</p>
                  <p className={`text-base font-extrabold ${detail.salePrice - detail.purchasePrice >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {money(detail.salePrice - detail.purchasePrice)}
                    {detail.purchasePrice > 0 && (
                      <span className="text-[11px] font-semibold ml-1">
                        ({(((detail.salePrice - detail.purchasePrice) / detail.purchasePrice) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-[11px] text-slate-400 font-semibold">Stock Value</p>
                  <p className="text-base font-extrabold text-slate-900">{money(detail.currentStock * detail.purchasePrice)}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">In Stock</span>
                  <span className={`font-bold ${stockColor(detail.currentStock)}`}>
                    {Number(detail.currentStock).toFixed(1)} {detail.unit}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Opening Stock</span>
                  <span className="font-semibold text-slate-800">{Number(detail.openingStock).toFixed(1)} {detail.unit}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Unit</span>
                  <span className="font-semibold text-slate-800">{detail.unit}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Added On</span>
                  <span className="font-semibold text-slate-800">{fmtDate(detail.createdAt)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-semibold text-slate-800">{fmtDate(detail.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 border-t border-slate-100">
              <button onClick={() => handleDelete(detail._id)} className="py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition flex items-center justify-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
              <button onClick={() => openEdit(detail)} className="py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center space-x-2">
                <Pencil className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}