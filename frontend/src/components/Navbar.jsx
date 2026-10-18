import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, BarChart2, Package, FileText, Building2, 
  Menu as MenuIcon, Bell, Settings, Building, ChevronRight 
} from 'lucide-react';

export default function Navbar({ onOpenMenu, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Fallback: Agar prop mein user na aaye toh localStorage se utha lo
  const storedUser = JSON.parse(localStorage.getItem('user')) || {};
  const currentUserName = user?.fullName || storedUser.fullName || 'Abhishek';

  const navItems = [
    { label: 'HOME', path: '/home', icon: Home },
    { label: 'DASHBOARD', path: '/dashboard', icon: BarChart2 },
    { label: 'ITEMS', path: '/items', icon: Package },
    // { label: 'REPORTS', path: '/reports', icon: FileText },
    { label: 'BANK', path: '/bank-accounts', icon: Building2 },
    { label: 'Menu',  path: '/menu', icon: MenuIcon }, // Menu trigger handler
  ];

  return (
    <>
      {/* ================= LAPTOP / DESKTOP TOP HEADER & NAVBAR ================= */}
      <header className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
          
          {/* Left: Business Profile / Name */}
          <div 
            onClick={() => navigate('/business-profile')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold shadow-inner group-hover:bg-blue-100 transition">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <h1 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                  {currentUserName}
                </h1>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>
              <span className="text-[10px] text-slate-500">Astcomm Infotel Billing</span>
            </div>
          </div>

          {/* Center: Laptop Navigation Menu Tabs */}
          <div className="flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = item.path ? isActive(item.path) : false;
              return (
                <button
                  key={idx}
                  onClick={item.action ? item.action : () => navigate(item.path)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    active 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Notifications & Settings Icons */}
          <div className="flex items-center space-x-2 text-slate-600">
            <button 
              onClick={() => navigate('/notifications')} 
              className="p-2 hover:bg-slate-100 rounded-full transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/business-profile')} 
              className="p-2 hover:bg-slate-100 rounded-full transition"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* ================= MOBILE TOP HEADER (Profile & Name) ================= */}
      <header className="md:hidden bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div 
          onClick={() => navigate('/business-profile')}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold shadow-inner border border-blue-100">
            <Building className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-extrabold text-slate-900">{currentUserName}</h1>
        </div>

        <div className="flex items-center space-x-3 text-slate-700">
          <button onClick={() => navigate('/notifications')} className="hover:text-blue-600 p-1">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/business-profile')} className="hover:text-blue-600 p-1">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav className="md:hidden bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 max-w-7xl mx-auto flex justify-around items-center py-2 z-40 shadow-lg">
        
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = item.path ? isActive(item.path) : false;
          return (
            <button
              key={idx}
              onClick={item.action ? item.action : () => navigate(item.path)}
              className={`flex flex-col items-center transition ${
                active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}