import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, X, Zap, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';

const PLANS = {
  monthly: { key: 'monthly', name: 'Monthly', price: 400, period: 'month', perMonth: 400 },
  yearly: { key: 'yearly', name: 'Yearly', price: 3000, period: 'year', perMonth: 250 },
};

const FEATURES = [
  'Unlimited GST Tax Invoices',
  'Invoice PDF direct WhatsApp share',
  'Balance Sheet',
  'Billwise Profit & Loss',
  'Recycle Bin (deleted data wapas)',
  'Multiple Bank Accounts',
  'Items & Stock management',
  'Priority support',
];

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function Offers() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('yearly');
  const [showSummary, setShowSummary] = useState(false);

  const plan = PLANS[selected];
  const yearlyCostIfMonthly = PLANS.monthly.price * 12; // 4800
  const saving = yearlyCostIfMonthly - PLANS.yearly.price; // 1800
  const savingPercent = Math.round((saving / yearlyCostIfMonthly) * 100); // 38

  // TODO: yahan Razorpay / payment gateway lagana hai
  const startPayment = () => {
    localStorage.setItem('selectedPlan', JSON.stringify({ plan: plan.key, amount: plan.price, at: Date.now() }));
    setShowSummary(false);
    alert(`${plan.name} plan (${inr(plan.price)}) select ho gaya. Payment gateway abhi connect nahi hai.`);
  };

  const PlanCard = ({ p, badge }) => {
    const active = selected === p.key;
    return (
      <button
        type="button"
        onClick={() => setSelected(p.key)}
        className={`relative text-left bg-white rounded-3xl p-5 border-2 transition w-full ${
          active ? 'border-rose-600 shadow-lg shadow-rose-100' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {badge && (
          <span className="absolute -top-3 left-5 bg-emerald-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow">
            {badge}
          </span>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800">{p.name}</h3>
          <span
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              active ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'
            }`}
          >
            {active && <Check className="w-4 h-4" />}
          </span>
        </div>

        <div className="mt-3 flex items-end space-x-1">
          <span className="text-3xl font-black text-slate-900">{inr(p.price)}</span>
          <span className="text-sm text-slate-500 mb-1">/ {p.period}</span>
        </div>

        {p.key === 'yearly' ? (
          <p className="text-xs mt-1.5 text-emerald-600 font-bold">
            Sirf {inr(p.perMonth)}/month • {inr(saving)} bachat
          </p>
        ) : (
          <p className="text-xs mt-1.5 text-slate-400">Kabhi bhi band kar sakte hain</p>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col pb-40 md:pb-28">
      <Navbar />

      <header className="bg-white px-4 py-3 flex items-center space-x-3 border-b border-slate-200">
        <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-black">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Offers & Plans</h1>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Hero */}
        <section className="rounded-3xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#14213d,#2563eb)' }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-[18px] border-white/10" />
          <div className="absolute right-8 bottom-4 w-14 h-14 rounded-full border-[8px] border-white/10" />
          <div className="relative">
            <span className="inline-flex items-center space-x-1.5 bg-amber-400 text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full">
              <Zap className="w-3.5 h-3.5" />
              <span>Yearly plan par {savingPercent}% bachat</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-3 leading-tight">Premium se apna business aur aage badhayein</h2>
            <p className="text-sm text-blue-100 mt-2">
              Mahine ke {inr(PLANS.monthly.price)} ya poore saal ke {inr(PLANS.yearly.price)}. Saal ka plan lene par {inr(saving)} bachte hain.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <PlanCard p={PLANS.monthly} />
          <PlanCard p={PLANS.yearly} badge="BEST VALUE" />
        </section>

        {/* Features */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="w-5 h-5 text-violet-600" />
            <h3 className="text-base font-extrabold text-slate-800">Premium me kya milega</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start space-x-2.5 text-sm text-slate-700">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Compare */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-3.5 text-left">Plan</th>
                <th className="p-3.5 text-right">Price</th>
                <th className="p-3.5 text-right">Per month</th>
                <th className="p-3.5 text-right">Saal ka kharch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3.5 font-bold text-slate-800">Monthly</td>
                <td className="p-3.5 text-right">{inr(400)}</td>
                <td className="p-3.5 text-right">{inr(400)}</td>
                <td className="p-3.5 text-right">{inr(yearlyCostIfMonthly)}</td>
              </tr>
              <tr className="bg-emerald-50/60">
                <td className="p-3.5 font-bold text-slate-800">Yearly</td>
                <td className="p-3.5 text-right">{inr(3000)}</td>
                <td className="p-3.5 text-right text-emerald-600 font-bold">{inr(250)}</td>
                <td className="p-3.5 text-right font-bold text-emerald-600">{inr(3000)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <p className="flex items-center justify-center space-x-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Secure payment • Kabhi bhi cancel karein</span>
        </p>
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold">{plan.name} plan</p>
            <p className="text-xl font-black text-slate-900">
              {inr(plan.price)}
              <span className="text-xs font-semibold text-slate-400"> / {plan.period}</span>
            </p>
          </div>
          <button
            onClick={() => setShowSummary(true)}
            className="flex-1 sm:flex-none sm:px-10 py-3.5 bg-rose-600 text-white rounded-xl font-extrabold text-sm shadow-lg hover:bg-rose-700 transition"
          >
            Continue
          </button>
        </div>
      </div>

      {/* Order summary modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowSummary(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-800">Order Summary</h3>
              <button onClick={() => setShowSummary(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Premium ({plan.name})</span>
                <span className="font-semibold">{inr(plan.price)}</span>
              </div>
              {plan.key === 'yearly' && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Monthly ke muqable bachat</span>
                  <span>- {inr(saving)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-dashed pt-3 text-base font-extrabold text-slate-900">
                <span>Total</span>
                <span>{inr(plan.price)}</span>
              </div>
            </div>

            <button onClick={startPayment} className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-extrabold hover:bg-rose-700 transition">
              Pay {inr(plan.price)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}