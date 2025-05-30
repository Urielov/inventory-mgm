// src/components/ViewCustomers.js
import React, { useState, useEffect, useMemo } from 'react';
import { listenToCustomers, updateCustomer } from '../models/customerModel';
import { listenToOrders } from '../models/orderModel';
import ExportToExcelButton from './ExportToExcelButton';
import ExportToPdfButton from './ExportToPdfButton';

const ViewCustomers = () => {
  const [customers, setCustomers] = useState({});
  const [ordersData, setOrdersData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedCustomer, setEditedCustomer] = useState({});

  // שדות חיפוש לכל עמודה, כולל שדה הערה
  const [searchName, setSearchName] = useState('');
  const [searchPhone1, setSearchPhone1] = useState('');
  const [searchPhone2, setSearchPhone2] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchNote, setSearchNote] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  useEffect(() => {
    const unsubscribeCustomers = listenToCustomers((data) => {
      setCustomers(data);
      setIsLoading(false);
    });
    const unsubscribeOrders = listenToOrders(setOrdersData);
    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
    };
  }, []);

  // אתחול עמוד ראשון בכל עדכון לסינון
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchPhone1, searchPhone2, searchEmail, searchAddress, searchNote]);

  // המרת אובייקט למערך וסינון
  const filteredCustomers = Object.entries(customers).filter(([id, customer]) => {
    return (
      customer.name.toLowerCase().includes(searchName.toLowerCase()) &&
      (customer.phone1 || '').toLowerCase().includes(searchPhone1.toLowerCase()) &&
      (customer.phone2 || '').toLowerCase().includes(searchPhone2.toLowerCase()) &&
      (customer.email || '').toLowerCase().includes(searchEmail.toLowerCase()) &&
      (customer.address || '').toLowerCase().includes(searchAddress.toLowerCase()) &&
      (customer.note || '').toLowerCase().includes(searchNote.toLowerCase())
    );
  });

  // מודדים עמודים
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

  // --------------- יד ושמה: המרת string ל־number ---------------
  const hashStringToNumber = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  // מיפוי קבוע מ-customerId למספר 1–999
  const customerIdMap = useMemo(() => {
    const map = {};
    Object.keys(customers).forEach((id) => {
      map[id] = (hashStringToNumber(id) % 999) + 1;
    });
    return map;
  }, [customers]);
  // ------------------------------------------------------------

  // יצירת נתונים לייצוא
  const exportData = () => {
    return filteredCustomers.map(([id, customer]) => {
      const serial = customerIdMap[id];
      const ordersCount = Object.values(ordersData).filter(o => o.customerId === id).length;
      return {
        'מזהה לקוח': serial,
        'שם לקוח': customer.name,
        'טלפון 1': customer.phone1 || '-',
        'טלפון 2': customer.phone2 || '-',
        'מייל': customer.email || '-',
        'כתובת': customer.address || '-',
        'הערה': customer.note || '-',
        'הזמנות': ordersCount
      };
    });
  };

  const styles = {
    container: { padding: '20px', direction: 'rtl' },
    header: { color: '#3498db', fontSize: '24px', fontWeight: '600', marginBottom: '20px' },
    productCount: { fontSize: '14px', color: '#7f8c8d', marginBottom: '10px', textAlign: 'left' },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      borderRadius: '10px',
      overflow: 'hidden'
    },
    th: { padding: '12px 15px', textAlign: 'right', fontWeight: '600', color: '#495057', borderBottom: '2px solid #e9ecef' },
    td: { padding: '12px 15px', borderBottom: '1px solid #eaeaea', textAlign: 'right', color: '#495057' },
    searchInput: { width: '100%', padding: '6px 8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' },
    editInput: { width: '100%', padding: '6px 8px', boxSizing: 'border-box', border: '1px solid #3498db', borderRadius: '4px' },
    noData: { textAlign: 'center', padding: '30px', backgroundColor: '#f8f9fa', borderRadius: '10px', color: '#7f8c8d', fontSize: '16px' },
    loading: { textAlign: 'center', padding: '30px', color: '#7f8c8d' },
    resetButton: { marginTop: '15px', padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    editButton: { padding: '6px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    saveButton: { padding: '6px 12px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '8px' },
    paginationButton: { padding: '8px 12px', border: '1px solid #dcdfe6', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' },
    activePage: { backgroundColor: '#3498db', color: 'white' },
    exportContainer: { marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>צפייה בלקוחות</h2>

      {isLoading ? (
        <div style={styles.loading}>טוען נתונים...</div>
      ) : filteredCustomers.length === 0 ? (
        <div style={styles.noData}>
          <p>לא נמצאו לקוחות התואמים לסינון.</p>
          <button style={styles.resetButton} onClick={() => {
            setSearchName(''); setSearchPhone1(''); setSearchPhone2('');
            setSearchEmail(''); setSearchAddress(''); setSearchNote('');
          }}>
            איפוס סינון
          </button>
        </div>
      ) : (
        <>
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
                <th style={styles.th}>הערה</th>
                <th style={styles.th}>הזמנות</th>
                <th style={styles.th}>פעולות</th>
              </tr>
              <tr>
                <th style={styles.th}><input type="text" placeholder="חיפוש שם" value={searchName} onChange={e => setSearchName(e.target.value)} style={styles.searchInput} /></th>
                <th style={styles.th}><input type="text" placeholder="חיפוש טלפון 1" value={searchPhone1} onChange={e => setSearchPhone1(e.target.value)} style={styles.searchInput} /></th>
                <th style={styles.th}><input type="text" placeholder="חיפוש טלפון 2" value={searchPhone2} onChange={e => setSearchPhone2(e.target.value)} style={styles.searchInput} /></th>
                <th style={styles.th}><input type="text" placeholder="חיפוש מייל" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} style={styles.searchInput} /></th>
                <th style={styles.th}><input type="text" placeholder="חיפוש כתובת" value={searchAddress} onChange={e => setSearchAddress(e.target.value)} style={styles.searchInput} /></th>
                <th style={styles.th}><input type="text" placeholder="חיפוש הערה" value={searchNote} onChange={e => setSearchNote(e.target.value)} style={styles.searchInput} /></th>
                <th style={styles.th}></th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map(([id, customer]) => {
                const ordersCount = Object.values(ordersData).filter(o => o.customerId === id).length;
                const isEditing = editingId === id;
                return (
                  <tr key={id}>
                    <td style={styles.td}>
                      {isEditing
                        ? <input style={styles.editInput} value={editedCustomer.name} onChange={e => handleChange('name', e.target.value)} />
                        : customer.name}
                    </td>
                    <td style={styles.td}>
                      {isEditing
                        ? <input style={styles.editInput} value={editedCustomer.phone1 || ''} onChange={e => handleChange('phone1', e.target.value)} />
                        : customer.phone1 || '-'}
                    </td>
                    <td style={styles.td}>
                      {isEditing
                        ? <input style={styles.editInput} value={editedCustomer.phone2 || ''} onChange={e => handleChange('phone2', e.target.value)} />
                        : customer.phone2 || '-'}
                    </td>
                    <td style={styles.td}>
                      {isEditing
                        ? <input style={styles.editInput} value={editedCustomer.email || ''} onChange={e => handleChange('email', e.target.value)} />
                        : customer.email || '-'}
                    </td>
                    <td style={styles.td}>
                      {isEditing
                        ? <input style={styles.editInput} value={editedCustomer.address || ''} onChange={e => handleChange('address', e.target.value)} />
                        : customer.address || '-'}
                    </td>
                    <td style={styles.td}>
                      {isEditing
                        ? <textarea style={styles.editInput} value={editedCustomer.note || ''} onChange={e => handleChange('note', e.target.value)} />
                        : <div style={{ whiteSpace: 'pre-wrap' }}>{customer.note || '-'}</div>}
                    </td>
                    <td style={styles.td}>{ordersCount}</td>
                    <td style={styles.td}>
                      {isEditing
                        ? <button style={styles.saveButton} onClick={() => handleSave(id)}>שמור</button>
                        : <button style={styles.editButton} onClick={() => handleEdit(id)}>ערוך</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={styles.paginationContainer}>
            <button style={styles.paginationButton} onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>קודם</button>
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
            <button style={styles.paginationButton} onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>הבא</button>
          </div>

          <div style={styles.exportContainer}>
            <ExportToExcelButton data={exportData()} fileName="customers_export" />
            {filteredCustomers.length <= 20 && (
              <ExportToPdfButton data={exportData()} fileName="customers_export" title="לקוחות" />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ViewCustomers;
