import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Scale, 
  FileSpreadsheet, 
  Printer, 
  MessageSquare, 
  Trash2, 
  X,
  Crown,
  LogOut
} from 'lucide-react';
import Navbar from '../components/Navbar';


export default function Menu() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  // Menu items list mapping to your UI
  const menuItems = [
    { title: 'Bank Accounts', icon: Building2, path: '/bank-accounts', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Day Book', icon: BookOpen, path: '/day-book', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'All Txns Report', icon: FileText, path: '/reports', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Profit & Loss', icon: TrendingUp, path: '/profit-loss', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Balance Sheet', icon: Scale, path: '/balance-sheet', color: 'text-amber-600', bg: 'bg-amber-50', pro: true },
    { title: 'Billwise PnL', icon: FileSpreadsheet, path: '/billwise-pnl', color: 'text-blue-600', bg: 'bg-blue-50', pro: true },
    { title: 'Print Settings', icon: Printer, path: '/print-settings', color: 'text-slate-700', bg: 'bg-slate-100' },
    // { title: 'Txn SMS Settings', icon: MessageSquare, path: '/sms-settings', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'Recycle Bin', icon: Trash2, path: '/recycle-bin', color: 'text-rose-600', bg: 'bg-rose-50', pro: true },
    { title: 'Logout', icon: LogOut, action: 'logout', color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const handleLogout = () => {
    ['token', 'user', 'businessProfile', 'selectedPlan', 'readNotifs'].forEach((k) => localStorage.removeItem(k));
    setShowLogout(false);
    navigate('/login', { replace: true });
  };

  const handleItemClick = (item) => {
    if (item.action === 'logout') {
      setShowLogout(true);
      return;
    }
    navigate(item.path);
  };

  return (
  <div>
    <Navbar/>
  
    <div className=" pb-24  min-h-screen bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
    
      {/* Menu Card Container (Popup Modal) */}
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h2 className="text-xl font-extrabold text-slate-800">More Options</h2>
          <button 
            onClick={() => navigate(-1)} 
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Grid Options */}
        <div className="grid grid-cols-3 gap-y-6 gap-x-4 py-2">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={index}
                onClick={() => handleItemClick(item)}
                className="flex flex-col items-center text-center cursor-pointer group relative"
              >
                {/* Icon Circle */}
                <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition relative`}>
                  <IconComponent className="w-7 h-7" />
                  
                  {/* Pro Badge Icon if applicable */}
                  {item.pro && (
                    <span className="absolute -top-1 -right-1 bg-violet-600 text-white p-1 rounded-full shadow">
                      <Crown className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {/* Title */}
                <span className={`text-xs font-semibold mt-2 transition ${
                  item.action === 'logout'
                    ? 'text-rose-600'
                    : 'text-slate-700 group-hover:text-blue-600'
                }`}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Logout confirm popup */}
      {showLogout && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogout(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800">Logout karein?</h3>
              <p className="text-sm text-slate-500 mt-1">Aap is device se sign out ho jayenge.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setShowLogout(false)}
                className="py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}