import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css' ;
import HomePage from './pages/Home';
import Dashboard from './pages/Dashboard';
import AddSale from './pages/AddSale';
import BusinessProfile from './pages/BusinessProfile';
import Parties from './pages/Parties';
import Reports from './pages/Reports';
import Menu from './pages/Menu';
import Navbar from './components/Navbar';
   import BankAccounts from './pages/BankAccounts';
import Items from './pages/Items';
import Offers from './pages/Offers';
import Notifications from './pages/Notifications';
function App() {
  return (
    <>
    
    <Router>
      <Routes>
        {/* Default redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Pages stored inside src/pages/ */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<HomePage/>} />
        
        <Route path="/dashboard" element={<Dashboard/>} />

        <Route path="/add-sale" element={<AddSale/>} />
         <Route path="/items" element={<Items/>} />
        <Route path="/menu" element={<Menu/>} />
        {/* Add future pages here (e.g., Dashboard, Invoicing, etc.) */}
       <Route path='/parties' element={<Parties/>} />
          <Route path='/menu' element={<Menu/>} />
       <Route path="/reports" element={<Reports />} />
        <Route path="/business-profile" element={<BusinessProfile/>} />
       <Route  path='/navbar' element={<Navbar/>}   />
       <Route path='/bank-accounts' element = {<BankAccounts/>}/>
      <Route path="/offers" element={<Offers />} />
       <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;