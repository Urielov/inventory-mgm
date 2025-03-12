// src/components/CreateCustomer.js
import React, { useState } from 'react';
import { addCustomer } from '../models/customerModel';

const CreateCustomer = () => {
  const [customerData, setCustomerData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    email: '',
    address: '',
  });

  const handleChange = (e) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerData.name.trim()) {
      alert('יש להזין שם לקוח');
      return;
    }
    try {
      await addCustomer(customerData);
      alert('לקוח נוצר בהצלחה!');
      setCustomerData({
        name: '',
        phone1: '',
        phone2: '',
        email: '',
        address: '',
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('אירעה שגיאה ביצירת הלקוח');
    }
  };

  return (
    <div>
      <h2>יצירת לקוח</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>שם לקוח:</label>
          <input
            type="text"
            name="name"
            value={customerData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>טלפון 1:</label>
          <input
            type="text"
            name="phone1"
            value={customerData.phone1}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>טלפון 2:</label>
          <input
            type="text"
            name="phone2"
            value={customerData.phone2}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>מייל:</label>
          <input
            type="email"
            name="email"
            value={customerData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>כתובת:</label>
          <input
            type="text"
            name="address"
            value={customerData.address}
            onChange={handleChange}
          />
        </div>
        <button type="submit">צור לקוח</button>
      </form>
    </div>
  );
};

export default CreateCustomer;
