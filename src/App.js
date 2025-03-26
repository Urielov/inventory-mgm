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
import Home from './components/Home';
import OnlineOrder from './components/OnlineOrder';

function App() {
  return (
    <Auth>
      {({ user, signIn, signOut }) =>
        user ? (
          <Router>
            <div
              style={{
                display: 'flex',
                minHeight: '100vh',
                fontFamily: 'Arial, sans-serif',
                direction: 'rtl',
                overflow: 'auto',
              }}
            >
              <Navigation />
              <main
                style={{
                  flexGrow: 1,
                  padding: '20px',
                  marginRight: '60px',
                  transition: 'margin 0.3s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '20px',
                  }}
                >
                  <p style={{ fontSize: '16px', color: '#333', margin: 0 }}>
                    שלום, {user.displayName} ({user.email})
                  </p>
                  <button
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                    onClick={signOut}
                  >
                    התנתק
                  </button>
                </div>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/add-product" element={<AddProduct />} />
                  <Route path="/add-inventory" element={<AddInventory />} />
                  <Route path="/multi-order" element={<MultiProductOrder />} />
                  <Route path="/create-customer" element={<CreateCustomer />} />
                  <Route path="/pickup-selection" element={<PickupSelection />} />
                  <Route path="/confirm-pickup-order" element={<ConfirmPickupOrder />} />
                  <Route path="/view-orders" element={<ViewOrders />} />
                  <Route path="/view" element={<ViewData />} />
                  <Route path="/view-customers" element={<ViewCustomers />} />
                  {/* נתיב חדש להזמנה אונליין */}
                  <Route path="/online-order" element={<OnlineOrder />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </main>
            </div>
          </Router>
        ) : (
          <div
            style={{
              fontFamily: 'Arial, sans-serif',
              direction: 'rtl',
              padding: '20px',
              minHeight: '100vh',
            }}
          >
            <div
              style={{
                textAlign: 'left',
                marginBottom: '20px',
              }}
            >
              <button
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '15px 25px',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
                onClick={signIn}
              >
                התחבר עם Google
              </button>
            </div>
            {/* במצב לא מחובר - OnlineOrder עדיין מוצגת */}
            <OnlineOrder />
          </div>
        )
      }
    </Auth>
  );
}

export default App;
