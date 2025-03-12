// src/components/ViewCustomers.js
import React, { useState, useEffect } from 'react';
import { listenToCustomers } from '../models/customerModel';

const ViewCustomers = () => {
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // State לשדות חיפוש בכל עמודה
  const [searchName, setSearchName] = useState('');
  const [searchPhone1, setSearchPhone1] = useState('');
  const [searchPhone2, setSearchPhone2] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  useEffect(() => {
    const unsubscribe = listenToCustomers((data) => {
      setCustomers(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // המרת האובייקט למערך וסינון לפי כל שדה
  const filteredCustomers = Object.entries(customers).filter(([id, customer]) => {
    const matchName = customer.name.toLowerCase().includes(searchName.toLowerCase());
    const matchPhone1 = (customer.phone1 || '').toLowerCase().includes(searchPhone1.toLowerCase());
    const matchPhone2 = (customer.phone2 || '').toLowerCase().includes(searchPhone2.toLowerCase());
    const matchEmail = (customer.email || '').toLowerCase().includes(searchEmail.toLowerCase());
    const matchAddress = (customer.address || '').toLowerCase().includes(searchAddress.toLowerCase());
    return matchName && matchPhone1 && matchPhone2 && matchEmail && matchAddress;
  });

  // Inline styles
  const styles = {
    container: {
      padding: '20px',
      direction: 'rtl'
    },
    header: {
      color: '#3498db',
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '20px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
      borderRadius: '10px',
      overflow: 'hidden'
    },
    th: {
      padding: '12px 15px',
      textAlign: 'right',
      fontWeight: '600',
      color: '#495057',
      borderBottom: '2px solid #e9ecef'
    },
    td: {
      padding: '12px 15px',
      borderBottom: '1px solid #e9ecef',
      textAlign: 'right',
      color: '#495057'
    },
    searchInput: {
      width: '100%',
      padding: '6px 8px',
      boxSizing: 'border-box',
      border: '1px solid #ccc',
      borderRadius: '4px'
    },
    noData: {
      textAlign: 'center',
      padding: '30px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      color: '#7f8c8d',
      fontSize: '16px'
    },
    loading: {
      textAlign: 'center',
      padding: '30px',
      color: '#7f8c8d'
    },
    resetButton: {
      marginTop: '15px',
      padding: '10px 20px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>צפייה בלקוחות</h2>
      {isLoading ? (
        <div style={styles.loading}>טוען נתונים...</div>
      ) : filteredCustomers.length === 0 ? (
        <div style={styles.noData}>
          <p>לא נמצאו לקוחות התואמים לסינון.</p>
          <button
            style={styles.resetButton}
            onClick={() => {
              setSearchName('');
              setSearchPhone1('');
              setSearchPhone2('');
              setSearchEmail('');
              setSearchAddress('');
            }}
          >
            איפוס סינון
          </button>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>שם לקוח</th>
              <th style={styles.th}>טלפון 1</th>
              <th style={styles.th}>טלפון 2</th>
              <th style={styles.th}>מייל</th>
              <th style={styles.th}>כתובת</th>
            </tr>
            <tr>
              <th style={styles.th}>
                <input
                  type="text"
                  placeholder="חיפוש שם"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  style={styles.searchInput}
                />
              </th>
              <th style={styles.th}>
                <input
                  type="text"
                  placeholder="חיפוש טלפון 1"
                  value={searchPhone1}
                  onChange={(e) => setSearchPhone1(e.target.value)}
                  style={styles.searchInput}
                />
              </th>
              <th style={styles.th}>
                <input
                  type="text"
                  placeholder="חיפוש טלפון 2"
                  value={searchPhone2}
                  onChange={(e) => setSearchPhone2(e.target.value)}
                  style={styles.searchInput}
                />
              </th>
              <th style={styles.th}>
                <input
                  type="text"
                  placeholder="חיפוש מייל"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  style={styles.searchInput}
                />
              </th>
              <th style={styles.th}>
                <input
                  type="text"
                  placeholder="חיפוש כתובת"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  style={styles.searchInput}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(([id, customer]) => (
              <tr key={id}>
                <td style={styles.td}>{customer.name}</td>
                <td style={styles.td}>{customer.phone1 || '-'}</td>
                <td style={styles.td}>{customer.phone2 || '-'}</td>
                <td style={styles.td}>{customer.email || '-'}</td>
                <td style={styles.td}>{customer.address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewCustomers;
