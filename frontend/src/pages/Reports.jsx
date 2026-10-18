import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, FileText, Share2, Filter, Calendar, ChevronDown, X, Check } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function Reports() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Modal & State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('This Month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txnsType, setTxnsType] = useState('SALE'); // 'SALE', 'PURCHASE', 'ALL'
  const [selectedParty, setSelectedParty] = useState('All Party');

  // Set Default Date Range on Load to "This Month"
  useEffect(() => {
    handleDateRangeChange('This Month');
  }, []);

  // Fetch Reports whenever date range or filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate, txnsType, selectedParty]);

  // Helper: Handle Date Dropdown Selections
  const handleDateRangeChange = (type) => {
    setDateFilter(type);
    const today = new Date();
    
    let start = new Date();
    let end = new Date();

    if (type === 'Today') {
      start = new Date(today);
      end = new Date(today);
    } else if (type === 'This Week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(today.setDate(diff));
      end = new Date();
    } else if (type === 'This Month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const formatDate = (dateObj) => {
      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const y = dateObj.getFullYear();
      return `${d}/${m}/${y}`;
    };

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  // Fetch Transactions from Backend API with Filters
  const fetchReportData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate,
          endDate,
          type: txnsType,
          partyName: selectedParty
        }
      });
      setTransactions(response.data || []);
    } catch (err) {
      console.error('Error fetching sale report data', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for Summary Cards
  const totalTxns = transactions.length;
  const totalSaleAmount = transactions.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
  const totalBalanceDue = transactions.reduce((sum, tx) => sum + (Number(tx.balance) || 0), 0);

  // PDF Export Handler
  const handleExportPDF = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin: 0.5,
      filename: `Sale_Report_${startDate.replace(/\//g, '-')}_to_${endDate.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(element).save();
  };

  // Excel / CSV Export Handler
  const handleExportExcel = () => {
    if (transactions.length === 0) return alert('No data to export!');

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Invoice No,Date,Party Name,Type,Total Amount,Balance Due\n";

    transactions.forEach((tx) => {
      csvContent += `"${tx.invoiceNo}","${tx.date}","${tx.partyName}","${tx.type}","${tx.total}","${tx.balance}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sale_Report_${startDate.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-7xl mx-auto shadow-xl">
      
      {/* Top Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-black">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Sale Report</h1>
        </div>
        
        {/* Export / Share Actions */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportPDF}
            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition" 
            title="Share PDF"
          >
            <Share2 className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleExportPDF}
            className="bg-rose-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow hover:bg-rose-700 transition flex items-center space-x-1"
          >
            <span>Pdf</span>
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow hover:bg-emerald-700 transition flex items-center space-x-1"
          >
            <span>xls</span>
          </button>
        </div>
      </header>

      {/* Date Range & Period Filter Bar */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          {/* Quick Date Range Dropdown */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none cursor-pointer appearance-none pr-8"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Date Pickers */}
          <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 mr-1" />
            <input 
              type="text" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="w-20 bg-transparent text-center focus:outline-none"
              placeholder="DD/MM/YYYY"
            />
            <span className="text-slate-400 px-1">TO</span>
            <input 
              type="text" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="w-20 bg-transparent text-center focus:outline-none"
              placeholder="DD/MM/YYYY"
            />
          </div>
        </div>

        {/* Filters Applied Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2 overflow-x-auto py-1 text-xs">
            <span className="text-slate-400 font-medium">Filters:</span>
            <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
              Type: {txnsType}
            </span>
            <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
              Party: {selectedParty}
            </span>
          </div>

          <button 
            onClick={() => setShowFilterModal(true)}
            className="flex items-center space-x-1 text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm hover:bg-blue-100 transition flex-shrink-0"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div id="report-content" className="p-4 space-y-4">
        
        {/* Summary Cards Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold block">No of Txns</span>
            <span className="text-lg font-black text-slate-800 mt-1 block">{totalTxns}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold block">Total Sale</span>
            <span className="text-base font-black text-slate-900 mt-1 block">₹ {totalSaleAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold block">Balance Due</span>
            <span className="text-base font-black text-emerald-600 mt-1 block">₹ {totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Transactions List Section */}
        <main className="space-y-3">
          {loading ? (
            <div className="text-center py-10 text-slate-400 font-medium">Loading report...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">No sales found for this period</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div 
                key={tx._id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-base">{tx.partyName}</h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <span>Amount</span>
                    <span className="font-bold text-slate-800">₹ {Number(tx.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">
                    {tx.type || 'SALE'} {tx.invoiceNo}
                  </span>
                  <span className="text-xs text-slate-400 block">{tx.date}</span>
                  <div className="text-xs font-semibold text-slate-600 mt-1">
                    Balance: <span className="text-slate-900 font-bold">₹ {Number(tx.balance || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* --- FILTER MODAL --- */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Filter Transactions</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Transaction Type</label>
                <select 
                  value={txnsType}
                  onChange={(e) => setTxnsType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none"
                >
                  <option value="SALE">Sale Only</option>
                  <option value="PURCHASE">Purchase Only</option>
                  <option value="ALL">All Transactions</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Party Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Abhishek or All Party" 
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none"
                />
              </div>
            </div>

            <button 
              onClick={() => {
                fetchReportData();
                setShowFilterModal(false);
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-md flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}