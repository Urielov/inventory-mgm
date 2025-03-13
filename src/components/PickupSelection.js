// src/components/PickupSelection.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToCustomers } from '../models/customerModel';
import { listenToProducts } from '../models/productModel';
import { createPickupOrder } from '../models/pickupOrderModel';
import { useNavigate } from 'react-router-dom';

const PickupSelection = () => {
  const [customers, setCustomers] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeCustomers = listenToCustomers(setCustomers);
    const unsubscribeProducts = listenToProducts(setProducts);
    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  const customerOptions = Object.keys(customers).map(key => ({
    value: key,
    label: customers[key].name,
  }));

  const handleIncrease = (productId) => {
    const product = products[productId];
    if (!product) return;
    const currentQuantity = orderQuantities[productId] ? parseInt(orderQuantities[productId], 10) : 0;
    if (currentQuantity >= product.stock) {
      alert(`המלאי של המוצר "${product.name}" לא מספיק`);
      return;
    }
    setOrderQuantities(prev => ({
      ...prev,
      [productId]: currentQuantity + 1
    }));
  };

  const handleDecrease = (productId) => {
    setOrderQuantities(prev => {
      const current = prev[productId] ? parseInt(prev[productId], 10) : 0;
      const newVal = current > 0 ? current - 1 : 0;
      return { ...prev, [productId]: newVal };
    });
  };

  const handleQuantityChange = (productId, value) => {
    const product = products[productId];
    if (!product) return;
    let numericValue = parseInt(value, 10) || 0;
    if (numericValue > product.stock) {
      alert(`המלאי של המוצר "${product.name}" לא מספיק. המלאי הקיים: ${product.stock}`);
      numericValue = product.stock;
    }
    setOrderQuantities(prev => ({ ...prev, [productId]: numericValue }));
  };

  const validateOrder = () => {
    for (const [pid, qty] of Object.entries(orderQuantities)) {
      const quantity = parseInt(qty, 10) || 0;
      const product = products[pid];
      if (!product) continue;
      if (quantity > product.stock) {
        alert(`המלאי של המוצר "${product.name}" לא מספיק. נסה להזין כמות נמוכה יותר.`);
        return false;
      }
    }
    return true;
  };

  // פונקציה לחישוב הסכום הכולל
  const calculateTotalPrice = () => {
    let total = 0;
    for (const productId in orderQuantities) {
      const quantity = parseInt(orderQuantities[productId], 10) || 0;
      const product = products[productId];
      if (product && quantity > 0) {
        total += product.price * quantity;
      }
    }
    return total;
  };

  const handleCreatePickup = async () => {
    if (!selectedCustomer) {
      alert("אנא בחר לקוח לפני שמירה");
      return;
    }
    // בניית אובייקט הפריטים
    const items = {};
    Object.entries(orderQuantities).forEach(([pid, qty]) => {
      const quantity = parseInt(qty, 10);
      if (quantity > 0) {
        items[pid] = { quantity };
      }
    });
    if (Object.keys(items).length === 0) {
      alert("לא נבחרו פריטים ללקיטה");
      return;
    }
    // ולידציה נוספת: בדיקת מלאי לפני השליחה
    if (!validateOrder()) {
      return;
    }
    try {
      setIsSubmitting(true);
      const pickupData = {
        customerId: selectedCustomer.value,
        date: new Date().toISOString(),
        items,
        totalPrice: calculateTotalPrice() // הוספת שדה הסכום להזמנה
      };
      const newPickupRef = await createPickupOrder(pickupData);
      alert(`נוצרה הזמנת לקיטה חדשה (${newPickupRef.key})`);
      setSelectedCustomer(null);
      setOrderQuantities({});
      navigate('/confirm-pickup-order');
    } catch (error) {
      console.error("Error creating pickup order:", error);
      alert("שגיאה ביצירת הזמנת לקיטה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    container: { padding: '20px', direction: 'rtl' },
    header: { fontSize: '24px', fontWeight: '600', color: '#3498db', marginBottom: '20px' },
    selectContainer: { width: '300px', marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
    th: { border: '1px solid #ccc', padding: '8px', backgroundColor: '#f8f9fa' },
    td: { border: '1px solid #ccc', padding: '8px', textAlign: 'center' },
    button: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      padding: '10px 20px',
      cursor: 'pointer',
      fontSize: '16px'
    },
    disabledButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
      borderRadius: '5px',
      padding: '10px 20px',
      cursor: 'not-allowed',
      fontSize: '16px'
    },
    quantityControl: { display: 'inline-flex', alignItems: 'center', gap: '5px' },
    totalPrice: { marginTop: '10px', fontSize: '18px', fontWeight: 'bold', textAlign: 'right' }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>יצירת הזמנת לקיטה</h2>
      <div style={styles.selectContainer}>
        <Select
          options={customerOptions}
          value={selectedCustomer}
          onChange={setSelectedCustomer}
          placeholder="בחר לקוח..."
          isClearable
        />
      </div>
      {selectedCustomer && (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>שם מוצר</th>
                <th style={styles.th}>קוד מוצר</th>
                <th style={styles.th}>מחיר</th>
                <th style={styles.th}>מלאי</th>
                <th style={styles.th}>כמות</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(products).map(pid => {
                const product = products[pid];
                return (
                  <tr key={pid}>
                    <td style={styles.td}>{product.name}</td>
                    <td style={styles.td}>{product.code}</td>
                    <td style={styles.td}>₪{Number(product.price).toLocaleString()}</td>
                    <td style={styles.td}>{product.stock}</td>
                    <td style={styles.td}>
                      <div style={styles.quantityControl}>
                        <button onClick={() => handleDecrease(pid)}>–</button>
                        <input
                          type="number"
                          min="0"
                          value={orderQuantities[pid] !== undefined ? orderQuantities[pid] : 0}
                          onChange={(e) => handleQuantityChange(pid, e.target.value)}
                          style={{ width: '50px', textAlign: 'center' }}
                        />
                        <button onClick={() => handleIncrease(pid)}>+</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* תצוגת הסכום הכולל */}
          <div style={styles.totalPrice}>
            סה"כ מחיר: ₪{Number(calculateTotalPrice()).toLocaleString()}
          </div>
          <button
            onClick={handleCreatePickup}
            style={isSubmitting ? styles.disabledButton : styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? "שומר..." : "שמור הזמנת לקיטה"}
          </button>
        </>
      )}
    </div>
  );
};

export default PickupSelection;
