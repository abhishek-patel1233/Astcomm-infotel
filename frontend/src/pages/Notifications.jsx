import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Bell, Wallet, ArrowUpRight, PackageX, PackageMinus, MessageCircle, CheckCheck } from 'lucide-react';
import Navbar from '../components/Navbar';

const API = 'http://localhost:5000/api';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "dd/mm/yyyy" ya ISO dono
const parseDate = (str) => {
  if (!str) return new Date();
  if (typeof str === 'string' && str.includes('/')) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(str);
};

const daysSince = (str) => {
  const d = parseDate(str);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today - d) / 86400000));
};

const ageText = (days) => (days === 0 ? 'Aaj ki' : days === 1 ? '1 din purani' : `${days} din purani`);

const SEVERITY = {
  high: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-600', label: 'Urgent' },
  medium: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-600', label: 'Pending' },
  low: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-600', label: 'Naya' },
};

export default function Notifications() {
  const [txns, setTxns] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // all | payment | stock
  const [readIds, setReadIds] = useState(() => JSON.parse(localStorage.getItem('readNotifs') || '[]'));

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      try {
        const [t, i] = await Promise.allSettled([
          axios.get(`${API}/transactions`, { headers }),
          axios.get(`${API}/items`, { headers }),
        ]);
        if (t.status === 'fulfilled') setTxns(Array.isArray(t.value.data) ? t.value.data : []);
        if (i.status === 'fulfilled') setItems(Array.isArray(i.value.data) ? i.value.data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  // ---------- alerts banao ----------
  const notifications = useMemo(() => {
    const list = [];

    txns.forEach((t) => {
      const bal = Number(t.balance || 0);
      if (bal <= 0) return;
      const days = daysSince(t.date);

      if (t.type === 'SALE') {
        list.push({
          id: `due-${t._id}-${bal}`,
          kind: 'payment',
          icon: Wallet,
          severity: days > 30 ? 'high' : days > 7 ? 'medium' : 'low',
          title: `${t.partyName} se ₹${fmt(bal)} baaki hai`,
          sub: `Invoice #${t.invoiceNo} • ${t.date} • ${ageText(days)}`,
          weight: days * 1000 + bal,
          txn: t,
          reminder: true,
        });
      } else if (t.type === 'PURCHASE') {
        list.push({
          id: `pay-${t._id}-${bal}`,
          kind: 'payment',
          icon: ArrowUpRight,
          severity: days > 30 ? 'high' : 'medium',
          title: `${t.partyName} ko ₹${fmt(bal)} dena hai`,
          sub: `Bill #${t.invoiceNo} • ${t.date} • ${ageText(days)}`,
          weight: days * 1000 + bal,
        });
      }
    });

    items.forEach((it) => {
      const s = Number(it.currentStock || 0);
      if (s < 0) {
        list.push({
          id: `neg-${it._id}-${s}`,
          kind: 'stock',
          icon: PackageX,
          severity: 'high',
          title: `${it.itemName} ka stock negative hai`,
          sub: `Abhi stock: ${s.toFixed(1)} ${it.unit}`,
          weight: 500000,
        });
      } else if (s <= 5) {
        list.push({
          id: `low-${it._id}-${s}`,
          kind: 'stock',
          icon: PackageMinus,
          severity: 'medium',
          title: `${it.itemName} ka stock kam hai`,
          sub: `Sirf ${s.toFixed(1)} ${it.unit} bacha hai`,
          weight: 400000,
        });
      }
    });

    return list.sort((a, b) => b.weight - a.weight);
  }, [txns, items]);

  const summary = useMemo(() => {
    const get = txns.filter((t) => t.type === 'SALE').reduce((s, t) => s + Number(t.balance || 0), 0);
    const give = txns.filter((t) => t.type === 'PURCHASE').reduce((s, t) => s + Number(t.balance || 0), 0);
    return { get, give };
  }, [txns]);

  const visible = notifications.filter((n) => tab === 'all' || n.kind === tab);
  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const saveRead = (ids) => {
    setReadIds(ids);
    localStorage.setItem('readNotifs', JSON.stringify(ids));
  };
  const markRead = (id) => !readIds.includes(id) && saveRead([...readIds, id]);
  const markAllRead = () => saveRead([...new Set([...readIds, ...notifications.map((n) => n.id)])]);

  const sendReminder = (n) => {
    const t = n.txn;
    const text =
      `Namaste ${t.partyName},\n\n` +
      `Invoice #${t.invoiceNo} (${t.date}) ka ₹${fmt(t.balance)} abhi baaki hai.\n` +
      `Kripya jald payment kar dein.\n\nDhanyavaad,\n${user.fullName || ''}`;
    const phone = t.phone ? String(t.phone).replace(/\D/g, '') : '';
    const url = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    markRead(n.id);
    window.open(url, '_blank');
  };

  const tabBtn = (key, label, count) => (
    <button
      onClick={() => setTab(key)}
      className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center space-x-1.5 ${
        tab === key ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      <span className={`px-1.5 rounded-full text-[10px] ${tab === key ? 'bg-white/25' : 'bg-slate-100'}`}>{count}</span>
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col pb-24 md:pb-8">
      <Navbar />

      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-black">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-rose-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center space-x-1 text-xs font-bold text-blue-600">
            <CheckCheck className="w-4 h-4" />
            <span>Sab padh liye</span>
          </button>
        )}
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-emerald-600">Aapko milna hai</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800 mt-1">₹ {fmt(summary.get)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-rose-600">Aapko dena hai</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800 mt-1">₹ {fmt(summary.give)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {tabBtn('all', 'Sab', notifications.length)}
          {tabBtn('payment', 'Payment', notifications.filter((n) => n.kind === 'payment').length)}
          {tabBtn('stock', 'Stock', notifications.filter((n) => n.kind === 'stock').length)}
        </div>

        {/* List */}
        {loading ? (
          <p className="text-center text-sm text-slate-500 py-10">Loading notifications...</p>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Koi notification nahi hai.</p>
            <p className="text-xs text-slate-400 mt-1">Saari payment aur stock theek hai.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((n) => {
              const Icon = n.icon;
              const sev = SEVERITY[n.severity];
              const unread = !readIds.includes(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`rounded-2xl p-4 border shadow-sm cursor-pointer transition ${
                    unread ? 'bg-white border-blue-200' : 'bg-white/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sev.chip}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm text-slate-900 ${unread ? 'font-extrabold' : 'font-semibold'}`}>{n.title}</p>
                        {unread && <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${sev.dot}`} />}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{n.sub}</p>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sev.chip}`}>{sev.label}</span>

                        {n.reminder && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendReminder(n);
                            }}
                            className="flex items-center space-x-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Reminder</span>
                          </button>
                        )}

                        {n.kind === 'stock' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/items');
                            }}
                            className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                          >
                            Items dekhein
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}