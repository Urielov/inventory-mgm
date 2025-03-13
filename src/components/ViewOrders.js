import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToOrders, updateOrder } from '../models/orderModel';
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
  const [editedItems, setEditedItems] = useState({});

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

  // פונקציה לפתיחה/סגירה של פירוט ההזמנה
  const toggleExpand = (orderId) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
    
    if (!editedItems[orderId] && filteredOrders[orderId] && filteredOrders[orderId].items) {
      const initItems = {};
      Object.entries(filteredOrders[orderId].items).forEach(([pid, item]) => {
        initItems[pid] = {
          quantity: item.quantity, 
          comment: item.comment || ""
        };
      });
      setEditedItems(prev => ({ ...prev, [orderId]: initItems }));
    }
  };

  // פונקציה כללית לעדכון ערך עבור מוצר בהזמנה
  const handleItemChange = (orderId, productId, field, value) => {
    setEditedItems(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [productId]: {
          ...prev[orderId]?.[productId],
          [field]: value
        }
      }
    }));
  };

  // עדכון כמות (quantity)
  const handleQuantityChange = (orderId, productId, newValue) => {
    const numericValue = parseInt(newValue, 10) || 0;
    handleItemChange(orderId, productId, "quantity", numericValue);
  };

  const handleIncrease = (orderId, productId) => {
    const current = editedItems[orderId]?.[productId]?.quantity || 0;
    handleItemChange(orderId, productId, "quantity", current + 1);
  };

  const handleDecrease = (orderId, productId) => {
    const current = editedItems[orderId]?.[productId]?.quantity || 0;
    const newVal = current > 0 ? current - 1 : 0;
    handleItemChange(orderId, productId, "quantity", newVal);
  };

  // עדכון הערה (comment)
  const handleCommentChange = (orderId, productId, newValue) => {
    handleItemChange(orderId, productId, "comment", newValue);
  };

  // שמירת עדכון פריט בהזמנה
  const handleSaveItem = async (orderId, productId) => {
    const itemEdits = editedItems[orderId]?.[productId];
    if (!itemEdits) return;
    try {
      await updateOrder(orderId, {
        [`items/${productId}/quantity`]: itemEdits.quantity,
        [`items/${productId}/comment`]: itemEdits.comment
      });
      
      // שימוש ב-toast notification במקום alert
      showToast("עדכון הפריט נשמר בהצלחה!", "success");
    } catch (error) {
      console.error("שגיאה בעדכון הפריט:", error);
      showToast("שגיאה בעדכון הפריט", "error");
    }
  };

  // פונקציה לחישוב סה"כ מחיר לכל הזמנה
  const calculateTotalPrice = (order) => {
    let total = 0;
    if (order.items) {
      Object.entries(order.items).forEach(([pid, item]) => {
        const product = products[pid];
        if (product) {
          total += product.price * item.quantity;
        }
      });
    }
    return total;
  };

  // פונקציה שמייצרת את הנתונים לייצוא לאקסל/PDF
  const exportData = () => {
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
        date: new Date(order.date).toLocaleString('he-IL'),
        totalPrice: "₪" + calculateTotalPrice(order).toLocaleString()
      };
      productIdArray.forEach(pid => {
        const productName = products[pid] ? products[pid].name : pid;
        row[productName] = order.items && order.items[pid] ? order.items[pid].quantity : 0;
      });
      return row;
    });
  };

  // פונקציה להצגת התראות (toast)
  const showToast = (message, type = 'info') => {
    // כאן ניתן לשלב ספריית toast notifications כמו react-toastify
    // לדוגמה בלבד, אני מדמה פונקציונליות של toast
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '10px 20px';
    toast.style.backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    toast.style.color = 'white';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    toast.style.zIndex = '1000';
    toast.style.minWidth = '250px';
    toast.style.textAlign = 'center';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, 1500);
  };

  const excelData = exportData();

  // סגנונות משופרים עם תמיכה ברספונסיביות
  const styles = {
    container: { 
      padding: '20px', 
      direction: 'rtl',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: '"Segoe UI", "Heebo", Arial, sans-serif'
    },
    header: { 
      color: '#2c3e50', 
      fontSize: '28px', 
      fontWeight: '600', 
      marginBottom: '20px',
      borderBottom: '3px solid #3498db',
      paddingBottom: '10px'
    },
    filterContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: '25px',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 3px 15px rgba(0, 0, 0, 0.1)',
      gap: '20px'
    },
    filterSection: {
      flex: '1 1 300px',
      minWidth: '250px',
      marginBottom: '10px'
    },
    filterLabel: { 
      fontWeight: '500', 
      marginBottom: '8px', 
      fontSize: '16px',
      display: 'block',
      color: '#34495e'
    },
    selectContainer: { 
      width: '100%',
    },
    dateInput: { 
      padding: '10px 12px', 
      borderRadius: '5px', 
      border: '1px solid #dcdfe6',
      width: '100%',
      fontSize: '14px'
    },
    noData: {
      textAlign: 'center',
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 3px 15px rgba(0, 0, 0, 0.1)',
      color: '#7f8c8d',
      fontSize: '16px'
    },
    resetButton: {
      marginTop: '15px',
      padding: '10px 20px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      fontSize: '14px',
      fontWeight: '500'
    },
    tableContainer: {
      overflowX: 'auto',
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 3px 15px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px'
    },
    table: { 
      width: '100%', 
      borderCollapse: 'separate', 
      borderSpacing: '0', 
      border: 'none',
      fontSize: '14px'
    },
    tableHeader: { 
      backgroundColor: '#f8fafc', 
      borderBottom: '2px solid #e2e8f0'
    },
    tableHeaderCell: { 
      padding: '16px', 
      textAlign: 'right', 
      fontWeight: '600', 
      color: '#334155',
      whiteSpace: 'nowrap' 
    },
    tableRow: { 
      transition: 'background-color 0.2s', 
      cursor: 'pointer',
      ':hover': {
        backgroundColor: '#f1f5f9'
      }
    },
    tableRowEven: { 
      backgroundColor: '#f8fafc' 
    },
    tableCell: { 
      padding: '14px 16px', 
      borderBottom: '1px solid #e2e8f0', 
      color: '#475569'
    },
    expandedContainer: {
      backgroundColor: '#f8fafc',
      padding: '15px',
      borderRadius: '8px',
      margin: '0 16px 16px 16px',
      border: '1px solid #e2e8f0',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
    },
    expandedCell: {
      padding: '14px 16px',
      borderBottom: '1px solid #e2e8f0'
    },
    productDetail: { 
      display: 'flex', 
      flexWrap: 'wrap',
      alignItems: 'center', 
      gap: '15px', 
      marginBottom: '15px',
      padding: '10px',
      borderBottom: '1px solid #e2e8f0'
    },
    productName: {
      minWidth: '150px',
      fontWeight: '600',
      color: '#334155',
      flex: '1 1 200px'
    },
    inputGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flex: '1 1 auto',
      marginBottom: '5px'
    },
    inputLabel: {
      fontWeight: '500',
      fontSize: '14px',
      color: '#475569'
    },
    commentInput: { 
      padding: '8px 10px', 
      border: '1px solid #dcdfe6', 
      borderRadius: '5px', 
      flex: '1',
      minWidth: '200px',
      fontSize: '14px'
    },
    quantityControl: {
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #dcdfe6',
      borderRadius: '5px',
      overflow: 'hidden'
    },
    quantityButton: {
      border: 'none',
      backgroundColor: '#f1f5f9',
      color: '#334155',
      width: '32px',
      height: '32px',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    quantityInput: { 
      padding: '5px 0', 
      border: 'none',
      width: '40px',
      textAlign: 'center',
      fontSize: '14px'
    },
    saveItemButton: {
      padding: '8px 16px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    loadingContainer: { 
      textAlign: 'center', 
      padding: '50px', 
      color: '#7f8c8d' 
    },
    exportContainer: { 
      marginTop: '20px', 
      display: 'flex', 
      gap: '10px',
      flexWrap: 'wrap'
    },
    exportButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 15px',
      borderRadius: '5px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      color: '#334155',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontWeight: '500',
      fontSize: '14px'
    },
    totalPrice: { 
      fontSize: '16px', 
      fontWeight: 'bold', 
      color: '#334155',
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 16px',
      borderTop: '2px solid #e2e8f0',
      backgroundColor: '#f8fafc'
    },
    badge: {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: '500'
    },
    actionButton: {
      border: 'none',
      backgroundColor: 'transparent',
      color: '#3498db',
      cursor: 'pointer',
      padding: '5px',
      borderRadius: '3px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    }
  };

  // רכיב loader לזמן הטעינה
  if (isLoading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>צפייה בהזמנות</h2>
        <div style={styles.loadingContainer}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '15px'
          }}></div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
          <p>טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>צפייה בהזמנות</h2>
      
      <div style={styles.filterContainer}>
        <div style={styles.filterSection}>
          <label style={styles.filterLabel}>בחר לקוח:</label>
          <div style={styles.selectContainer}>
            <Select
              options={customerOptions}
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              placeholder="הקלד או בחר לקוח..."
              isClearable={false}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  borderColor: '#dcdfe6',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#c0c4cc'
                  }
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected 
                    ? '#3498db'
                    : state.isFocused 
                      ? '#f0f7ff' 
                      : null,
                  color: state.isSelected ? 'white' : '#606266'
                })
              }}
            />
          </div>
        </div>
        
        <div style={styles.filterSection}>
          <label style={styles.filterLabel}>בחר תאריך:</label>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            style={styles.dateInput}
          />
        </div>
        
        {(selectedCustomer.value !== 'all' || searchDate !== "") && (
          <div style={styles.filterSection}>
            <button 
              style={{
                ...styles.resetButton,
                marginTop: '24px'
              }} 
              onClick={() => {
                setSelectedCustomer({ value: 'all', label: 'כל הלקוחות' });
                setSearchDate("");
              }}
            >
              ניקוי סינון
            </button>
          </div>
        )}
      </div>
      
      {Object.keys(filteredOrders).length === 0 ? (
        <div style={styles.noData}>
          <div style={{ fontSize: '48px', marginBottom: '15px', color: '#cbd5e1' }}>📭</div>
          <p>לא קיימות הזמנות עבור סינון זה.</p>
          <button 
            style={styles.resetButton} 
            onClick={() => {
              setSelectedCustomer({ value: 'all', label: 'כל הלקוחות' });
              setSearchDate("");
            }}
          >
            הצג את כל ההזמנות
          </button>
        </div>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.tableHeaderCell}>שם לקוח</th>
                  <th style={styles.tableHeaderCell}>תאריך</th>
                  <th style={styles.tableHeaderCell}>סה"כ מחיר</th>
                  <th style={{...styles.tableHeaderCell, width: '50px'}}></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(filteredOrders).map(([orderId, order], index) => {
                  const customer = customers[order.customerId];
                  const isExpanded = expandedOrders.includes(orderId);
                  const totalPrice = calculateTotalPrice(order);
                  
                  return (
                    <React.Fragment key={orderId}>
                      <tr
                        style={{
                          ...styles.tableRow,
                          ...(index % 2 === 1 ? styles.tableRowEven : {}),
                          backgroundColor: isExpanded ? '#f0f7ff' : undefined
                        }}
                        onClick={() => toggleExpand(orderId)}
                      >
                        <td style={styles.tableCell}>
                          <div style={{ fontWeight: '500' }}>{customer ? customer.name : order.customerId}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>מזהה: {orderId.substring(0, 8)}...</div>
                        </td>
                        <td style={styles.tableCell}>
                          {new Date(order.date).toLocaleString('he-IL', { 
                            year: 'numeric', 
                            month: 'numeric', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#334155'
                          }}>
                            ₪{totalPrice.toLocaleString()}
                          </div>
                          {order.items && (
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {Object.keys(order.items).length} פריטים
                            </div>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={{
                            ...styles.badge,
                            backgroundColor: isExpanded ? '#e0f2fe' : '#f1f5f9',
                            color: isExpanded ? '#0284c7' : '#64748b',
                          }}>
                            {isExpanded ? 'סגור' : 'פתח'}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="4" style={{ padding: 0, borderBottom: '1px solid #e2e8f0' }}>
                            <div style={styles.expandedContainer}>
                              {order.items && Object.keys(order.items).length > 0 ? (
                                <>
                                  {Object.entries(order.items).map(([productId, item]) => {
                                    const product = products[productId];
                                    const edited = (editedItems[orderId] && editedItems[orderId][productId]) || {};
                                    const quantityValue = edited.quantity !== undefined ? edited.quantity : item.quantity;
                                    const commentValue = edited.comment !== undefined ? edited.comment : (item.comment || "");
                                    
                                    return (
                                      <div key={productId} style={styles.productDetail}>
                                        <div style={styles.productName}>
                                          {product ? product.name : productId}
                                          {product && (
                                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal' }}>
                                              ₪{product.price.toLocaleString()} ליחידה
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div style={styles.inputGroup}>
                                          <span style={styles.inputLabel}>כמות:</span>
                                          <div style={styles.quantityControl}>
                                            <button 
                                              type="button"
                                              style={styles.quantityButton}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDecrease(orderId, productId);
                                              }}
                                            >
                                              -
                                            </button>
                                            <input
                                              type="text"
                                              value={quantityValue}
                                              onChange={(e) => handleQuantityChange(orderId, productId, e.target.value)}
                                              style={styles.quantityInput}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <button 
                                              type="button"
                                              style={styles.quantityButton}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleIncrease(orderId, productId);
                                              }}
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                        
                                        <div style={styles.inputGroup}>
                                          <span style={styles.inputLabel}>הערה:</span>
                                          <input
                                            type="text"
                                            value={commentValue}
                                            onChange={(e) => handleCommentChange(orderId, productId, e.target.value)}
                                            style={styles.commentInput}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="הוסף הערה לפריט..."
                                          />
                                        </div>
                                        
                                        <button
                                          style={styles.saveItemButton}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveItem(orderId, productId);
                                          }}
                                        >
                                          <span style={{ fontSize: '16px' }}>💾</span>
                                          שמור
                                        </button>
                                      </div>
                                    );
                                  })}
                                  <div style={styles.totalPrice}>
                                    <span>סה"כ:</span>
                                    <span>₪{calculateTotalPrice(order).toLocaleString()}</span>
                                  </div>
                                </>
                              ) : (
                                <div style={{ padding: '20px 10px', textAlign: 'center', color: '#64748b' }}>
                                  אין פריטים בהזמנה זו.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div style={styles.exportContainer}>
            <ExportToExcelButton 
              data={excelData} 
              fileName="orders_export" 
              style={styles.exportButton}
            />
            <ExportToPdfButton 
              data={excelData} 
              fileName="orders_export" 
              title="הזמנות" 
              style={styles.exportButton}
            />
          </div>
        </>
      )}
      
      {/* עבור לכתובת עם Media Queries */}
      <style>
        {`
          @media (max-width: 768px) {
            .filterContainer {
              flex-direction: column;
              align-items: stretch;
            }
            
            .productDetail {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .inputGroup {
              width: 100%;
            }
            
            .tableHeaderCell, .tableCell {
              padding: 10px 8px;
            }
          }
          
          @media (max-width: 480px) {
            .expandedContainer {
              margin: 0;
              border-radius: 0;
            }
            
            .tableContainer {
              border-radius: 0;
              margin-right: -20px;
              margin-left: -20px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ViewOrdersTable;