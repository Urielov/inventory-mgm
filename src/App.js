// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import AddProduct from './components/AddProduct';
import AddInventory from './components/AddInventory';
import OrderForCustomer from './components/OrderForCustomer';
import MultiProductOrder from './components/MultiProductOrder';
import CreateCustomer from './components/CreateCustomer';
import ViewOrders from './components/ViewOrders';
import ViewCustomerOrders from './components/ViewCustomerOrders';
import ViewData from './components/ViewData';

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
            {/* <Route path="/order" element={<OrderForCustomer />} /> */}
            <Route path="/multi-order" element={<MultiProductOrder />} />
            <Route path="/create-customer" element={<CreateCustomer />} />
            {/* <Route path="/customer-orders" element={<ViewCustomerOrders />} /> */}
            <Route path="/view-orders" element={<ViewOrders />} />
            <Route path="/view" element={<ViewData />} />
            {/* נתיב ברירת מחדל */}
            <Route path="*" element={<AddProduct />} />
          </Routes>
        </div>
      </Router>
    </Auth>
  );
}

export default App;
