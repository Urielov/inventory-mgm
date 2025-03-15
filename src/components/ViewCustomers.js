// src/components/ViewCustomers.js
import React, { useState, useEffect } from 'react';
import { listenToCustomers, updateCustomer } from '../models/customerModel';
import ExportToExcelButton from './ExportToExcelButton';
import ExportToPdfButton from './ExportToPdfButton';

const ViewCustomers = () => {
  const [customers, setCustomers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedCustomer, setEditedCustomer] = useState({});

  // State לשדות חיפוש בכל עמודה
  const [searchName, setSearchName] = useState('');
  const [searchPhone1, setSearchPhone1] = useState('');
  const [searchPhone2, setSearchPhone2] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  // State לחלוקה לעמודים
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  useEffect(() => {
    const unsubscribe = listenToCustomers((data) => {
      setCustomers(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // איפוס העמוד כאשר מתעדכנים שדות החיפוש
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchPhone1, searchPhone2, searchEmail, searchAddress]);

  // המרת האובייקט למערך וסינון לפי כל שדה
  const filteredCustomers = Object.entries(customers).filter(([id, customer]) => {
    const matchName = customer.name.toLowerCase().includes(searchName.toLowerCase());
    const matchPhone1 = (customer.phone1 || '').toLowerCase().includes(searchPhone1.toLowerCase());
    const matchPhone2 = (customer.phone2 || '').toLowerCase().includes(searchPhone2.toLowerCase());
    const matchEmail = (customer.email || '').toLowerCase().includes(searchEmail.toLowerCase());
    const matchAddress = (customer.address || '').toLowerCase().includes(searchAddress.toLowerCase());
    return matchName && matchPhone1 && matchPhone2 && matchEmail && matchAddress;
  });

  // חלוקה לעמודים
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, startIndex + customersPerPage);

  const handleEdit = (id) => {
    setEditingId(id);
    setEditedCustomer({ ...customers[id] });
  };

  const handleSave = async (id) => {
    try {
      await updateCustomer(id, editedCustomer);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleChange = (field, value) => {
    setEditedCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // פונקציה שמייצרת את הנתונים לייצוא (על פי הסינון)
  const exportData = () => {
    return filteredCustomers.map(([id, customer]) => ({
      "מזהה לקוח": id,
      "שם לקוח": customer.name,
      "טלפון 1": customer.phone1 || '-',
      "טלפון 2": customer.phone2 || '-',
      "מייל": customer.email || '-',
      "כתובת": customer.address || '-'
    }));
  };

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
    // עיצוב זהה לעיצוב "סה"כ מוצרים" ב־ViewData
    productCount: {
      fontSize: '16px',
      fontWeight: '500',
      color: '#7F8C8D',
      marginBottom: '16px',
      textAlign: 'left',

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
    editInput: {
      width: '100%',
      padding: '6px 8px',
      boxSizing: 'border-box',
      border: '1px solid #3498db',
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
    },
    editButton: {
      padding: '6px 12px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    saveButton: {
      padding: '6px 12px',
      backgroundColor: '#2ecc71',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    paginationContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '20px',
      gap: '8px'
    },
    paginationButton: {
      padding: '8px 12px',
      border: '1px solid #dcdfe6',
      borderRadius: '4px',
      backgroundColor: 'white',
      cursor: 'pointer'
    },
    activePage: {
      backgroundColor: '#3498db',
      color: 'white'
    },
    exportContainer: {
      marginTop: '20px',
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end'
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
        <>
          {/* הצגת סה"כ לקוחות עם העיצוב זהה ל-"סה"כ מוצרים" */}
          <div style={styles.productCount}>
            סה"כ: <strong>{filteredCustomers.length}</strong> לקוחות
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>שם לקוח</th>
                <th style={styles.th}>טלפון 1</th>
                <th style={styles.th}>טלפון 2</th>
                <th style={styles.th}>מייל</th>
                <th style={styles.th}>כתובת</th>
                <th style={styles.th}>פעולות</th>
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
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map(([id, customer]) => {
                const isEditing = editingId === id;
                return (
                  <tr key={id}>
                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          style={styles.editInput}
                          value={editedCustomer.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                        />
                      ) : customer.name}
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          style={styles.editInput}
                          value={editedCustomer.phone1 || ''}
                          onChange={(e) => handleChange('phone1', e.target.value)}
                        />
                      ) : customer.phone1 || '-'}
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          style={styles.editInput}
                          value={editedCustomer.phone2 || ''}
                          onChange={(e) => handleChange('phone2', e.target.value)}
                        />
                      ) : customer.phone2 || '-'}
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          style={styles.editInput}
                          value={editedCustomer.email || ''}
                          onChange={(e) => handleChange('email', e.target.value)}
                        />
                      ) : customer.email || '-'}
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          style={styles.editInput}
                          value={editedCustomer.address || ''}
                          onChange={(e) => handleChange('address', e.target.value)}
                        />
                      ) : customer.address || '-'}
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <button style={styles.saveButton} onClick={() => handleSave(id)}>
                          שמור
                        </button>
                      ) : (
                        <button style={styles.editButton} onClick={() => handleEdit(id)}>
                          ערוך
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={styles.paginationContainer}>
            <button
              style={styles.paginationButton}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              קודם
            </button>
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx + 1}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === idx + 1 ? styles.activePage : {}),
                }}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              style={styles.paginationButton}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              הבא
            </button>
          </div>
          <div style={styles.exportContainer}>
            <ExportToExcelButton data={exportData()} fileName="customers_export" />
            <ExportToPdfButton data={exportData()} fileName="customers_export" title="Customers" />
          </div>
        </>
      )}
    </div>
  );
};

export default ViewCustomers;
