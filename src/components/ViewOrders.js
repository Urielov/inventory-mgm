// src/components/ViewOrdersTable.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToOrders } from '../models/orderModel';
import { listenToProducts } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import ExportToExcelButton from './ExportToExcelButton';
import ExportToPdfButton from './ExportToPdfButton';

const ViewOrdersTable = () => {
  const [orders, setOrders] = useState({});
  const [customers, setCustomers] = useState({});
  const [products, setProducts] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState({ value: 'all', label: 'כל הלקוחות' });
  const [searchDate, setSearchDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeOrders = listenToOrders(setOrders);
    const unsubscribeProducts = listenToProducts(setProducts);
    const unsubscribeCustomers = listenToCustomers((data) => {
      setCustomers(data);
      setIsLoading(false);
    });
    
    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, []);

  // הכנת אפשרויות ל-dropdown של לקוחות
  const customerOptions = [
    { value: 'all', label: 'כל הלקוחות' },
    ...Object.keys(customers).map(key => ({
      value: key,
      label: customers[key].name,
    })),
  ];

  // סינון ההזמנות לפי לקוח
  let filteredOrders = {};
  if (selectedCustomer.value === 'all') {
    filteredOrders = { ...orders };
  } else {
    Object.keys(orders).forEach(orderId => {
      const order = orders[orderId];
      if (order.customerId === selectedCustomer.value) {
        filteredOrders[orderId] = order;
      }
    });
  }

  // סינון לפי תאריך, במידה ונבחר תאריך
  if (searchDate !== "") {
    const newFiltered = {};
    Object.entries(filteredOrders).forEach(([orderId, order]) => {
      const orderDate = new Date(order.date).toISOString().split('T')[0];
      if (orderDate === searchDate) {
        newFiltered[orderId] = order;
      }
    });
    filteredOrders = newFiltered;
  }

  // פונקציה לפתיחה/סגירה של פרטי ההזמנה (הצגת פרטי מוצרים)
  const toggleExpand = (orderId) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // פונקציה שמייצרת את הנתונים לייצוא לאקסל/PDF.
  // כל הזמנה תיוצג כשורה, עם מזהה הזמנה, לקוח, תאריך, ולכל מוצר (בכל עמודה) את כמותו.
  const exportData = () => {
    // איסוף מזהי מוצרים מכל ההזמנות המסוננות
    const productIds = new Set();
    Object.values(filteredOrders).forEach(order => {
      if (order.items) {
        Object.keys(order.items).forEach(pid => productIds.add(pid));
      }
    });
    const productIdArray = Array.from(productIds);
    return Object.entries(filteredOrders).map(([orderId, order]) => {
      const customer = customers[order.customerId];
      const row = {
        orderId,
        customer: customer ? customer.name : order.customerId,
        date: new Date(order.date).toLocaleString('he-IL')
      };
      productIdArray.forEach(pid => {
        const productName = products[pid] ? products[pid].name : pid;
        row[productName] = order.items && order.items[pid] ? order.items[pid].quantity : 0;
      });
      return row;
    });
  };

  // Inline styles
  const styles = {
    container: { padding: '20px', direction: 'rtl' },
    header: { color: '#3498db', fontSize: '24px', fontWeight: '600', marginBottom: '20px' },
    divider: { height: '3px', background: 'linear-gradient(to right, #3498db, #5dade2, #85c1e9)', borderRadius: '3px', marginBottom: '20px' },
    filterContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '25px',
      backgroundColor: 'white',
      padding: '15px',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
      gap: '20px'
    },
    filterLabel: { fontWeight: '500', marginLeft: '10px', fontSize: '16px' },
    selectContainer: { width: '300px' },
    dateInput: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
    noData: {
      textAlign: 'center',
      padding: '30px',
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
      color: '#7f8c8d',
      fontSize: '16px'
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
    tableContainer: {
      overflowX: 'auto',
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
    },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0', border: 'none' },
    tableHeader: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef', position: 'sticky', top: 0 },
    tableHeaderCell: { padding: '12px 15px', textAlign: 'right', fontWeight: '600', color: '#495057', borderBottom: '2px solid #e9ecef' },
    tableRow: { transition: 'background-color 0.2s', cursor: 'pointer' },
    tableRowEven: { backgroundColor: '#f8f9fa' },
    tableCell: { padding: '12px 15px', borderBottom: '1px solid #e9ecef', color: '#495057' },
    expandedCell: { padding: '12px 15px', borderBottom: '1px solid #e9ecef', backgroundColor: '#ecf0f1' },
    productDetail: { marginBottom: '5px' },
    loadingContainer: { textAlign: 'center', padding: '30px', color: '#7f8c8d' },
    exportContainer: { marginTop: '20px', display: 'flex', alignItems: 'center' }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>צפייה בהזמנות - טבלה</h2>
        <div style={styles.divider}></div>
        <div style={styles.loadingContainer}>טוען נתונים...</div>
      </div>
    );
  }

  const excelData = exportData();

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>צפייה בהזמנות - טבלה</h2>
      <div style={styles.divider}></div>
      
      <div style={styles.filterContainer}>
        <label style={styles.filterLabel}>בחר לקוח:</label>
        <div style={styles.selectContainer}>
          <Select
            options={customerOptions}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="הקלד או בחר לקוח..."
            isClearable={false}
          />
        </div>
        <div>
          <label style={styles.filterLabel}>בחר תאריך:</label>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            style={styles.dateInput}
          />
        </div>
      </div>
      
      {Object.keys(filteredOrders).length === 0 ? (
        <div style={styles.noData}>
          <p>לא קיימות הזמנות עבור סינון זה.</p>
          <button style={styles.resetButton} onClick={() => {
            setSelectedCustomer({ value: 'all', label: 'כל הלקוחות' });
            setSearchDate("");
          }}>
            איפוס סינון
          </button>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>שם לקוח</th>
                <th style={styles.tableHeaderCell}>מזהה הזמנה</th>
                <th style={styles.tableHeaderCell}>תאריך</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(filteredOrders).map(([orderId, order], index) => {
                const customer = customers[order.customerId];
                const isExpanded = expandedOrders.includes(orderId);
                return (
                  <React.Fragment key={orderId}>
                    <tr
                      style={{
                        ...styles.tableRow,
                        ...(index % 2 === 1 ? styles.tableRowEven : {})
                      }}
                      onClick={() => toggleExpand(orderId)}
                    >
                      <td style={styles.tableCell}>{customer ? customer.name : order.customerId}</td>
                      <td style={styles.tableCell}>{orderId}</td>
                      <td style={styles.tableCell}>{new Date(order.date).toLocaleString('he-IL')}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td style={styles.expandedCell} colSpan="3">
                          {order.items ? (
                            Object.entries(order.items).map(([productId, item]) => {
                              const product = products[productId];
                              return (
                                <div key={productId} style={styles.productDetail}>
                                  <strong>{product ? product.name : productId}</strong>: {item.quantity}
                                </div>
                              );
                            })
                          ) : (
                            <div style={styles.productDetail}>אין פריטים בהזמנה זו.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.exportContainer}>
        <ExportToExcelButton data={excelData} fileName="orders_export" />
        <ExportToPdfButton data={excelData} fileName="orders_export" title="סיכום הזמנות" />
      </div>
    </div>
  );
};



export default ViewOrdersTable;
