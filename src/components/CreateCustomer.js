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

  // CSS styles
  const styles = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f7f9fc',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl',
    },
    header: {
      color: '#2c3e50',
      borderBottom: '2px solid #3498db',
      paddingBottom: '10px',
      marginBottom: '20px',
      textAlign: 'center',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    label: {
      fontWeight: 'bold',
      fontSize: '14px',
      color: '#2c3e50',
    },
    input: {
      padding: '10px 12px',
      borderRadius: '4px',
      border: '1px solid #dcdfe6',
      fontSize: '14px',
      transition: 'border-color 0.2s',
      outline: 'none',
    },
    focusInput: {
      borderColor: '#3498db',
      boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)',
    },
    button: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '12px',
      borderRadius: '4px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      marginTop: '10px',
    },
    buttonHover: {
      backgroundColor: '#2980b9',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>יצירת לקוח חדש</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>שם לקוח:</label>
          <input
            type="text"
            name="name"
            value={customerData.name}
            onChange={handleChange}
            required
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#dcdfe6'}
            placeholder="הזן שם לקוח"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>טלפון 1:</label>
          <input
            type="text"
            name="phone1"
            value={customerData.phone1}
            onChange={handleChange}
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#dcdfe6'}
            placeholder="הזן מספר טלפון ראשי"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>טלפון 2:</label>
          <input
            type="text"
            name="phone2"
            value={customerData.phone2}
            onChange={handleChange}
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#dcdfe6'}
            placeholder="הזן מספר טלפון משני"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>מייל:</label>
          <input
            type="email"
            name="email"
            value={customerData.email}
            onChange={handleChange}
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#dcdfe6'}
            placeholder="הזן כתובת אימייל"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>כתובת:</label>
          <input
            type="text"
            name="address"
            value={customerData.address}
            onChange={handleChange}
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#dcdfe6'}
            placeholder="הזן כתובת"
          />
        </div>
        <button 
          type="submit" 
          style={styles.button}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          צור לקוח
        </button>
      </form>
    </div>
  );
};

export default CreateCustomer;