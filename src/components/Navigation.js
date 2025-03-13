// src/components/Navigation.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiPlus, FiBox, FiShoppingCart, FiList, FiDatabase, FiUsers, FiUserPlus, FiTruck } from 'react-icons/fi';

const Navigation = () => {
  const baseButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 15px',
    textDecoration: 'none',
    fontSize: '16px',
    cursor: 'pointer'
  };

  const activeButtonStyle = {
    backgroundColor: '#2ecc71'
  };

  return (
    <nav style={{ marginBottom: '20px', direction: 'rtl' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <NavLink
          to="/create-customer"
          style={({ isActive }) =>
            isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle
          }
        >
          <FiUserPlus />
          יצירת לקוח
        </NavLink>
        <NavLink
          to="/add-product"
          style={({ isActive }) =>
            isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle
          }
        >
          <FiPlus />
          הוספת מוצר
        </NavLink>
        <NavLink
          to="/add-inventory"
          style={({ isActive }) =>
            isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle
          }
        >
          <FiBox />
          הוספת מלאי
        </NavLink>
        <NavLink
          to="/multi-order"
          style={({ isActive }) =>
            isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle
          }
        >
          <FiShoppingCart />
          הזמנת רכישה      
            </NavLink>
            
        <NavLink
          to="/pickup-selection"
          style={({ isActive }) =>
            isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle
          }
        >
          <FiTruck />
          הזמנת לקיטה
        </NavLink>
        <NavLink
          to="/confirm-pickup-order"
          style={({ isActive }) =>
            isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle
          }
        >
          <FiTruck />
          לקיטה
        </NavLink>
        <NavLink
          to="/view-orders"
          style={({ isActive }) =>
            isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle
          }
        >
          <FiList />
          צפייה בהזמנות
        </NavLink>
        <NavLink
          to="/view"
          style={({ isActive }) =>
            isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle
          }
        >
          <FiDatabase />
          צפייה במלאי
        </NavLink>
        <NavLink
          to="/view-customers"
          style={({ isActive }) =>
            isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle
          }
        >
          <FiUsers />
          צפייה בלקוחות
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
