import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowUpRight, ArrowDownRight, Building, Bell, Settings, TrendingUp, Wallet } from 'lucide-react';
import Navbar from '../components/Navbar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "dd/mm/yyyy" ya ISO date dono handle karta hai
const parseDate = (str) => {
  if (!str) return new Date();
  if (typeof str === 'string' && str.includes('/')) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(str);
};

// Last 6 months ka chart (Sales vs Purchase)
function SalesChart({ data }) {
  const W = 600, H = 230, padL = 48, padR = 16, padT = 16, padB = 34;
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.sale, d.purchase]));
  const step = (W - padL - padR) / (data.length - 1);
  const x = (i) => padL + i * step;
  const y = (v) => padT + (H - padT - padB) * (1 - v / maxVal);

  const line = (key) => data.map((d, i) => `${x(i)},${y(d[key])}`).join(' ');
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const short = (v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : Math.round(v));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(maxVal * t)} y2={y(maxVal * t)} stroke="#e2e8f0" strokeDasharray="4 4" />
          <text x={padL - 8} y={y(maxVal * t) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
            {short(maxVal * t)}
          </text>
        </g>
      ))}

      <polyline fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" points={line('sale')} />
      <polyline fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" points={line('purchase')} />

      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.sale)} r="4.5" fill="#2563eb" />
          <circle cx={x(i)} cy={y(d.purchase)} r="4.5" fill="#f59e0b" />
          <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#64748b">
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState({ fullName: '' });
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);

        const res = await axios.get('http://localhost:5000/api/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTxns(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error loading dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const stats = useMemo(() => {
    const sales = txns.filter((t) => t.type === 'SALE');
    const purchases = txns.filter((t) => t.type === 'PURCHASE');

    const sum = (arr, key) => arr.reduce((s, t) => s + Number(t[key] || 0), 0);

    const totalSale = sum(sales, 'total');
    const totalPurchase = sum(purchases, 'total');
    const receivable = sum(sales, 'balance'); // You'll Get
    const payable = sum(purchases, 'balance'); // You'll Give
    const paymentIn = totalSale - receivable; // Customers se mile
    const paymentOut = totalPurchase - payable; // Supplier ko diye
    const expenses = 0; // abhi expense module nahi hai
    const profit = totalSale - totalPurchase - expenses;

    // Last 6 months
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: MONTHS[d.getMonth()], sale: 0, purchase: 0 };
    });
    txns.forEach((t) => {
      const d = parseDate(t.date);
      const slot = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
      if (!slot) return;
      if (t.type === 'SALE') slot.sale += Number(t.total || 0);
      if (t.type === 'PURCHASE') slot.purchase += Number(t.total || 0);
    });

    const thisMonth = months[5].sale;
    const lastMonth = months[4].sale;
    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : 0;

    return { totalSale, totalPurchase, receivable, payable, paymentIn, paymentOut, expenses, profit, months, thisMonth, growth };
  }, [txns]);

  const recent = txns.slice(0, 6);
  const monthName = MONTHS[new Date().getMonth()];

  const Card = ({ label, value, color, icon: Icon }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <div className={`flex items-center space-x-1 text-xs font-bold mb-1 ${color}`}>
        {Icon && <Icon className="w-4 h-4" />}
        <span>{label}</span>
      </div>
      <p className="text-lg sm:text-xl font-extrabold text-slate-800">₹ {fmt(value)}</p>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-100 pb-24 md:pb-8 flex flex-col">
      <Navbar />

      {/* Mobile header (laptop par sidebar + top bar already hai) */}
      {/* <header className="md:hidden bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">{user.fullName}</h1>
            <span className="text-xs text-slate-500">Astcomm Infotel Billing</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-slate-600">
          <button className="hover:text-blue-600"><Bell className="w-5 h-5" /></button>
          <button className="hover:text-blue-600"><Settings className="w-5 h-5" /></button>
        </div>
      </header> */}

      <main className="p-4 sm:p-6 flex-1 space-y-4 w-full max-w-6xl mx-auto">
        {loading ? (
          <p className="text-center text-sm text-slate-500 py-16">Loading dashboard...</p>
        ) : (
          <>
            {/* Top summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card label="Total Sales" value={stats.totalSale} color="text-blue-600" icon={TrendingUp} />
              <Card label="You'll Get (Receivable)" value={stats.receivable} color="text-emerald-600" icon={ArrowDownRight} />
              <Card label="You'll Give (Payable)" value={stats.payable} color="text-rose-600" icon={ArrowUpRight} />
              <Card
                label="Net Profit"
                value={stats.profit}
                color={stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}
                icon={Wallet}
              />
            </div>

            {/* Payment in / out */}
            <div className="grid grid-cols-2 gap-3">
              <Card label="Payment In (Received)" value={stats.paymentIn} color="text-emerald-600" icon={ArrowDownRight} />
              <Card label="Payment Out (Paid)" value={stats.paymentOut} color="text-amber-600" icon={ArrowUpRight} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Sales vs Purchase</h3>
                    <p className="text-[11px] text-slate-400">Last 6 months</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">{monthName} Sale</p>
                    <p className="text-lg font-black text-emerald-600">₹ {fmt(stats.thisMonth)}</p>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                        stats.growth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                      }`}
                    >
                      {stats.growth >= 0 ? '↑' : '↓'} {Math.abs(stats.growth).toFixed(0)}% vs last month
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <SalesChart data={stats.months} />
                </div>

                <div className="flex items-center justify-center space-x-5 text-xs text-slate-500 mt-1">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-1.5 rounded bg-blue-600" /><span>Sales</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-1.5 rounded bg-amber-500" /><span>Purchase</span>
                  </span>
                </div>
              </div>

              {/* Recent transactions */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-slate-700">Recent Transactions</h3>
                  <button onClick={() => navigate('/home')} className="text-xs font-bold text-blue-600">View all</button>
                </div>

                {recent.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Abhi koi transaction nahi hai.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recent.map((t) => (
                      <div key={t._id} className="flex justify-between items-center py-2.5 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{t.partyName}</p>
                          <p className="text-slate-400">#{t.invoiceNo} • {t.date}</p>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <p className={`font-extrabold ${t.type === 'SALE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'SALE' ? '+' : '-'} ₹{fmt(t.total)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {Number(t.balance) > 0 ? `Due ₹${fmt(t.balance)}` : 'Paid'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Profit breakdown */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Profit Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Total Sales</span><span className="font-semibold">₹ {fmt(stats.totalSale)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Purchase</span><span className="font-semibold">- ₹ {fmt(stats.totalPurchase)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Expenses</span><span className="font-semibold">- ₹ {fmt(stats.expenses)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 font-extrabold text-slate-900">
                  <span>Net Profit</span>
                  <span className={stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>₹ {fmt(stats.profit)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}