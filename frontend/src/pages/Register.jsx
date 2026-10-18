import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    dob: '',
    mobileNumber: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-300 flex flex-col justify-center items-center py-10 px-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Astcomm Infotel Billing App</h1>
        <p className="text-sm text-slate-600 mt-1">Create New User Account</p>
      </div>

      <div className="w-full max-w-md bg-slate-300 rounded-3xl p-6 shadow-xl border border-slate-400">
        {error && <div className="mb-4 text-sm text-red-600 text-center font-medium">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-200 border border-slate-400 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700"
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-200 border border-slate-400 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700"
          />

          <input
            type="date"
            name="dob"
            placeholder="Date of Birth (Select Date)"
            value={formData.dob}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-200 border border-slate-400 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700"
          />

          <input
            type="tel"
            name="mobileNumber"
            placeholder="Mobile Number"
            value={formData.mobileNumber}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-200 border border-slate-400 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-200 border border-slate-400 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700"
          />

          <input
            type="password"
            name="password"
            placeholder="Create Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-200 border border-slate-400 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700"
          />

          <button
            type="submit"
            className="w-full py-3.5 bg-slate-700 text-white rounded-xl font-semibold shadow-lg hover:bg-slate-900 transition duration-200"
          >
            Sign Up
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-700">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-slate-900 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}