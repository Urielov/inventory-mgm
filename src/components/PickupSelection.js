// src/components/PickupSelection.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToCustomers } from '../models/customerModel';
import { listenToProducts } from '../models/productModel';
import { createPickupOrder, updatePickupOrder, listenToPickupOrders } from '../models/pickupOrderModel';
import { ref, get } from 'firebase/database';
import { db } from '../models/firebase';
import ProductImage from './ProductImage';
import { useNavigate } from 'react-router-dom';

// פונקציה להמרת מזהה לקיטה למספר בן 6 ספרות
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // המרה ל־32 ביט
  }
  return Math.abs(hash) % 1000000; // מספר בן 6 ספרות
};

const PickupSelection = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("create");
  const [pickupOrders, setPickupOrders] = useState({});
  const [selectedPickupId, setSelectedPickupId] = useState(null);
  const [editCustomerFilter, setEditCustomerFilter] = useState(null);

  const [customers, setCustomers] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [productFilter, setProductFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubCustomers = listenToCustomers(setCustomers);
    const unsubProducts = listenToProducts(setProducts);
    return () => {
      unsubCustomers();
      unsubProducts();
    };
  }, []);

  useEffect(() => {
    if (mode === "edit") {
      const unsubPickupOrders = listenToPickupOrders(setPickupOrders);
      return () => {
        unsubPickupOrders();
      };
    } else {
      setPickupOrders({});
      setSelectedPickupId(null);
      setEditCustomerFilter(null);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "edit" && selectedPickupId) {
      const pickupRef = ref(db, `pickupOrders/${selectedPickupId}`);
      get(pickupRef)
        .then(snapshot => {
          const data = snapshot.val();
          if (data) {
            setSelectedCustomer({ value: data.customerId, label: (customers[data.customerId]?.name) || data.customerId });
            const initQuantities = {};
            if (data.items) {
              Object.entries(data.items).forEach(([pid, item]) => {
                initQuantities[pid] = parseInt(item.quantity, 10) || 0;
              });
            }
            setOrderQuantities(initQuantities);
          }
        })
        .catch(err => {
          console.error("Error loading pickup order data:", err);
        });
    }
  }, [mode, selectedPickupId, customers]);

  useEffect(() => {
    setEditCustomerFilter(null);
  }, [mode]);

  const customerOptions = Object.keys(customers).map(key => ({
    value: key,
    label: customers[key].name,
  }));

  const filteredProducts = Object.keys(products).filter(pid => {
    const product = products[pid];
    const filterLower = productFilter.toLowerCase();
    return (
      product.name.toLowerCase().includes(filterLower) ||
      product.code.toLowerCase().includes(filterLower)
    );
  });

  const filteredPickupOrders = mode === "edit"
    ? Object.fromEntries(
        Object.entries(pickupOrders).filter(([pickupId, order]) => {
          if (editCustomerFilter) {
            return order.customerId === editCustomerFilter.value;
          }
          return true;
        })
      )
    : {};

  const handleIncrease = (productId) => {
    const product = products[productId];
    const current = orderQuantities[productId] ? parseInt(orderQuantities[productId], 10) : 0;
    // אם לא במצב עריכה, נבדוק את המלאי
    if (mode !== "edit" && product && current >= product.stock) {
      alert(`המלאי של המוצר "${product.name}" לא מספיק`);
      return;
    }
    setOrderQuantities(prev => ({ ...prev, [productId]: current + 1 }));
  };

  const handleDecrease = (productId) => {
    const current = orderQuantities[productId] ? parseInt(orderQuantities[productId], 10) : 0;
    const newVal = current > 0 ? current - 1 : 0;
    setOrderQuantities(prev => ({ ...prev, [productId]: newVal }));
  };

  const handleQuantityChange = (productId, value) => {
    const product = products[productId];
    let numericValue = parseInt(value, 10) || 0;
    // אם לא במצב עריכה, נוודא שהכמות לא עולה על המלאי
    if (mode !== "edit" && product && numericValue > product.stock) {
      alert(`המלאי של המוצר "${product.name}" לא מספיק. המלאי הקיים: ${product.stock}`);
      numericValue = product.stock;
    }
    setOrderQuantities(prev => ({ ...prev, [productId]: numericValue }));
  };

  const validateOrder = () => {
    // במצב עריכה, דילוג על בדיקת מלאי
    if (mode === "edit") return true;
    for (const pid in orderQuantities) {
      const qty = parseInt(orderQuantities[pid], 10) || 0;
      const product = products[pid];
      if (product && qty > product.stock) {
        alert(`המלאי של המוצר "${product.name}" לא מספיק. נסה להזין כמות נמוכה יותר.`);
        return false;
      }
    }
    return true;
  };

  const calculateTotalPrice = () => {
    let total = 0;
    for (const pid in orderQuantities) {
      const qty = parseInt(orderQuantities[pid], 10) || 0;
      const product = products[pid];
      if (product && qty > 0) {
        total += product.price * qty;
      }
    }
    return total;
  };

  const handleSubmit = async () => {
    if (mode === "create" && !selectedCustomer) {
      alert('אנא בחר לקוח לפני שמירה');
      return;
    }
    if (mode === "edit" && !selectedPickupId) {
      alert('אנא בחר הזמנת לקיטה לעריכה');
      return;
    }

    const items = {};
    Object.entries(orderQuantities).forEach(([pid, qty]) => {
      const quantity = parseInt(qty, 10) || 0;
      if (quantity > 0) {
        items[pid] = { quantity };
      }
    });
    if (Object.keys(items).length === 0) {
      alert('לא נבחרו פריטים להזמנה');
      return;
    }
    if (!validateOrder()) return;

    const pickupData = {
      customerId: selectedCustomer.value,
      date: new Date().toISOString(),
      items,
      totalPrice: calculateTotalPrice(),
    };

    setIsSubmitting(true);
    try {
      if (mode === "edit" && selectedPickupId) {
        await updatePickupOrder(selectedPickupId, pickupData);
        alert(`הזמנת הלקיטה ${hashCode(selectedPickupId)} עודכנה בהצלחה`);
      } else {
        const newPickupRef = await createPickupOrder(pickupData);
        alert(`נוצרה הזמנת לקיטה חדשה (${hashCode(newPickupRef.key)})`);
      }
      navigate('/confirm-pickup-order');
    } catch (error) {
      console.error("Error processing pickup order:", error);
      alert("שגיאה בעיבוד הזמנת הלקיטה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPickupOrder = (pickupId) => {
    setSelectedPickupId(pickupId);
  };

  const styles = {
    container: {
      padding: '30px',
      direction: 'rtl',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: '"Rubik", "Assistant", Arial, sans-serif',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%)',
      minHeight: '100vh',
    },
    header: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: '30px',
      paddingBottom: '15px',
      borderBottom: '4px solid #3B82F6',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    modeToggleContainer: {
      marginBottom: '20px',
      display: 'flex',
      gap: '15px',
    },
    modeButton: (active) => ({
      padding: '12px 24px',
      background: active ? '#3B82F6' : '#F9FAFB',
      color: active ? 'white' : '#1E293B',
      border: active ? 'none' : '1px solid #D1D5DB',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
    }),
    selectContainer: {
      width: '100%',
      maxWidth: '200px',
      marginBottom: '20px',
    },
    filterContainer: {
      width: '100%',
      maxWidth: '200px',
      marginBottom: '20px',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
    },
    filterInput: {
      padding: '12px 15px',
      borderRadius: '8px',
      border: '1px solid #D1D5DB',
      width: '100%',
      fontSize: '15px',
      background: '#F9FAFB',
      transition: 'border-color 0.2s ease',
      outline: 'none',
    },
    tableContainer: {
      overflowX: 'auto',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
      marginBottom: '30px',
      border: '1px solid #E5E7EB',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
      fontSize: '15px',
    },
    th: {
      padding: '18px 20px',
      textAlign: 'right',
      fontWeight: '700',
      color: '#1E293B',
      background: '#F8FAFC',
      borderBottom: '2px solid #E5E7EB',
      textTransform: 'uppercase',
      fontSize: '13px',
      letterSpacing: '0.5px',
    },
    td: {
      padding: '16px 20px',
      borderBottom: '1px solid #E5E7EB',
      color: '#4B5563',
      textAlign: 'center',
      verticalAlign: 'middle',
    },
    quantityControl: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    quantityButton: {
      padding: '6px 12px',
      background: '#1E293B',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    quantityInput: {
      width: '50px',
      textAlign: 'center',
      padding: '8px 10px',
      borderRadius: '4px',
      border: '1px solid #D1D5DB',
      outline: 'none',
    },
    totalPrice: {
      marginBottom: '20px',
      fontSize: '20px',
      fontWeight: '600',
      color: '#1E293B',
      textAlign: 'right',
      padding: '15px',
      background: '#F8FAFC',
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
    },
    button: {
      padding: '12px 24px',
      background: '#3B82F6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    disabledButton: {
      padding: '12px 24px',
      background: '#9CA3AF',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'not-allowed',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(156, 163, 175, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>יצירת / עריכת הזמנת לקיטה</h2>
      <div style={styles.modeToggleContainer}>
        <button
          style={styles.modeButton(mode === "create")}
          onClick={() => { setMode("create"); setSelectedPickupId(null); setOrderQuantities({}); }}
        >
          יצירה חדשה
        </button>
        <button
          style={styles.modeButton(mode === "edit")}
          onClick={() => { setMode("edit"); setSelectedPickupId(null); setOrderQuantities({}); setEditCustomerFilter(null); }}
        >
          עריכת הזמנה קיימת
        </button>
      </div>
      {mode === "edit" && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <Select
              options={customerOptions}
              value={editCustomerFilter}
              onChange={setEditCustomerFilter}
              placeholder="סינון לפי לקוח"
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '44px',
                  borderRadius: '8px',
                  borderColor: '#D1D5DB',
                  background: '#F9FAFB',
                  boxShadow: 'none',
                  fontSize: '15px',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
                  color: state.isSelected ? 'white' : '#1E293B',
                  fontSize: '15px',
                  padding: '10px 12px',
                }),
              }}
            />
          </div>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>מזהה לקיטה</th>
                  <th style={styles.th}>לקוח</th>
                  <th style={styles.th}>תאריך</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(filteredPickupOrders).map(([pickupId, pickup]) => {
                  const cust = customers[pickup.customerId];
                  return (
                    <tr key={pickupId} style={{ cursor: 'pointer' }} onClick={() => handleSelectPickupOrder(pickupId)}>
                      <td style={styles.td}>{hashCode(pickupId)}</td>
                      <td style={styles.td}>{cust ? cust.name : pickup.customerId}</td>
                      <td style={styles.td}>{new Date(pickup.date).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {mode === "create" && (
        <div style={{ marginBottom: '20px' }}>
          <Select
            options={customerOptions}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="בחר לקוח..."
            isClearable
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '44px',
                borderRadius: '8px',
                borderColor: '#D1D5DB',
                background: '#F9FAFB',
                boxShadow: 'none',
                fontSize: '15px',
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
                color: state.isSelected ? 'white' : '#1E293B',
                fontSize: '15px',
                padding: '10px 12px',
              }),
            }}
          />
        </div>
      )}
      {((mode === "create" && selectedCustomer) || (mode === "edit" && selectedPickupId)) && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              placeholder="חפש לפי שם מוצר או קוד מוצר..."
              style={styles.filterInput}
            />
          </div>
          <div style={styles.tableContainer}>
            {filteredProducts.length > 0 ? (
              <table style={styles.table}>
                <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E5E7EB' }}>
                  <tr>
                    <th style={styles.th}>תמונה</th>
                    <th style={styles.th}>שם מוצר</th>
                    <th style={styles.th}>מק"ט</th>
                    <th style={styles.th}>מחיר</th>
                    <th style={styles.th}>מלאי</th>
                    <th style={styles.th}>כמות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(pid => {
                    const product = products[pid];
                    const quantity = orderQuantities[pid] !== undefined ? orderQuantities[pid] : 0;
                    const isSelected = quantity > 0;
                    return (
                      <tr key={pid} style={{
                        transition: 'all 0.2s ease',
                        backgroundColor: isSelected ? '#DFFDDF' : 'transparent',
                        borderRight: isSelected ? '4px solid #3B82F6' : 'none',
                        transform: isSelected ? 'scale(1.01)' : 'scale(1)'
                      }}>
                        <td style={styles.td}>
                          {product && product.imageUrl ? (
                            <ProductImage imageUrl={product.imageUrl} productName={product.name} isEditable={false} onImageUpdate={() => {}} />
                          ) : "אין תמונה"}
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '600', color: '#1E293B' }}>{product.name}</div>
                        </td>
                        <td style={styles.td}>{product.code}</td>
                        <td style={styles.td}>₪{Number(product.price).toLocaleString()}</td>
                        <td style={styles.td}>
                          {product.stock === 0 ? (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              background: '#FEE2E2',
                              color: '#EF4444',
                              fontSize: '13px',
                              fontWeight: '600',
                            }}>
                              אזל מהמלאי
                            </span>
                          ) : (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              background: '#D1FAE5',
                              color: '#10B981',
                              fontSize: '13px',
                            }}>
                              {product.stock}
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.quantityControl}>
                            <button
                              onClick={() => handleDecrease(pid)}
                              style={styles.quantityButton}
                              disabled={quantity <= 0}
                            >
                              –
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) => handleQuantityChange(pid, e.target.value)}
                              style={styles.quantityInput}
                            />
                            <button
                              onClick={() => handleIncrease(pid)}
                              style={styles.quantityButton}
                              disabled={mode !== "edit" && quantity >= product.stock}
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
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6B7280', fontSize: '16px', fontWeight: '500' }}>
                לא נמצאו מוצרים התואמים לחיפוש "{productFilter}"
              </div>
            )}
          </div>
        </>
      )}
      {mode === "create" && !selectedCustomer ? (
        <div style={{ marginBottom: '20px', textAlign: 'center', color: '#1E293B', fontWeight: '600' }}>
          נא לבחור לקוח ליצירת הזמנה חדשה
        </div>
      ) : null}
      {((mode === "create" && selectedCustomer) || (mode === "edit" && selectedPickupId)) && (
        <div style={styles.totalPrice}>
          סה"כ מחיר: ₪{Number(calculateTotalPrice()).toLocaleString()}
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={isSubmitting ? styles.disabledButton : styles.button}
      >
        {isSubmitting ? (
          <>
            <span style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: '3px solid #fff',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginLeft: '8px',
            }}></span>
            שומר...
          </>
        ) : (
          <>
            {mode === "edit" ? 'עדכון הזמנת לקיטה' : 'שמירה'}
          </>
        )}
      </button>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .tableContainer {
              margin: 0 -30px 30px -30px;
              borderRadius: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PickupSelection;
