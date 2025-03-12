// src/components/ConfirmPickupOrder.js
import React, { useEffect, useState } from 'react';
import { listenToPickupOrders, removePickupOrder } from '../models/pickupOrderModel';
import { createOrder } from '../models/orderModel';
import { listenToProducts, updateStock } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import { useNavigate } from 'react-router-dom';
import { ref, update } from 'firebase/database';
import { db } from '../models/firebase';

const ConfirmPickupOrder = () => {
  const [pickupOrders, setPickupOrders] = useState({});
  const [products, setProducts] = useState({});
  const [customers, setCustomers] = useState({});
  const [selectedPickupId, setSelectedPickupId] = useState(null);
  // editedItems: { [productId]: { required: number, picked: number } }
  const [editedItems, setEditedItems] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubOrders = listenToPickupOrders(setPickupOrders);
    const unsubProducts = listenToProducts(setProducts);
    const unsubCustomers = listenToCustomers(setCustomers);
    return () => {
      unsubOrders();
      unsubProducts();
      unsubCustomers();
    };
  }, []);

  // בעת בחירת הזמנה ללקיטה, אתחל את הערכים:
  // - "required": הערך המקורי (אם קיים) או item.quantity
  // - "picked": אם קיים, נטען, אחרת מאתחל ל-0
  const handleSelectPickup = (pickupId) => {
    setSelectedPickupId(pickupId);
    const pickup = pickupOrders[pickupId];
    if (pickup && pickup.items) {
      const initItems = {};
      Object.entries(pickup.items).forEach(([pid, item]) => {
        initItems[pid] = {
          required: item.required !== undefined ? item.required : item.quantity,
          picked: item.picked !== undefined ? item.picked : 0
        };
      });
      setEditedItems(initItems);
    } else {
      setEditedItems({});
    }
  };

  // עדכון ערך "נלקט" עבור מוצר מסוים
  const handleQuantityChange = (productId, newValue) => {
    const value = parseInt(newValue, 10) || 0;
    setEditedItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        picked: value
      }
    }));
  };

  const handleIncrease = (productId) => {
    setEditedItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        picked: (prev[productId]?.picked || 0) + 1
      }
    }));
  };

  const handleDecrease = (productId) => {
    setEditedItems(prev => {
      const current = prev[productId]?.picked || 0;
      const newVal = current > 0 ? current - 1 : 0;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          picked: newVal
        }
      };
    });
  };

  // שמירת העדכון: עדכון הנתיב "pickupOrders/{id}/items" במסד
  const handleSavePickup = async () => {
    if (!selectedPickupId) {
      alert("יש לבחור הזמנה ללקיטה");
      return;
    }
    try {
      setIsSubmitting(true);
      // עדכון ישיר של "items" תחת ההזמנה הנבחרת
      await update(ref(db, `pickupOrders/${selectedPickupId}/items`), editedItems);
      alert("העדכון נשמר בהצלחה בהזמנת הלקיטה");
    } catch (err) {
      console.error("Error updating pickup order:", err);
      alert("שגיאה בעדכון הזמנת הלקיטה");
    } finally {
      setIsSubmitting(false);
    }
  };

  // סגירת ההזמנה – בדיקת מלאי, הפחתת מלאי, יצירת הזמנה סופית והעברת ההזמנה
  const handleClosePickup = async () => {
    if (!selectedPickupId) {
      alert("יש לבחור הזמנה ללקיטה");
      return;
    }
    try {
      setIsSubmitting(true);
      const pickup = pickupOrders[selectedPickupId];
      if (!pickup) {
        alert("הזמנת לקיטה לא נמצאה");
        setIsSubmitting(false);
        return;
      }

      // בדיקת מלאי: עבור כל מוצר, וודא שהכמות הנלקטת אינה עולה על המלאי
      for (const pid of Object.keys(editedItems)) {
        const pickedQty = editedItems[pid].picked;
        const product = products[pid];
        if (!product) continue;
        if (product.stock < pickedQty) {
          alert(`המלאי של המוצר "${product.name}" לא מספיק`);
          setIsSubmitting(false);
          return;
        }
      }

      // הפחתת מלאי
      for (const pid of Object.keys(editedItems)) {
        const pickedQty = editedItems[pid].picked;
        const product = products[pid];
        if (product) {
          const newStock = product.stock - pickedQty;
          await updateStock(pid, newStock);
        }
      }

      // מייצרים אובייקט items חדש שבו quantity = picked
      const finalItems = {};
      for (const pid of Object.keys(editedItems)) {
        finalItems[pid] = { quantity: editedItems[pid].picked };
      }

      // יצירת הזמנה סופית בטבלת orders
      const finalOrderData = {
        customerId: pickup.customerId,
        date: new Date().toISOString(),
        items: finalItems
      };
      await createOrder(finalOrderData);

      // הסרת ההזמנה מטבלת pickupOrders
      await removePickupOrder(selectedPickupId);

      alert("ההזמנה נסגרה בהצלחה והועברה להזמנות הסופיות");
      navigate('/view-orders');

    } catch (err) {
      console.error("Error closing pickup order:", err);
      alert("שגיאה בסגירת הזמנת הלקיטה");
    } finally {
      setIsSubmitting(false);
    }
  };


  // Inline styles (ניתן לשנות לפי הצורך)
  const styles = {
    container: { padding: '20px', direction: 'rtl' },
    header: { fontSize: '24px', fontWeight: '600', color: '#3498db', marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' },
    th: { border: '1px solid #ccc', padding: '8px', backgroundColor: '#f8f9fa' },
    td: { border: '1px solid #ccc', padding: '8px', textAlign: 'center' },
    button: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      margin: '0 5px'
    },
    disabledButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
      borderRadius: '4px',
      padding: '8px 16px',
      fontSize: '14px',
      cursor: 'not-allowed',
      margin: '0 5px'
    },
    formArea: { padding: '10px', border: '1px solid #ccc', borderRadius: '8px' },
    input: { width: '60px', textAlign: 'center' },
    quantityControl: { display: 'inline-flex', alignItems: 'center', gap: '5px' }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>אישור לקיטה</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>מזהה לקיטה</th>
            <th style={styles.th}>תאריך</th>
            <th style={styles.th}>לקוח</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pickupOrders).map(([pickupId, pickup]) => {
            const customer = customers[pickup.customerId];
            return (
              <tr key={pickupId} style={{ cursor: 'pointer' }} onClick={() => handleSelectPickup(pickupId)}>
                <td style={styles.td}>{pickupId}</td>
                <td style={styles.td}>{new Date(pickup.date).toLocaleString()}</td>
                <td style={styles.td}>{customer ? customer.name : pickup.customerId}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedPickupId && pickupOrders[selectedPickupId] && (
        <div style={styles.formArea}>
          <h3>עריכת הזמנת לקיטה: {selectedPickupId}</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>מזהה מוצר</th>
                <th style={styles.th}>שם מוצר</th>
                <th style={styles.th}>נדרש</th>
                <th style={styles.th}>נלקט</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pickupOrders[selectedPickupId].items).map(([pid, item]) => {
                const product = products[pid];
                const requiredQuantity = item.required !== undefined ? item.required : item.quantity;
                const pickedQuantity = editedItems[pid] ? editedItems[pid].picked : 0;
                return (
                  <tr key={pid}>
                    <td style={styles.td}>{pid}</td>
                    <td style={styles.td}>{product ? product.name : pid}</td>
                    <td style={styles.td}>{requiredQuantity}</td>
                    <td style={styles.td}>
                      <div style={styles.quantityControl}>
                        <button
                          type="button"
                          style={styles.button}
                          onClick={() => handleDecrease(pid)}
                        >
                          –
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={pickedQuantity}
                          onChange={(e) => handleQuantityChange(pid, e.target.value)}
                          style={{ ...styles.input, border: '1px solid #ccc', borderRadius: '4px', padding: '4px' }}
                        />
                        <button
                          type="button"
                          style={styles.button}
                          onClick={() => handleIncrease(pid)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div>
            <button
              style={isSubmitting ? styles.disabledButton : styles.button}
              onClick={handleSavePickup}
              disabled={isSubmitting}
            >
              {isSubmitting ? "שומר..." : "שמור עדכון"}
            </button>
            <button
              style={isSubmitting ? styles.disabledButton : styles.button}
              onClick={handleClosePickup}
              disabled={isSubmitting}
            >
              סגור הזמנה
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmPickupOrder;
