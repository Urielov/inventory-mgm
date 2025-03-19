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
import Home from './components/Home'; // ייבוא דף הבית

function App() {
  return (
    <Auth>
      <Router>
        <div style={{ 
          display: 'flex',
          minHeight: '100vh',
          fontFamily: 'Arial, sans-serif',
          direction: 'rtl',
          overflow: 'auto'
        }}>
          <Navigation />
          <main style={{ 
            flexGrow: 1, 
            padding: '20px', 
            marginRight: '60px', 
            transition: 'margin 0.3s ease',
            '@media (max-width: 768px)': {
              marginRight: '0'
            }
          }}>
            <Routes>
              <Route path="/" element={<Home />} /> {/* נתיב לדף הבית */}
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/add-inventory" element={<AddInventory />} />
              <Route path="/multi-order" element={<MultiProductOrder />} />
              <Route path="/create-customer" element={<CreateCustomer />} />
              <Route path="/pickup-selection" element={<PickupSelection />} />
              <Route path="/confirm-pickup-order" element={<ConfirmPickupOrder />} />
              <Route path="/view-orders" element={<ViewOrders />} />
              <Route path="/view" element={<ViewData />} />
              <Route path="/view-customers" element={<ViewCustomers />} />
              <Route path="*" element={<Home />} /> {/* ברירת מחדל לדף הבית */}
            </Routes>
          </main>
        </div>
      </Router>
    </Auth>
  );
}

export default App;