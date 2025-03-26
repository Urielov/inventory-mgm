import React, { useState, useEffect } from 'react';
import { getCustomerByPhone, addCustomer } from '../models/customerModel';
import { createOnlineOrder } from '../models/onlineOrderModel';
import { listenToProducts } from '../models/productModel';
import ProductImageOnline from './ProductImageOnline';

const OnlineOrder = () => {
  const [phoneInput, setPhoneInput] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    email: '',
    address: '',
  });
  const [products, setProducts] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [errorMessages, setErrorMessages] = useState({});
  const [productFilter, setProductFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [orderItems, setOrderItems] = useState({});

  // Updated dark and professional color scheme
  const styles = {
    container: {
      fontFamily: "'Assistant', sans-serif",
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f7fa', // Light gray-blue background
      minHeight: '100vh',
      direction: 'rtl',
      position: 'relative',
      color: '#1e293b', // Dark slate for text
    },
    header: {
      textAlign: 'center',
      color: '#1e293b',
      fontSize: '2.5rem',
      marginBottom: '30px',
      fontWeight: '600',
      borderBottom: '3px solid #e2e8f0', // Light gray border
      paddingBottom: '15px',
    },
    card: {
      backgroundColor: '#ffffff', // Clean white cards
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)', // Subtle shadow
      padding: '25px',
      marginBottom: '25px',
      transition: 'all 0.3s ease',
      color: '#1e293b',
    },
    input: {
      width: '100%',
      padding: '12px 15px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0', // Light gray border
      fontSize: '16px',
      marginBottom: '15px',
      backgroundColor: '#ffffff',
      color: '#1e293b',
      transition: 'all 0.3s ease',
    },
    button: {
      padding: '12px 25px',
      backgroundColor: '#3b82f6', // Modern blue
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      fontWeight: '600',
    },
    productGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
      marginTop: '20px',
    },
    productCard: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      color: '#1e293b',
    },
    quantityControl: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '15px',
    },
    quantityButton: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '1px solid #3b82f6', // Matching blue border
      backgroundColor: '#ffffff',
      color: '#3b82f6',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    bottomBar: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      padding: '15px 20px',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1000,
      color: '#1e293b',
    },
    submitOrderButton: {
      padding: '12px 16px',
      backgroundColor: '#3b82f6', // Modern blue
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      fontWeight: '600',
    },
    errorMessage: {
      color: '#ef4444', // Bright red for errors
      fontSize: '14px',
      marginTop: '10px',
      textAlign: 'center',
    },
    orderSummary: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
      color: '#1e293b',
    },
    orderSummaryHeader: {
      textAlign: 'center',
      fontSize: '24px',
      fontWeight: '700',
      borderBottom: '2px solid #e2e8f0',
      paddingBottom: '15px',
      marginBottom: '20px',
      color: '#1e293b',
    },
    orderSummaryItemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      borderBottom: '1px solid #e2e8f0',
      padding: '10px 0',
      alignItems: 'center',
    },
    orderSummaryTotal: {
      backgroundColor: '#f8fafc', // Very light gray
      borderRadius: '10px',
      padding: '15px',
      marginTop: '20px',
    },
    orderSummaryTotalLabel: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
    },
    orderSummaryTotalAmount: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#3b82f6', // Matching blue for emphasis
      textAlign: 'right',
    },
    orderSummaryButtonContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '25px',
    },
    orderSummaryEditButton: {
      backgroundColor: '#6b7280', // Neutral gray
      color: '#ffffff',
      padding: '12px 25px',
      borderRadius: '10px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
    },
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeProducts = listenToProducts((data) => {
      setProducts(data);
      setIsLoading(false);
    });
    return () => unsubscribeProducts();
  }, []);

  const handleSearchCustomer = async () => {
    try {
      const snapshot = await getCustomerByPhone(phoneInput);
      const data = snapshot.val();
      if (data) {
        const key = Object.keys(data)[0];
        setFoundCustomer({ value: key, label: data[key].name, ...data[key] });
        setShowCreateCustomer(false);
      } else {
        alert('לא הצלחנו למצוא אותך , מייד תועבר לרישום');
        setFoundCustomer(null);
        setShowCreateCustomer(true);
        setNewCustomerData((prev) => ({ ...prev, phone1: phoneInput }));
      }
    } catch (error) {
      console.error('Error searching customer: ', error);
    }
  };

  const handleCreateCustomerChange = (e) => {
    setNewCustomerData({ ...newCustomerData, [e.target.name]: e.target.value });
  };

  const handleCreateCustomerSubmit = async () => {
    if (!newCustomerData.name.trim()) return alert('יש להזין שם לקוח');
    const customerDataToSave = { ...newCustomerData, phone1: newCustomerData.phone1 || phoneInput };
    if (!customerDataToSave.phone1.trim()) return alert('יש להזין מספר טלפון ראשי');
    try {
      const newCustomerRef = await addCustomer(customerDataToSave);
      const customerId = newCustomerRef.key;
      alert('לקוח נוצר בהצלחה!');
      setFoundCustomer({ value: customerId, label: customerDataToSave.name, ...customerDataToSave });
      setNewCustomerData({ name: '', phone1: '', phone2: '', email: '', address: '' });
      setShowCreateCustomer(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('אירעה שגיאה ביצירת הלקוח');
    }
  };

  const handleIncrease = (productId) => {
    const currentQuantity = parseInt(orderQuantities[productId] || 0, 10);
    const productData = products[productId];
    if (currentQuantity < productData.stock) {
      setOrderQuantities((prev) => ({ ...prev, [productId]: currentQuantity + 1 }));
      setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
    } else {
      setErrorMessages((prev) => ({ ...prev, [productId]: 'חריגה מהמלאי!' }));
    }
  };

  const handleDecrease = (productId) => {
    setOrderQuantities((prev) => {
      const current = parseInt(prev[productId] || 0, 10);
      return { ...prev, [productId]: current > 0 ? current - 1 : 0 };
    });
    setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
  };

  const handleInputChange = (productId, value) => {
    const productData = products[productId];
    let newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 0) newValue = 0;
    if (newValue > productData.stock) {
      setErrorMessages((prev) => ({ ...prev, [productId]: 'חריגה מהמלאי!' }));
      newValue = productData.stock;
    } else {
      setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
    }
    setOrderQuantities((prev) => ({ ...prev, [productId]: newValue }));
  };

  const calculateTotalPrice = () => {
    return Object.entries(orderQuantities).reduce((total, [productId, qty]) => {
      const quantity = parseInt(qty, 10) || 0;
      const product = products[productId];
      return product && quantity > 0 ? total + product.price * quantity : total;
    }, 0);
  };

  const calculateTotalQuantity = () => {
    return Object.values(orderQuantities).reduce(
      (sum, qty) => sum + (parseInt(qty, 10) || 0),
      0
    );
  };

  const calculateTotalProductTypes = () => {
    return Object.values(orderQuantities).filter((qty) => parseInt(qty, 10) > 0).length;
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (!foundCustomer) return alert('יש לבחור לקוח תחילה.');
    const orderItemsData = {};
    Object.entries(orderQuantities).forEach(([productId, quantity]) => {
      const qty = parseInt(quantity, 10);
      if (qty > 0) orderItemsData[productId] = { required: qty, picked: qty };
    });
    if (!Object.keys(orderItemsData).length)
      return alert('יש לבחור לפחות מוצר אחד.');
    setOrderItems(orderItemsData);
    setShowOrderSummary(true);
  };

  const handleConfirmOrder = async () => {
    try {
      setIsSubmitting(true);
      const orderData = {
        customerId: foundCustomer.value,
        date: new Date().toISOString(),
        items: orderItems,
        totalPrice: calculateTotalPrice(),
        status: 'ממתינה למשלוח',
      };
      await createOnlineOrder(orderData);
      alert('ההזמנה בוצעה בהצלחה!');
      setOrderQuantities({});
      setProductFilter('');
      setErrorMessages({});
      setShowOrderSummary(false);
    } catch (error) {
      console.error('Error processing order: ', error);
      alert('שגיאה בהזמנה: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = Object.keys(products).reduce((acc, key) => {
    const product = products[key];
    const searchText = productFilter.toLowerCase();
    if (
      product.name.toLowerCase().includes(searchText) ||
      product.code.toLowerCase().includes(searchText)
    ) {
      acc[key] = product;
    }
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>מצות אבהתנא</h1>

      {/* הדפים של חיפוש לקוח, יצירת לקוח וסינון מוצרים יוצגו רק אם אין סיכום הזמנה */}
      {!showOrderSummary && (
        <>
          {/* חיפוש לקוח */}
          <div style={styles.card}>
            <input
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="הזן מספר טלפון..."
              style={styles.input}
            />
            <button onClick={handleSearchCustomer} style={styles.button}>
             מצא אותי
            </button>
          </div>

          {/* פרטי לקוח */}
          {foundCustomer && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3>לקוח: {foundCustomer.label}</h3>
            </div>
          )}

          {/* יצירת לקוח חדש */}
          {(!foundCustomer && showCreateCustomer) && (
            <div style={styles.card}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>יצירת לקוח חדש</h3>
              {['name', 'phone1', 'phone2', 'email', 'address'].map((field) => (
                <div key={field} style={{ marginBottom: '15px' }}>
                  <label>
                    {field === 'name'
                      ? 'שם לקוח'
                      : field === 'phone1'
                      ? 'טלפון 1'
                      : field === 'phone2'
                      ? 'טלפון 2'
                      : field === 'email'
                      ? 'מייל'
                      : 'כתובת'}
                    :
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    name={field}
                    value={newCustomerData[field]}
                    onChange={handleCreateCustomerChange}
                    style={styles.input}
                    required={field === 'name' || field === 'phone1'}
                  />
                </div>
              ))}
              <button onClick={handleCreateCustomerSubmit} style={styles.button}>
                צור לקוח
              </button>
            </div>
          )}

          {/* סינון מוצרים */}
          {foundCustomer && (
            <div style={styles.card}>
              <input
                type="text"
                placeholder="חפש מוצר..."
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                style={styles.input}
              />
            </div>
          )}
        </>
      )}

      {/* סיכום הזמנה */}
      {showOrderSummary && (
        <div style={styles.orderSummary}>
          <h3 style={styles.orderSummaryHeader}>סיכום הזמנה</h3>
          <div>
            {Object.keys(orderItems).map((productId) => {
              const product = products[productId];
              const qty = orderQuantities[productId];
              return (
                <div key={productId} style={styles.orderSummaryItemRow}>
                  <div>
                    <span>{product.name} (x{qty})</span>
                  </div>
                  <span style={{ color: '#10b981' }}>
                    ₪{(product.price * qty).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={styles.orderSummaryTotal}>
            <div style={styles.orderSummaryTotalLabel}>סה"כ לתשלום</div>
            <div style={styles.orderSummaryTotalAmount}>
              ₪{Number(calculateTotalPrice()).toLocaleString()}
            </div>
          </div>
          <div style={styles.orderSummaryButtonContainer}>
            <button 
              onClick={() => setShowOrderSummary(false)} 
              style={styles.orderSummaryEditButton}
            >
              חזור לעריכה
            </button>
            <button
              onClick={handleConfirmOrder}
              style={styles.submitOrderButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'מעבד הזמנה...' : 'שלח הזמנה'}
            </button>
          </div>
        </div>
      )}

      {/* תוכן ראשי עם מוצרים – יוצג רק אם יש לקוח ואין סיכום הזמנה */}
      {foundCustomer && !showOrderSummary && (
        <div style={{ paddingBottom: '150px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>טוען מוצרים...</div>
          ) : (
            <div style={styles.productGrid}>
              {Object.keys(filteredProducts).map((key) => {
                const product = filteredProducts[key];
                const quantity = orderQuantities[key] || 0;
                return (
                  <div key={key} style={styles.productCard}>
                    <ProductImageOnline imageUrl={product.imageUrl} productName={product.name} />
                    <div style={{ marginTop: '15px' }}>
                      <div>{product.name}</div>
                      <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                        ₪{Number(product.price).toLocaleString()}
                      </div>
                    </div>
                    <div style={styles.quantityControl}>
                      <button onClick={() => handleDecrease(key)} style={styles.quantityButton}>
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        style={{ width: '60px', textAlign: 'center', padding: '5px' }}
                      />
                      <button onClick={() => handleIncrease(key)} style={styles.quantityButton}>
                        +
                      </button>
                    </div>
                    {errorMessages[key] && (
                      <div style={styles.errorMessage}>{errorMessages[key]}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* סיכום תחתון */}
      {foundCustomer && !showOrderSummary && (
        <div style={styles.bottomBar}>
          <div>
            <div>סה"כ מוצרים: {calculateTotalQuantity()}</div>
            <div>סה"כ סוגי פריטים: {calculateTotalProductTypes()}</div>
            <div>סה"כ לתשלום: ₪{Number(calculateTotalPrice()).toLocaleString()}</div>
          </div>
          <button
            onClick={handleSubmitOrder}
            style={styles.submitOrderButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'מבצע הזמנה...' :'סיכום הזמנה'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OnlineOrder;
