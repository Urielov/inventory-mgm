// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import AddProduct from './components/AddProduct';
import AddInventory from './components/AddInventory';
import PickupSelection from './components/PickupSelection';
import MultiProductOrder from './components/MultiProductOrder';
import CreateCustomer from './components/CreateCustomer';
import ViewOrders from './components/ViewOrders';
import ViewCustomers from './components/ViewCustomers';
import ConfirmPickupOrder from './components/ConfirmPickupOrder';
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
            <Route path="/pickup-selection" element={<PickupSelection />} />
            <Route path="/confirm-pickup-order" element={<ConfirmPickupOrder />} />
            {/* <Route path="/customer-orders" element={<ViewCustomerOrders />} /> */}
            <Route path="/view-orders" element={<ViewOrders />} />
            <Route path="/view" element={<ViewData />} />
            {/* נתיב ברירת מחדל */}
            <Route path="*" element={<AddProduct />} />
            <Route path="/view-customers" element={<ViewCustomers />} />

          </Routes>
        </div>
      </Router>
    </Auth>
  );
}

export default App;
