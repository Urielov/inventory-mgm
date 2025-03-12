// src/App.js
import React, { useState } from 'react';
import Auth from './components/Auth';
import AddProduct from './components/AddProduct';
import AddInventory from './components/AddInventory';
import OrderForCustomer from './components/OrderForCustomer';
import ViewData from './components/ViewData';

function App() {
  const [activeTab, setActiveTab] = useState("addProduct");

  return (
    <Auth>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>מערכת ניהול מלאי</h1>
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setActiveTab("addProduct")}>הוספת מוצר</button>{" "}
          <button onClick={() => setActiveTab("addInventory")}>הוספת מלאי</button>{" "}
          <button onClick={() => setActiveTab("order")}>הזמנה ללקוח</button>{" "}
          <button onClick={() => setActiveTab("view")}>צפייה במלאי ובהזמנות</button>
        </div>

        <div>
          {activeTab === "addProduct" && <AddProduct />}
          {activeTab === "addInventory" && <AddInventory />}
          {activeTab === "order" && <OrderForCustomer />}
          {activeTab === "view" && <ViewData />}
        </div>
      </div>
    </Auth>
  );
}

export default App;
