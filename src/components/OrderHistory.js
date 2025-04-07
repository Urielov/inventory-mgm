// src/components/OrderHistory.js
import React, { useState, useEffect } from 'react';
import { getOrdersByCustomer } from '../models/onlineOrderModel';

const OrderHistory = ({ customerId, onEditOrder, products }) => { // Added products prop
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const snapshot = await getOrdersByCustomer(customerId);
        const data = snapshot.val();
        if (data) {
          const ordersArray = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          setOrders(ordersArray);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [customerId]);

  const styles = {
    container: {
      fontFamily: "'Assistant', sans-serif",
      padding: '25px',
      backgroundColor: '#f5f7fa',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      color: '#1e293b',
      direction: 'rtl',
      maxWidth: '1000px',
      margin: '0 auto',
    },
    header: {
      textAlign: 'center',
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '30px',
      borderBottom: '3px solid #3b82f6',
      paddingBottom: '15px',
    },
    orderCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
    },
    orderHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '10px',
    },
    orderId: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#3b82f6',
    },
    orderDate: {
      fontSize: '14px',
      color: '#64748b',
    },
    orderDetails: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      marginBottom: '15px',
    },
    detailLabel: {
      fontWeight: '600',
      color: '#64748b',
    },
    detailValue: {
      color: '#1e293b',
      textAlign: 'right',
    },
    totalPrice: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#10b981',
    },
    buttonContainer: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
    },
    editButton: {
      padding: '10px 20px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'background-color 0.3s ease',
    },
    editButtonDisabled: {
      padding: '10px 20px',
      backgroundColor: '#d1d5db',
      color: '#6b7280',
      border: 'none',
      borderRadius: '8px',
      cursor: 'not-allowed',
      fontSize: '14px',
      fontWeight: '600',
    },
    viewButton: {
      padding: '10px 20px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'background-color 0.3s ease',
    },
    noOrders: {
      textAlign: 'center',
      fontSize: '18px',
      color: '#64748b',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
    },
    detailsContainer: {
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '15px',
      border: '1px solid #e2e8f0',
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #e2e8f0',
    },
    itemName: {
      fontSize: '16px',
      color: '#1e293b',
    },
    itemQuantity: {
      fontSize: '16px',
      color: '#64748b',
    },
  };

  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 1000000;
  };

  const canEditOrder = (status) => {
    return status === 'הזמנה חדשה' || status === 'בוטלה';
  };

  const toggleDetails = (orderId) => {
    setSelectedOrder(selectedOrder === orderId ? null : orderId);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>היסטוריית הזמנות</h3>
      {orders.length === 0 ? (
        <div style={styles.noOrders}>אין הזמנות קודמות</div>
      ) : (
        <div>
          {orders.map((order) => (
            <div
              key={order.id}
              style={styles.orderCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.08)';
              }}
            >
              <div style={styles.orderHeader}>
                <span style={styles.orderId}>מספר הזמנה: #{hashCode(order.id)}</span>
                <span style={styles.orderDate}>
                  {new Date(order.date).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div style={styles.orderDetails}>
                <span style={styles.detailLabel}>סטטוס:</span>
                <span style={styles.detailValue}>{order.status}</span>
                <span style={styles.detailLabel}>סה"כ לתשלום:</span>
                <span style={{ ...styles.detailValue, ...styles.totalPrice }}>
                  ₪{Number(order.totalPrice).toLocaleString()}
                </span>
              </div>
              <div style={styles.buttonContainer}>
                <button
                  onClick={() => toggleDetails(order.id)}
                  style={styles.viewButton}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#059669')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#10b981')}
                >
                  {selectedOrder === order.id ? 'הסתר פרטים' : 'צפה בפרטי הזמנה'}
                </button>
                <button
                  onClick={() => onEditOrder(order)}
                  style={canEditOrder(order.status) ? styles.editButton : styles.editButtonDisabled}
                  disabled={!canEditOrder(order.status)}
                  onMouseEnter={(e) =>
                    canEditOrder(order.status) && (e.target.style.backgroundColor = '#2563eb')
                  }
                  onMouseLeave={(e) =>
                    canEditOrder(order.status) && (e.target.style.backgroundColor = '#3b82f6')
                  }
                >
                  ערוך הזמנה
                </button>
              </div>
              {selectedOrder === order.id && (
                <div style={styles.detailsContainer}>
                  <h4 style={{ marginBottom: '10px', color: '#1e293b' }}>פרטי הזמנה</h4>
                  {Object.entries(order.items).map(([productId, item]) => (
                    <div key={productId} style={styles.itemRow}>
                      <span style={styles.itemName}>
                        {products && products[productId] ? products[productId].name : productId}
                      </span>
                      <span style={styles.itemQuantity}>כמות: {item.required}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;