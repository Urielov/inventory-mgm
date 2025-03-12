// src/components/Navigation.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav style={{ marginBottom: '20px' }}>
      <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <li><Link to="/add-product">הוספת מוצר</Link></li>
        <li><Link to="/add-inventory">הוספת מלאי</Link></li>
        <li><Link to="/multi-order">הזמנה חדשה</Link></li>
        <li><Link to="/view-orders">צפייה בהזמנות</Link></li>
        <li><Link to="/view">צפייה במלאי</Link></li>
        <li><Link to="/view-customers">צפייה בלקוחות</Link></li>
        <li><Link to="/create-customer">יצירת לקוח</Link></li>


      </ul>
    </nav>
  );
};

export default Navigation;
