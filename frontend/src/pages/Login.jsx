import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://softwareb.onrender.com/api/auth/login', { 
        identifier, 
        password 
      });
      localStorage.setItem('token', res.data.token);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col justify-between items-center py-10 px-4">
      <div className="flex flex-col items-center mt-6">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-800 text-2xl font-bold shadow-md mb-3">
          A
        </div>
        <h1 className="text-white text-2xl font-bold tracking-wide">Astcomm Infotel</h1>
        <p className="text-slate-400 text-sm">Billing Application</p>
      </div>

      <div className="w-full max-w-md bg-slate-300 rounded-3xl p-8 shadow-2xl my-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
          <p className="text-xs text-slate-600 mt-1">Access your billing & company dashboard</p>
        </div>

        {error && <div className="mb-4 text-sm text-red-600 text-center font-medium">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-200 border border-slate-400 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-200 border border-slate-400 text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-slate-700 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-slate-700 text-white rounded-xl font-semibold shadow-lg hover:bg-slate-900 transition duration-200"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-6 ">
          <p className="text-xs text-slate-700">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-slate-900 hover:underline">
              Create User
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}