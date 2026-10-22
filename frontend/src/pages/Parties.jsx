import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Search, Plus, Phone, User, ChevronRight, Wallet } from 'lucide-react';
import Navbar from '../components/Navbar';
export default function Parties() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Party Modal State
  const [showModal, setShowModal] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceType, setBalanceType] = useState('Receive'); // 'Receive' (You'll get) or 'Pay' (You'll give)

  // Fetch Parties on Mount
  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('https://softwareb.onrender.com/api/parties', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParties(response.data || []);
    } catch (err) {
      console.error('Error fetching parties', err);
      // Fallback mock data if API is not yet running
      setParties([
        { _id: '1', name: 'Rahul Sharma', phone: '9876543210', balance: 4500, type: 'Receive' },
        { _id: '2', name: 'Amit Enterprises', phone: '9123456789', balance: 1200, type: 'Pay' },
        { _id: '3', name: 'Priya Stores', phone: '9988776655', balance: 0, type: 'Receive' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Party Submit
  const handleSaveParty = async (e) => {
    e.preventDefault();
    if (!partyName) return alert('Please enter Party Name');

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const newPartyData = {
        name: partyName,
        phone,
        address,
        balance: Number(openingBalance) || 0,
        balanceType
      };

      await axios.post('https://softwareb.onrender.com/api/parties/add', newPartyData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Party added successfully!');
      setShowModal(false);
      // Reset form
      setPartyName('');
      setPhone('');
      setAddress('');
      setOpeningBalance('');
      fetchParties(); // Refresh list
    } catch (err) {
      console.error('Error adding party', err);
      alert('Failed to save party');
    }
  };

  // Filter parties based on search query
  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col max-w-7xl mx-auto shadow-xl">
      <Navbar/>
      {/* Top Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/home')} className="text-slate-700 hover:text-black">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Parties</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-bold text-sm flex items-center space-x-1 shadow hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Party</span>
        </button>
      </header>

      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Search by name or phone number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Parties List Section */}
      <main className="p-4 flex-1 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-slate-400 font-medium">Loading parties...</div>
        ) : filteredParties.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <User className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">No parties found</p>
            <button 
              onClick={() => setShowModal(true)}
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              + Add your first customer/supplier
            </button>
          </div>
        ) : (
          filteredParties.map((party) => (
            <div 
              key={party._id}
              onClick={() => navigate(`/parties/${party._id}`)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 cursor-pointer transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base">
                  {party.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{party.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center mt-0.5">
                    <Phone className="w-3 h-3 mr-1" /> {party.phone || 'No Phone'}
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center space-x-3">
                <div>
                  <span className={`text-sm font-black block ${party.balance > 0 ? (party.balanceType === 'Pay' ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-500'}`}>
                    ₹ {party.balance || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {party.balance > 0 ? (party.balanceType === 'Pay' ? 'You Pay' : 'You Collect') : 'Settled'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))
        )}
      </main>

      {/* --- ADD PARTY MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Add New Party</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-blue-600 block mb-1">Party Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rajesh Traders" 
                  value={partyName} 
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="10-digit mobile number" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Address</label>
                <input 
                  type="text" 
                  placeholder="City / Location" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Opening Balance</label>
                  <input 
                    type="number" 
                    placeholder="₹ 0" 
                    value={openingBalance} 
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Type</label>
                  <select 
                    value={balanceType} 
                    onChange={(e) => setBalanceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm focus:outline-none"
                  >
                    <option value="Receive">Advance / You Collect</option>
                    <option value="Pay">You Pay</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-3 bg-slate-200 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-md"
                >
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}