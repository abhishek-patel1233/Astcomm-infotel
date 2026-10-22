import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import {
  IndianRupee, ShoppingCart, Wallet, Store, ClipboardList, Landmark, Banknote, CreditCard, Percent,
  Users, Package, BookOpen, Bell, Printer, MessageSquare, FileText, TrendingUp, Scale, FileSpreadsheet,
  Building, Crown, Trash2, LogOut, Settings, ChevronRight, ChevronDown, Zap,
} from 'lucide-react';

// ---------- data ----------
const SLIDES = [
  [
    {
      title: 'My Business',
      rows: [
        {
          label: 'Sale', icon: IndianRupee,
          children: [
            { label: 'Sale Invoice', path: '/add-sale' },
            { label: 'Payment In', path: '/payment-in' },
            { label: 'Sale Return', path: '/sale-return' },
            { label: 'Estimate / Quotation', path: '/estimate' },
          ],
        },
        {
          label: 'Purchase', icon: ShoppingCart,
          children: [
            { label: 'Purchase Bill', path: '/add-purchase' },
            { label: 'Payment Out', path: '/payment-out' },
            { label: 'Purchase Return', path: '/purchase-return' },
          ],
        },
        { label: 'Expenses', icon: Wallet, path: '/expenses' },
        { label: 'My Online Store', icon: Store, path: '/online-store' },
        { label: 'Reports', icon: ClipboardList, path: '/reports' },
      ],
    },
    {
      title: 'Cash & Bank',
      rows: [
        { label: 'Bank Accounts', icon: Landmark, path: '/bank-accounts' },
        { label: 'Cash In-Hand', icon: Banknote, path: '/cash-in-hand' },
        { label: 'Cheques', icon: CreditCard, path: '/cheques' },
        { label: 'Loan Accounts', icon: Percent, path: '/loan-accounts' },
      ],
    },
    {
      title: 'Important Utilities',
      rows: [
        { label: 'Parties', icon: Users, path: '/parties' },
        { label: 'Items', icon: Package, path: '/items' },
        { label: 'Day Book', icon: BookOpen, path: '/day-book' },
        { label: 'Notifications', icon: Bell, path: '/notifications' },
      ],
    },
  ],
  [
    {
      title: 'Reports & Accounting',
      rows: [
        { label: 'All Txns Report', icon: FileText, path: '/reports' },
        { label: 'Profit & Loss', icon: TrendingUp, path: '/profit-loss' },
        { label: 'Balance Sheet', icon: Scale, path: '/balance-sheet', pro: true },
        { label: 'Billwise PnL', icon: FileSpreadsheet, path: '/billwise-pnl', pro: true },
      ],
    },
    {
      title: 'Growth',
      rows: [
        { label: 'Offers & Plans', icon: Zap, path: '/offers' },
        { label: 'Items & Stock', icon: Package, path: '/items' },
      ],
    },
  ],
  [
    {
      title: 'Settings',
      rows: [
        { label: 'Business Profile', icon: Building, path: '/business-profile' },
        { label: 'Print Settings', icon: Printer, path: '/print-settings' },
        { label: 'Txn SMS Settings', icon: MessageSquare, path: '/sms-settings' },
        { label: 'Recycle Bin', icon: Trash2, path: '/recycle-bin', pro: true },
      ],
    },
    {
      title: 'Account',
      rows: [{ label: 'Logout', icon: LogOut, action: 'logout', danger: true }],
    },
  ],
];

export default function Menus() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState('');
  const [showLogout, setShowLogout] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goSlide = (i) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const handleLogout = () => {
    ['token', 'user', 'businessProfile', 'selectedPlan', 'readNotifs'].forEach((k) => localStorage.removeItem(k));
    setShowLogout(false);
    navigate('/login', { replace: true });
  };

  const onRow = (row) => {
    if (row.children) {
      setOpen((o) => (o === row.label ? '' : row.label));
      return;
    }
    if (row.action === 'logout') {
      setShowLogout(true);
      return;
    }
    navigate(row.path);
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col pb-24 md:pb-8">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <Navbar />

      {/* Dots (sirf mobile) */}
      <div className="md:hidden flex justify-center space-x-1.5 pt-1.5 pb-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goSlide(i)}
            className={`h-1.5 rounded-full transition-all ${active === i ? 'w-6 bg-blue-600' : 'w-4 bg-slate-300'}`}
          />
        ))}
      </div>

      {/* Slides */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:max-w-6xl md:mx-auto md:w-full md:p-6 md:items-start"
      >
        {SLIDES.map((cards, si) => (
          <div key={si} className="min-w-full snap-center px-4 py-2 space-y-4 md:min-w-0 md:px-0 md:py-0">
            {cards.map((card) => (
              <section key={card.title} className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 pt-4 pb-1">
                <h2 className="text-base font-bold text-slate-800 mb-1">{card.title}</h2>

                <div className="divide-y divide-slate-100">
                  {card.rows.map((row) => {
                    const Icon = row.icon;
                    const isOpen = open === row.label;
                    return (
                      <div key={row.label}>
                        <button onClick={() => onRow(row)} className="w-full flex items-center justify-between py-4 text-left">
                          <span className="flex items-center space-x-4">
                            <Icon className={`w-6 h-6 ${row.danger ? 'text-rose-600' : 'text-slate-600'}`} strokeWidth={1.7} />
                            <span className={`text-base ${row.danger ? 'text-rose-600 font-semibold' : 'text-slate-700'}`}>{row.label}</span>
                            {row.pro && (
                              <span className="bg-violet-600 text-white p-1 rounded-full">
                                <Crown className="w-3 h-3" />
                              </span>
                            )}
                          </span>
                          {row.children ? (
                            <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          ) : (
                            !row.danger && <ChevronRight className="w-5 h-5 text-blue-600" />
                          )}
                        </button>

                        {row.children && isOpen && (
                          <div className="pb-3 pl-10 space-y-1">
                            {row.children.map((c) => (
                              <button
                                key={c.label}
                                onClick={() => navigate(c.path)}
                                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
                              >
                                <span>{c.label}</span>
                                <ChevronRight className="w-4 h-4 text-blue-500" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ))}
      </div>

      {/* Logout confirm */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogout(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800">Logout karein?</h3>
              <p className="text-sm text-slate-500 mt-1">Aap is device se sign out ho jayenge.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={() => setShowLogout(false)} className="py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                Cancel
              </button>
              <button onClick={handleLogout} className="py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}