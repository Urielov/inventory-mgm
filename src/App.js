// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import AddProduct from './components/AddProduct';
import AddInventory from './components/AddInventory';
import OrderForCustomer from './components/OrderForCustomer';
import ViewData from './components/ViewData';
import CreateCustomer from './components/CreateCustomer';
import ViewCustomerOrders from './components/ViewCustomerOrders';

function App() {
  return (
    <Auth>
      <Router>
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>מערכת ניהול מלאי</h1>
          <Navigation />
          <Routes>
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/add-inventory" element={<AddInventory />} />
            <Route path="/order" element={<OrderForCustomer />} />
            <Route path="/view" element={<ViewData />} />
            <Route path="/create-customer" element={<CreateCustomer />} />
            <Route path="/customer-orders" element={<ViewCustomerOrders />} />
            {/* נתיב ברירת מחדל */}
            <Route path="*" element={<AddProduct />} />
          </Routes>
        </div>
      </Router>
    </Auth>
  );
}

export default App;
