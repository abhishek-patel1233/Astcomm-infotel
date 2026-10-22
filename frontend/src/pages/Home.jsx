import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Navbar from '../components/Navbar';
import {
  PlusCircle, Printer, Share2, MoreVertical,
  Building2, BookOpen, FileText, TrendingUp, Scale, FileSpreadsheet,
  MessageSquare, Trash2, X, Crown, Download
} from 'lucide-react';

const INVOICE_WIDTH = 794; // px (A4 width @96dpi)

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Amount in words (Indian system)
const amountInWords = (num) => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
    'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n) => (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ''));
  const three = (n) =>
    (n >= 100 ? a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' : '') : '') + (n % 100 ? two(n % 100) : '');

  const total = Number(num) || 0;
  const rupees = Math.floor(total);
  const paise = Math.round((total - rupees) * 100);

  const parts = [];
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor(rupees / 100000) % 100;
  const thousand = Math.floor(rupees / 1000) % 100;
  const rest = rupees % 1000;
  if (crore) parts.push(three(crore) + ' Crore');
  if (lakh) parts.push(two(lakh) + ' Lakh');
  if (thousand) parts.push(two(thousand) + ' Thousand');
  if (rest) parts.push(three(rest));

  let words = parts.length ? parts.join(' ') : 'Zero';
  words = `Indian Rupees ${words}`;
  if (paise) words += ` and ${two(paise)} Paise`;
  return words + ' Only';
};

// ---------- Invoice sheet (inline styles only, so PDF capture is reliable) ----------
function InvoiceSheet({ txn, user, bank, innerRef }) {
  const NAVY = '#12395e';
  const ORANGE = '#f28c1e';
  const LIGHT = '#eaf3f8';
  const BORDER = '#c9d6df';

  const items = txn.items || [];
  const subTotal = Number(txn.subTotal || txn.total || 0);
  const totalGst = Number(txn.totalGst || 0);
  const total = Number(txn.total || 0);
  const balance = Number(txn.balance || 0);
  const halfGst = totalGst / 2;
  const rates = [...new Set(items.map((i) => Number(i.gstRate || 0)).filter((r) => r > 0))];
  const rateLabel = rates.length === 1 ? ` @ ${rates[0] / 2}%` : '';
  const emptyRows = Math.max(0, 4 - items.length);

  const th = { background: NAVY, color: '#fff', fontSize: 10, fontWeight: 700, padding: '8px 6px', border: `1px solid ${BORDER}`, textAlign: 'center' };
  const td = { fontSize: 10, padding: '8px 6px', border: `1px solid ${BORDER}`, color: '#222' };
  const label = { fontSize: 9, color: '#555', fontWeight: 700 };
  const value = { fontSize: 10, color: '#111' };

  return (
    <div ref={innerRef} style={{ width: INVOICE_WIDTH, background: '#fff', color: '#111', fontFamily: 'Arial, Helvetica, sans-serif', padding: 0 }}>
      {/* Header */}
      <div style={{ background: NAVY, color: '#fff', padding: '22px 28px', borderBottom: `5px solid ${ORANGE}`, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>{user.fullName}</div>
          <div style={{ fontSize: 10, marginTop: 8, opacity: 0.9 }}>Mobile: {user.mobileNumber || '-'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>TAX INVOICE</div>
          <div style={{ fontSize: 10, fontWeight: 700, marginTop: 8 }}>ORIGINAL FOR RECIPIENT</div>
          <div style={{ fontSize: 9, marginTop: 4, opacity: 0.85 }}>Computer Generated</div>
        </div>
      </div>

      <div style={{ padding: '18px 28px 24px' }}>
        {/* Invoice details */}
        <div style={{ display: 'flex', background: LIGHT, border: `1px solid ${BORDER}`, padding: '10px 12px' }}>
          <div style={{ flex: 1 }}><div style={label}>Invoice No.</div><div style={value}>#{txn.invoiceNo}</div></div>
          <div style={{ flex: 1 }}><div style={label}>Invoice Date</div><div style={value}>{txn.date}</div></div>
          <div style={{ flex: 1 }}><div style={label}>Payment Type</div><div style={value}>{txn.paymentType || 'Credit'}</div></div>
        </div>

        {/* Bill To */}
        <div style={{ border: `1px solid ${BORDER}`, marginTop: 12 }}>
          <div style={{ background: NAVY, color: '#fff', fontSize: 10, fontWeight: 700, padding: '6px 12px' }}>BILL TO</div>
          <div style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>{txn.partyName}</div>
            {txn.phone && <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>Contact: +91 {txn.phone}</div>}
          </div>
        </div>

        {/* Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 14 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 34 }}>Sr.</th>
              <th style={{ ...th, textAlign: 'left' }}>Description</th>
              <th style={{ ...th, width: 44 }}>Qty</th>
              <th style={{ ...th, width: 54 }}>Unit</th>
              <th style={{ ...th, width: 80 }}>Rate</th>
              <th style={{ ...th, width: 50 }}>GST</th>
              <th style={{ ...th, width: 96, textAlign: 'right' }}>Taxable Value</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td style={{ ...td, textAlign: 'center' }}>{i + 1}</td>
                <td style={{ ...td, fontWeight: 700 }}>{it.itemName}</td>
                <td style={{ ...td, textAlign: 'center' }}>{it.quantity}</td>
                <td style={{ ...td, textAlign: 'center' }}>{it.unit || 'Pcs'}</td>
                <td style={{ ...td, textAlign: 'right' }}>Rs. {fmt(it.rate)}</td>
                <td style={{ ...td, textAlign: 'center' }}>{it.gstRate || 0}%</td>
                <td style={{ ...td, textAlign: 'right' }}>Rs. {fmt(Number(it.quantity) * Number(it.rate))}</td>
              </tr>
            ))}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <tr key={`e${i}`}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} style={{ ...td, height: 26 }}>&nbsp;</td>
                ))}
              </tr>
            ))}
            <tr>
              <td colSpan={6} style={{ ...td, textAlign: 'right', fontWeight: 700, background: LIGHT }}>Subtotal</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, background: LIGHT }}>Rs. {fmt(subTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* Tax summary */}
        <div style={{ marginTop: 14 }}>
          <div style={{ background: '#1a6a8a', color: '#fff', textAlign: 'center', fontSize: 10, fontWeight: 700, padding: '6px 0' }}>TAX SUMMARY</div>
          <div style={{ display: 'flex', background: LIGHT, border: `1px solid ${BORDER}`, textAlign: 'center', padding: '10px 0' }}>
            <div style={{ flex: 1 }}><div style={label}>Taxable Value</div><div style={{ ...value, fontWeight: 700, marginTop: 4 }}>Rs. {fmt(subTotal)}</div></div>
            <div style={{ flex: 1 }}><div style={label}>CGST{rateLabel}</div><div style={{ ...value, fontWeight: 700, marginTop: 4 }}>Rs. {fmt(halfGst)}</div></div>
            <div style={{ flex: 1 }}><div style={label}>SGST{rateLabel}</div><div style={{ ...value, fontWeight: 700, marginTop: 4 }}>Rs. {fmt(halfGst)}</div></div>
            <div style={{ flex: 1 }}><div style={label}>Total Tax</div><div style={{ ...value, fontWeight: 700, marginTop: 4 }}>Rs. {fmt(totalGst)}</div></div>
          </div>
        </div>

        {/* Totals */}
        <div style={{ border: `1px solid ${BORDER}`, borderTop: 0, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700 }}>
          <span>Amount Before Tax: Rs. {fmt(subTotal)}</span>
          <span>Total GST: Rs. {fmt(totalGst)}</span>
        </div>
        <div style={{ background: ORANGE, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
          <span style={{ fontSize: 12, fontWeight: 800 }}>GRAND TOTAL</span>
          <span style={{ fontSize: 20, fontWeight: 800 }}>Rs. {fmt(total)}</span>
        </div>

        {/* Words + status */}
        <div style={{ background: LIGHT, border: `1px solid ${BORDER}`, borderTop: 0, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 8, color: '#666' }}>AMOUNT CHARGEABLE IN WORDS</div>
            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 3 }}>{amountInWords(total)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 8, color: '#666' }}>PAYMENT STATUS</div>
            <div style={{ fontSize: 11, fontWeight: 800, marginTop: 3, color: balance > 0 ? '#c0392b' : '#1e8449' }}>
              {balance > 0 ? 'PAYMENT DUE' : 'PAID'}
            </div>
            <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>Received: Rs. {fmt(total - balance)} | Balance: Rs. {fmt(balance)}</div>
          </div>
        </div>

        {/* Bank + terms + signatory */}
        <div style={{ display: 'flex', border: `1px solid ${BORDER}`, marginTop: 14 }}>
          {bank && (
            <div style={{ flex: 1, padding: '10px 12px', borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, marginBottom: 6 }}>BANK / PAYMENT DETAILS</div>
              <div style={{ fontSize: 9, lineHeight: 1.7 }}>
                <div>Bank: {bank.displayName}</div>
                {bank.accountHolderName && <div>A/c Name: {bank.accountHolderName}</div>}
                <div>A/c No.: {bank.accountNumber}</div>
                {bank.ifscCode && <div>IFSC: {bank.ifscCode}</div>}
                {bank.upiId && <div>UPI: {bank.upiId}</div>}
              </div>
            </div>
          )}
          <div style={{ flex: 1, padding: '10px 12px', borderRight: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, marginBottom: 6 }}>TERMS & NOTES</div>
            <div style={{ fontSize: 9, lineHeight: 1.7 }}>
              <div>1. Payment due as per agreed credit terms.</div>
              <div>2. Goods/services subject to agreed warranty terms.</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 90 }}>
            <div style={{ fontSize: 10, fontWeight: 800 }}>FOR {user.fullName.toUpperCase()}</div>
            <div style={{ fontSize: 9 }}>Authorised Signatory</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 9, color: '#666', marginTop: 12 }}>
          Thank you for your business. This is a computer-generated tax invoice.
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState({ fullName: 'Abhishek', mobileNumber: '7869173067' });
  const [transactions, setTransactions] = useState([]);
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenuModal, setShowMenuModal] = useState(false);

  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const [pdfTxn, setPdfTxn] = useState(null); // hidden sheet used for PDF capture
  const [busy, setBusy] = useState(false);

  const captureRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.fullName) {
          setUser(storedUser);
        }

        const res = await axios.get('https://softwareb.onrender.com/api/transactions/', { headers });
        setTransactions(res.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }

      // Bank details for invoice (optional)
      try {
        const bres = await axios.get('https://softwareb.onrender.com/api/bank-accounts', { headers });
        const printable = bres.data.find((b) => b.printBankDetails) || null;
        setBank(printable);
      } catch (err) {
        // invoice still works without bank details
      }
    };

    fetchData();
  }, [navigate]);

  const menuItems = [
    { title: 'Bank Accounts', icon: Building2, path: '/bank-accounts', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Day Book', icon: BookOpen, path: '/day-book', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'All Txns Report', icon: FileText, path: '/reports', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Profit & Loss', icon: TrendingUp, path: '/profit-loss', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Balance Sheet', icon: Scale, path: '/balance-sheet', color: 'text-amber-600', bg: 'bg-amber-50', pro: true },
    { title: 'Billwise PnL', icon: FileSpreadsheet, path: '/billwise-pnl', color: 'text-blue-600', bg: 'bg-blue-50', pro: true },
    { title: 'Print Settings', icon: Printer, path: '/print-settings', color: 'text-slate-700', bg: 'bg-slate-100' },
    { title: 'Txn SMS Settings', icon: MessageSquare, path: '/sms-settings', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'Recycle Bin', icon: Trash2, path: '/recycle-bin', color: 'text-rose-600', bg: 'bg-rose-50', pro: true },
  ];

  // Build a PDF sized exactly to the invoice content (no blank A4 space)
  const buildPdf = async (txn) => {
    flushSync(() => setPdfTxn(txn));
    await new Promise((r) => requestAnimationFrame(() => r()));

    const canvas = await html2canvas(captureRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
    const img = canvas.toDataURL('image/jpeg', 0.95);

    const pageW = 210; // mm
    const pageH = (canvas.height * pageW) / canvas.width;
    const pdf = new jsPDF({
      unit: 'mm',
      format: [pageW, pageH],
      orientation: pageH > pageW ? 'p' : 'l',
    });
    pdf.addImage(img, 'JPEG', 0, 0, pageW, pageH);

    return { blob: pdf.output('blob'), fileName: `Invoice-${txn.invoiceNo}.pdf` };
  };

  const saveBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleDownloadPdf = async (txn) => {
    if (busy) return;
    setBusy(true);
    try {
      const { blob, fileName } = await buildPdf(txn);
      saveBlob(blob, fileName);
    } catch (err) {
      console.error('PDF error', err);
      alert('PDF generate nahi ho paya');
    } finally {
      setBusy(false);
    }
  };

  // Share PDF file directly (mobile). Laptop fallback: download PDF + open WhatsApp.
  const handleShareInvoice = async (txn) => {
    if (busy) return;
    setBusy(true);
    try {
      const { blob, fileName } = await buildPdf(txn);
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const text = `Invoice #${txn.invoiceNo} from ${user.fullName}\nTotal: ₹${fmt(txn.total)}\nBalance: ₹${fmt(txn.balance)}`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: fileName, text });
          return;
        } catch (e) {
          if (e.name === 'AbortError') return; // user closed share sheet
        }
      }

      // Fallback
      saveBlob(blob, fileName);
      const phone = txn.phone ? txn.phone.replace(/[^0-9]/g, '') : '';
      const url = phone
        ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Share error', err);
      alert('Invoice share nahi ho paya');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenInvoiceModal = (txn) => {
    setSelectedTxn(txn);
    setShowInvoiceModal(true);
  };

  const previewZoom = Math.min(1, (window.innerWidth - 32) / INVOICE_WIDTH);

  return (
    <div className="min-h-screen bg-slate-100 pb-28 md:pb-10 max-w-7xl mx-auto shadow-2xl flex flex-col justify-between relative">

      <Navbar user={user} onOpenMenu={() => setShowMenuModal(true)} />

      {/* Main Container */}
      <main className="p-4 sm:p-6 flex-1 space-y-5 max-w-4xl mx-auto w-full">

        {/* Toggle / Tabs */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-md mx-auto shadow-inner">
          <button className="flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white text-rose-600 shadow-sm transition">
            Transaction Details
          </button>
          <button onClick={() => navigate('/parties')} className="flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl text-slate-600 hover:text-slate-900 transition">
            Party Details
          </button>
        </div>

        {/* Quick Links Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Quick Links</h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div onClick={() => navigate('/offers')} className="flex flex-col items-center p-3 bg-amber-50 rounded-2xl cursor-pointer hover:bg-amber-100 transition group">
              <span className="text-lg font-black text-amber-600 group-hover:scale-110 transition">⚡</span>
              <span className="text-[11px] font-bold text-slate-700 mt-1">60% OFF</span>
            </div>
            <div onClick={() => navigate('/add-sale')} className="flex flex-col items-center p-3 bg-blue-50 rounded-2xl cursor-pointer hover:bg-blue-100 transition group">
              <PlusCircle className="w-6 h-6 text-blue-600 group-hover:scale-110 transition" />
              <span className="text-[11px] font-bold text-slate-700 mt-1">Add Txn</span>
            </div>
            <div onClick={() => navigate('/reports')} className="flex flex-col items-center p-3 bg-indigo-50 rounded-2xl cursor-pointer hover:bg-indigo-100 transition group">
              <FileText className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition" />
              <span className="text-[11px] font-bold text-slate-700 mt-1">Report</span>
            </div>
            <div onClick={() => setShowMenuModal(true)} className="flex flex-col items-center p-3 bg-slate-100 rounded-2xl cursor-pointer hover:bg-slate-200 transition group">
              <MoreVertical className="w-6 h-6 text-slate-600 group-hover:scale-110 transition" />
              <span className="text-[11px] font-bold text-slate-700 mt-1">Show All</span>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Recent Transactions</h2>
            <span className="text-xs font-bold text-blue-600">{transactions.length} Entries</span>
          </div>

          {loading ? (
            <p className="text-center text-sm text-slate-500 py-8">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-500 shadow-sm border border-slate-200/80">
              <p className="font-semibold text-slate-700">No transactions found.</p>
              <p className="text-xs text-slate-400 mt-1">Click below to add your first sale invoice.</p>
            </div>
          ) : (
            transactions.map((txn, index) => (
              <div key={txn._id || index} className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900 text-base">{txn.partyName}</h3>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${txn.type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {txn.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 block">Inv #{txn.invoiceNo} • {txn.date}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Amount</p>
                    <p className="font-black text-slate-900 text-base">₹ {fmt(txn.total)}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Balance Due: <strong className="text-slate-900 font-bold">₹ {Number(txn.balance || 0).toFixed(2)}</strong></span>

                  <div className="flex space-x-2 sm:space-x-3 text-slate-600">
                    <button onClick={() => handleOpenInvoiceModal(txn)} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition flex items-center space-x-1" title="View Invoice">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleShareInvoice(txn)} disabled={busy} className="p-2 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition flex items-center space-x-1 disabled:opacity-50" title="Share PDF on WhatsApp">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleOpenInvoiceModal(txn)} className="p-2 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition" title="Details">
                      <MoreVertical className="w-4 h-4" />
                    </button> 
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Sale Floating / Bottom Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => navigate('/add-sale')}
            className="flex items-center space-x-2 bg-rose-600 text-white px-8 py-3.5 rounded-full font-extrabold shadow-lg hover:bg-rose-700 transition transform hover:scale-105"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add New Sale</span>
          </button>
        </div>

      </main>

      {/* Hidden full-size invoice used only for PDF capture */}
      {pdfTxn && (
        <div style={{ position: 'fixed', left: '-10000px', top: 0 }}>
          <InvoiceSheet innerRef={captureRef} txn={pdfTxn} user={user} bank={bank} />
        </div>
      )}

      {/* --- TAX INVOICE PREVIEW MODAL --- */}
      {showInvoiceModal && selectedTxn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

            <div className="bg-slate-900 text-white p-3.5 flex justify-between items-center px-4 sm:px-6 shrink-0">
              <h3 className="font-bold text-sm">Tax Invoice</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadPdf(selectedTxn)}
                  disabled={busy}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{busy ? 'Wait...' : 'PDF'}</span>
                </button>
                <button
                  onClick={() => handleShareInvoice(selectedTxn)}
                  disabled={busy}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-full transition hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-auto flex-1 bg-slate-200 p-2 sm:p-4">
              <div style={{ zoom: previewZoom, width: INVOICE_WIDTH, margin: '0 auto' }}>
                <InvoiceSheet txn={selectedTxn} user={user} bank={bank} />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MENU MODAL */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-xl font-extrabold text-slate-800">More Options</h2>
              <button
                onClick={() => setShowMenuModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-y-6 gap-x-4 py-2">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={index}
                    onClick={() => {
                      setShowMenuModal(false);
                      navigate(item.path);
                    }}
                    className="flex flex-col items-center text-center cursor-pointer group relative"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition relative`}>
                      <IconComponent className="w-7 h-7" />
                      {item.pro && (
                        <span className="absolute -top-1 -right-1 bg-violet-600 text-white p-1 rounded-full shadow">
                          <Crown className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 mt-2 group-hover:text-blue-600 transition">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}