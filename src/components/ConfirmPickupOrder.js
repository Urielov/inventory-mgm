// src/components/ConfirmPickupOrder.js
import React, { useEffect, useState } from 'react';
import { listenToPickupOrders, removePickupOrder } from '../models/pickupOrderModel';
import { createOrder } from '../models/orderModel';
import { listenToProducts, updateStock } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import { useNavigate } from 'react-router-dom';
import { ref, update } from 'firebase/database';
import { db } from '../models/firebase';
import ExportToExcelButton from './ExportToExcelButton';
import ExportToPdfButton from './ExportToPdfButton';
import Select from 'react-select';

const ConfirmPickupOrder = () => {
  const [pickupOrders, setPickupOrders] = useState({});
  const [products, setProducts] = useState({});
  const [customers, setCustomers] = useState({});
  const [selectedPickupId, setSelectedPickupId] = useState(null);
  // editedItems: { [productId]: { required: number, picked: number } }
  const [editedItems, setEditedItems] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterCustomerSelect, setFilterCustomerSelect] = useState(null);
  // מצב בחירת סטטוס לסגירת הזמנה
  const [selectedStatus, setSelectedStatus] = useState({ value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' });
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

  useEffect(() => {
    setSelectedPickupId(null);
    setEditedItems({});
  }, [filterDate, filterCustomerSelect]);

  // אופציות לסינון לקוחות
  const customerFilterOptions = Object.keys(customers).map(key => ({
    value: key,
    label: customers[key].name,
  }));

  // אופציות לבחירת סטטוס לסגירת הזמנה
  const orderStatusOptions = [
    { value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' },
    { value: 'הזמנה סופקה', label: 'הזמנה סופקה' },
    { value: 'הזמנה בוטלה', label: 'הזמנה בוטלה' }
  ];

  // סינון הזמנות לקיטה לפי תאריך ושם לקוח
  let filteredPickupOrders = { ...pickupOrders };
  if (filterDate !== "") {
    filteredPickupOrders = Object.fromEntries(
      Object.entries(filteredPickupOrders).filter(([id, order]) => {
        const orderDate = new Date(order.date).toISOString().split('T')[0];
        return orderDate === filterDate;
      })
    );
  }
  if (filterCustomerSelect) {
    filteredPickupOrders = Object.fromEntries(
      Object.entries(filteredPickupOrders).filter(([id, order]) => {
        return order.customerId === filterCustomerSelect.value;
      })
    );
  }

  // בעת בחירת הזמנה ללקיטה, אתחל את ערכי העריכה
  const handleSelectPickup = (pickupId) => {
    // אם ההזמנה שנבחרה כבר נבחרה, בטל את הבחירה וסגור את הכרטיס
    if (selectedPickupId === pickupId) {
      setSelectedPickupId(null);
      setEditedItems({});
      return;
    }
    // במידה ולא, בחר את ההזמנה ועדכן את ערכי העריכה
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

  // עדכון ערך "נלקט" עבור מוצר מסוים – כאשר המשתמש מקליד ערך
  const handleQuantityChange = (productId, newValue) => {
    const product = products[productId];
    let value = parseInt(newValue, 10) || 0;
    if (product && value > product.stock) {
      alert("לא ניתן לבחור כמות יותר מהמלאי הקיים");
      value = product.stock;
    }
    setEditedItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        picked: value
      }
    }));
  };

  // פונקציית העלאה – מוסיפה כמות, אך בודקת קודם אם לא עולה על המלאי
  const handleIncrease = (productId) => {
    const product = products[productId];
    const currentPicked = editedItems[productId]?.picked || 0;
    if (product && currentPicked >= product.stock) {
      alert("לא ניתן לבחור כמות יותר מהמלאי הקיים");
      return;
    }
    setEditedItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        picked: currentPicked + 1
      }
    }));
  };

  const handleDecrease = (productId) => {
    setEditedItems(prev => {
      const current = editedItems[productId]?.picked || 0;
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

  // חישוב הסכום הכולל על פי מה שנלקט
  const calculateTotalPicked = () => {
    let total = 0;
    for (const pid in editedItems) {
      const product = products[pid];
      if (product) {
        total += product.price * editedItems[pid].picked;
      }
    }
    return total;
  };

  // שמירת העדכון: עדכון הנתיב "pickupOrders/{id}/items" במסד
  const handleSavePickup = async () => {
    if (!selectedPickupId) {
      alert("יש לבחור הזמנה ללקיטה");
      return;
    }
    try {
      setIsSubmitting(true);
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
      // בדיקת מלאי: עבור כל מוצר, ודא שהכמות הנלקטת אינה עולה על המלאי
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
      // חישוב סך המחיר הכולל על פי מה שנלקט
      let totalPrice = calculateTotalPicked();
      // יצירת הזמנה סופית בטבלת orders כולל שדה totalPrice וסטטוס
      const finalOrderData = {
        customerId: pickup.customerId,
        date: new Date().toISOString(),
        items: finalItems,
        totalPrice,
        status: selectedStatus.value  // שמירת סטטוס ההזמנה
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

  // פונקציה לייצוא נתוני הזמנת לקיטה נבחרת (לייצוא לאקסל ול-PDF)
  const exportData = () => {
    if (!selectedPickupId || !pickupOrders[selectedPickupId] || !pickupOrders[selectedPickupId].items) {
      return [];
    }
    const pickup = pickupOrders[selectedPickupId];
    return Object.entries(pickup.items).map(([pid, item]) => {
      const product = products[pid];
      return {
        productId: pid,
        productName: product ? product.name : pid,
        required: item.required !== undefined ? item.required : item.quantity,
        picked: editedItems[pid] ? editedItems[pid].picked : 0,
        stock: product ? product.stock : '-',
        price: product ? product.price : '-'
      };
    });
  };

  const excelData = exportData();

  // סטיילס לסינון
  const filterStyles = {
    filterContainer: { marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' },
    filterInput: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px' },
    selectContainer: { width: '250px' }
  };

  // Inline styles עיקריים
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
    formArea: { padding: '10px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' },
    input: { width: '60px', textAlign: 'center' },
    quantityControl: { display: 'inline-flex', alignItems: 'center', gap: '5px' },
    exportContainer: { marginTop: '20px', display: 'flex', gap: '10px' }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>אישור לקיטה</h2>

      {/* סינון לפי תאריך ושם לקוח */}
      <div style={filterStyles.filterContainer}>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={filterStyles.filterInput}
        />
        <div style={filterStyles.selectContainer}>
          <Select
            options={customerFilterOptions}
            value={filterCustomerSelect}
            onChange={setFilterCustomerSelect}
            placeholder="בחר לקוח לסינון..."
            isClearable
            noOptionsMessage={() => (
              <div>
                אין תוצאות&nbsp;
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterCustomerSelect(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#3498db',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  איפוס
                </button>
              </div>
            )}
          />
        </div>
      </div>

      {Object.keys(filteredPickupOrders).length === 0 ? (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p>לא קיימות הזמנות עבור הסינונים שנבחרו.</p>
          <button
            onClick={() => {
              setFilterDate("");
              setFilterCustomerSelect(null);
            }}
            style={styles.button}
          >
            איפוס סינון
          </button>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>מזהה לקיטה</th>
              <th style={styles.th}>תאריך</th>
              <th style={styles.th}>לקוח</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(filteredPickupOrders).map(([pickupId, pickup]) => {
              const customer = customers[pickup.customerId];
              return (
                <tr
                  key={pickupId}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectPickup(pickupId)}
                >
                  <td style={styles.td}>{pickupId}</td>
                  <td style={styles.td}>{new Date(pickup.date).toLocaleString()}</td>
                  <td style={styles.td}>{customer ? customer.name : pickup.customerId}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {selectedPickupId && pickupOrders[selectedPickupId] && (
        <div style={styles.formArea}>
          <h3>עריכת הזמנת לקיטה: {selectedPickupId}</h3>
          {/* Dropdown לבחירת סטטוס להזמנה, ברירת מחדל "ממתינה למשלוח" */}
          <div style={{ marginBottom: '20px', width: '300px' }}>
            <Select
              options={orderStatusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="בחר סטטוס הזמנה..."
            />
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>מזהה מוצר</th>
                <th style={styles.th}>שם מוצר</th>
                <th style={styles.th}>מחיר</th>
                <th style={styles.th}>מלאי</th>
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
                    <td style={styles.td}>
                      {product ? "₪" + Number(product.price).toLocaleString() : '-'}
                    </td>
                    <td style={styles.td}>{product ? product.stock : '-'}</td>
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
          {/* תצוגת הסכום הכולל בזמן העריכה */}
          <div style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold', textAlign: 'right' }}>
            סה"כ מחיר נלקט: ₪{Number(calculateTotalPicked()).toLocaleString()}
          </div>
          <div style={{ marginTop: '10px' }}>
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
          <div style={styles.exportContainer}>
            <ExportToExcelButton data={excelData} fileName={`pickup_${selectedPickupId}_export`} />
            <ExportToPdfButton data={excelData} fileName={`pickup_${selectedPickupId}_export`} title="לקיטה" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmPickupOrder;
