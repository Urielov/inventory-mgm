// src/components/MultiProductOrder.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToProducts, updateStock } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import { createOrder } from '../models/orderModel';

const MultiProductOrder = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({ value: 'הזמנה סופקה', label: 'הזמנה סופקה' });
  const [customers, setCustomers] = useState({});
  const [products, setProducts] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [errorMessages, setErrorMessages] = useState({});
  const [productFilter, setProductFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // מערך אפשרויות לסטטוס ההזמנה
  const orderStatusOptions = [
    { value: 'הזמנה סופקה', label: 'הזמנה סופקה' },
    { value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' },
    { value: 'הזמנה בוטלה', label: 'הזמנה בוטלה' },
  ];

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeCustomers = listenToCustomers(setCustomers);
    const unsubscribeProducts = listenToProducts(setProducts);
    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  if(isLoading){
    // ניתן להוסיף כאן תצוגת טעינה במידת הצורך
  }

  const customerOptions = Object.keys(customers).map(key => ({
    value: key,
    label: customers[key].name,
  }));

  const handleIncrease = (productId) => {
    const currentQuantity = orderQuantities[productId] ? parseInt(orderQuantities[productId], 10) : 0;
    const productData = products[productId];
    if (currentQuantity < productData.stock) {
      setOrderQuantities(prev => ({
        ...prev,
        [productId]: currentQuantity + 1
      }));
      setErrorMessages(prev => ({ ...prev, [productId]: "" }));
    } else {
      setErrorMessages(prev => ({ ...prev, [productId]: "לא ניתן להזין כמות יותר מהמלאי הקיים!" }));
    }
  };

  const handleDecrease = (productId) => {
    setOrderQuantities(prev => {
      const current = prev[productId] ? parseInt(prev[productId], 10) : 0;
      const newVal = current > 0 ? current - 1 : 0;
      return { ...prev, [productId]: newVal };
    });
    setErrorMessages(prev => ({ ...prev, [productId]: "" }));
  };

  const handleInputChange = (productId, value) => {
    const productData = products[productId];
    let newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 0) {
      newValue = 0;
    }
    if (newValue > productData.stock) {
      setErrorMessages(prev => ({ ...prev, [productId]: "לא ניתן להזין כמות יותר מהמלאי הקיים!" }));
      newValue = productData.stock;
    } else {
      setErrorMessages(prev => ({ ...prev, [productId]: "" }));
    }
    setOrderQuantities(prev => ({
      ...prev,
      [productId]: newValue
    }));
  };

  // פונקציה לחישוב סה"כ המחיר
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert("יש לבחור לקוח");
      return;
    }

    // איסוף פריטי ההזמנה: לכל מוצר שבו הוזנה כמות חיובית
    const orderItems = {};
    Object.entries(orderQuantities).forEach(([productId, quantity]) => {
      const qty = parseInt(quantity, 10);
      if (qty > 0) {
        orderItems[productId] = { quantity: qty };
      }
    });

    if (Object.keys(orderItems).length === 0) {
      alert("יש להזין כמות עבור לפחות מוצר אחד");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // בדיקת מלאי ועדכון מלאי לכל מוצר
      for (const [productId, item] of Object.entries(orderItems)) {
        const productData = products[productId];
        if (!productData) {
          alert(`לא נמצא מוצר עם מזהה ${productId}`);
          setIsSubmitting(false);
          return;
        }
        if (productData.stock < item.quantity) {
          alert(`המלאי של המוצר "${productData.name}" לא מספיק`);
          setIsSubmitting(false);
          return;
        }
      }
      
      for (const [productId, item] of Object.entries(orderItems)) {
        const productData = products[productId];
        const newStock = productData.stock - item.quantity;
        await updateStock(productId, newStock);
      }

      // הוספת שדות נוספים להזמנה כולל סטטוס ההזמנה
      const orderData = {
        customerId: selectedCustomer.value,
        date: new Date().toISOString(),
        items: orderItems,
        totalPrice: calculateTotalPrice(),
        status: selectedStatus.value // שמירת הסטטוס הנבחר
      };
      await createOrder(orderData);

      const successMessage = document.getElementById('success-message');
      successMessage.style.display = 'block';
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 3000);

      // איפוס כל השדות
      setSelectedCustomer(null);
      setOrderQuantities({});
      setProductFilter("");
      setErrorMessages({});
      setSelectedStatus({ value: 'הזמנה סופקה', label: 'הזמנה סופקה' });
    } catch (error) {
      console.error("Error processing order: ", error);
      alert("אירעה שגיאה בביצוע ההזמנה: " + error.message);
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

  const selectStyles = {
    control: (base) => ({
      ...base,
      borderRadius: '8px',
      borderColor: '#ccc',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3498db' }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3498db' : state.isFocused ? '#f0f8ff' : null,
      color: state.isSelected ? 'white' : 'black',
    })
  };

  const styles = {
    container: { padding: '20px', direction: 'rtl' },
    header: { color: '#3498db', fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0' },
    divider: { height: '3px', background: 'linear-gradient(to right, #3498db, #5dade2, #85c1e9)', borderRadius: '3px', marginBottom: '20px' },
    card: {
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      padding: '25px',
      marginBottom: '20px'
    },
    formGroup: { marginBottom: '20px' },
    label: { fontWeight: '500', color: '#333', display: 'block', marginBottom: '5px' },
    selectContainer: { width: '300px' },
    subHeader: { color: '#2c3e50', fontSize: '18px', fontWeight: '600', margin: '20px 0 15px 0' },
    filterInput: {
      width: '300px',
      padding: '8px',
      border: '1px solid #ccc',
      borderRadius: '8px'
    },
    noData: {
      textAlign: 'center',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      color: '#7f8c8d',
      fontSize: '16px'
    },
    tableContainer: {
      overflowX: 'auto',
      marginBottom: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)'
    },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0', border: 'none' },
    tableHeader: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' },
    tableHeaderCell: { padding: '12px 15px', textAlign: 'right', fontWeight: '600', color: '#495057', borderBottom: '2px solid #e9ecef' },
    tableRow: { transition: 'background-color 0.2s' },
    tableRowEven: { backgroundColor: '#f8f9fa' },
    tableCell: { padding: '12px 15px', borderBottom: '1px solid #e9ecef', color: '#495057' },
    quantityCell: { padding: '12px 15px', borderBottom: '1px solid #e9ecef', color: '#495057', verticalAlign: 'top' },
    quantityControl: { display: 'flex', alignItems: 'center', gap: '8px' },
    quantityButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      width: '30px',
      height: '30px',
      fontSize: '18px',
      cursor: 'pointer'
    },
    quantityDisplay: { minWidth: '30px', textAlign: 'center', fontSize: '16px' },
    submitButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 25px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease'
    },
    submitButtonDisabled: {
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 25px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'not-allowed'
    },
    successMessage: {
      backgroundColor: '#2ecc71',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      textAlign: 'center',
      display: 'none',
      marginTop: '15px',
      fontWeight: '500'
    },
    loadingContainer: { textAlign: 'center', padding: '30px', color: '#7f8c8d' }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>הזמנה ללקוח</h2>
      <div style={styles.divider}></div>
      
      <form onSubmit={handleSubmit}>
        <div style={styles.card}>
          <div style={styles.formGroup}>
            <label style={styles.label}>בחר לקוח:</label>
            <div style={styles.selectContainer}>
              <Select
                options={customerOptions}
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                placeholder="הקלד או בחר לקוח..."
                isClearable
                styles={selectStyles}
              />
            </div>
          </div>
        </div>

        {selectedCustomer && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>חיפוש מוצרים:</label>
              <input
                type="text"
                placeholder="הקלד שם מוצר או קוד"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                style={styles.filterInput}
              />
            </div>
            
            <h3 style={styles.subHeader}>רשימת מוצרים</h3>
            
            {Object.keys(filteredProducts).length === 0 ? (
              <div style={styles.noData}>לא קיימים מוצרים התואמים לסינון.</div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.tableHeaderCell}>שם מוצר</th>
                      <th style={styles.tableHeaderCell}>קוד מוצר</th>
                      <th style={styles.tableHeaderCell}>מחיר</th>
                      <th style={styles.tableHeaderCell}>מלאי</th>
                      <th style={styles.tableHeaderCell}>כמות להזמנה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(filteredProducts).map((key, index) => {
                      const product = filteredProducts[key];
                      const quantity = orderQuantities[key] ? parseInt(orderQuantities[key], 10) : 0;
                      const highlightStyle = quantity > 0 ? { backgroundColor: '#DFFDDF' } : {};
                      return (
                        <tr key={key} style={{
                          ...styles.tableRow,
                          ...(index % 2 === 1 ? styles.tableRowEven : {}),
                          ...highlightStyle
                        }}>
                          <td style={styles.tableCell}>{product.name}</td>
                          <td style={styles.tableCell}>{product.code}</td>
                          <td style={styles.tableCell}>₪{Number(product.price).toLocaleString()}</td>
                          <td style={styles.tableCell}>{product.stock}</td>
                          <td style={styles.quantityCell}>
                            {product.stock <= 0 ? (
                              <span style={{ color: 'red', fontWeight: 'bold' }}>אזל מהמלאי</span>
                            ) : (
                              <>
                                <div style={styles.quantityControl}>
                                  <button
                                    type="button"
                                    style={styles.quantityButton}
                                    onClick={() => handleDecrease(key)}
                                  >
                                    –
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max={product.stock}
                                    value={orderQuantities[key] !== undefined ? orderQuantities[key] : 0}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    style={{
                                      ...styles.quantityDisplay,
                                      border: '1px solid #ccc',
                                      borderRadius: '4px',
                                      padding: '4px',
                                      textAlign: 'center'
                                    }}
                                  />
                                  <button
                                    type="button"
                                    style={{
                                      ...styles.quantityButton,
                                      opacity: quantity >= product.stock ? 0.5 : 1
                                    }}
                                    onClick={() => handleIncrease(key)}
                                  >
                                    +
                                  </button>
                                </div>
                                {errorMessages[key] && (
                                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                                    {errorMessages[key]}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* תצוגת סה"כ מחיר */}
            <div style={{ marginTop: '10px', fontSize: '18px', fontWeight: 'bold', textAlign: 'right' }}>
              סה"כ מחיר: ₪{Number(calculateTotalPrice()).toLocaleString()}
            </div>
          </>
        )}
        
        {/* הצגת דרופדאון לבחירת סטטוס ליד כפתור "שלח הזמנה" רק אם נבחר לקוח */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          {selectedCustomer && (
            <div style={{ flex: '1', maxWidth: '300px' }}>
              <Select
                options={orderStatusOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                styles={selectStyles}
                placeholder="בחר סטטוס הזמנה"
              />
            </div>
          )}
          <button 
            type="submit" 
            style={isSubmitting ? styles.submitButtonDisabled : styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'מבצע הזמנה...' : 'שלח הזמנה'}
          </button>
        </div>
        
        <div id="success-message" style={styles.successMessage}>
          ההזמנה בוצעה בהצלחה!
        </div>
      </form>
    </div>
  );
};

export default MultiProductOrder;
