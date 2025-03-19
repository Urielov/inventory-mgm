import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToProducts, updateStock, updateOrderedQuantity } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import { createOrder } from '../models/orderModel';
import ProductImage from './ProductImage';
import successSound from '../assets/sounds/success.mp3';
import failureSound from '../assets/sounds/failure.mp3';

const MultiProductOrder = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState({ value: 'הזמנה סופקה', label: 'הזמנה סופקה' });
  const [customers, setCustomers] = useState({});
  const [products, setProducts] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [errorMessages, setErrorMessages] = useState({});
  const [productFilter, setProductFilter] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderStatusOptions = [
    { value: 'הזמנה סופקה', label: 'הזמנה סופקה' },
    { value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' },
    { value: 'הזמנה בוטלה', label: 'הזמנה בוטלה' },
  ];

  const successAudio = new Audio(successSound);
  const failureAudio = new Audio(failureSound);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedCustomer = localStorage.getItem('selectedCustomer');
    const savedStatus = localStorage.getItem('selectedStatus');
    const savedQuantities = localStorage.getItem('orderQuantities');

    if (savedCustomer) setSelectedCustomer(JSON.parse(savedCustomer));
    if (savedStatus) setSelectedStatus(JSON.parse(savedStatus));
    if (savedQuantities) setOrderQuantities(JSON.parse(savedQuantities));

    setIsLoading(true);
    const unsubscribeCustomers = listenToCustomers(setCustomers);
    const unsubscribeProducts = listenToProducts((data) => {
      setProducts(data);
      setIsLoading(false);
    });
    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  // Save state to localStorage when these values change
  useEffect(() => {
    if (selectedCustomer) {
      localStorage.setItem('selectedCustomer', JSON.stringify(selectedCustomer));
    } else {
      localStorage.removeItem('selectedCustomer');
    }
  }, [selectedCustomer]);

  useEffect(() => {
    localStorage.setItem('selectedStatus', JSON.stringify(selectedStatus));
  }, [selectedStatus]);

  useEffect(() => {
    if (Object.keys(orderQuantities).length > 0) {
      localStorage.setItem('orderQuantities', JSON.stringify(orderQuantities));
    } else {
      localStorage.removeItem('orderQuantities');
    }
  }, [orderQuantities]);

  const customerOptions = Object.keys(customers).map((key) => ({
    value: key,
    label: customers[key].name,
  }));

  const handleIncrease = (productId) => {
    const currentQuantity = orderQuantities[productId] ? parseInt(orderQuantities[productId], 10) : 0;
    const productData = products[productId];
    if (currentQuantity < productData.stock) {
      setOrderQuantities((prev) => ({
        ...prev,
        [productId]: currentQuantity + 1,
      }));
      setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
    } else {
      setErrorMessages((prev) => ({ ...prev, [productId]: 'לא ניתן להזין כמות יותר מהמלאי הקיים!' }));
    }
  };

  const handleDecrease = (productId) => {
    setOrderQuantities((prev) => {
      const current = prev[productId] ? parseInt(prev[productId], 10) : 0;
      const newVal = current > 0 ? current - 1 : 0;
      return { ...prev, [productId]: newVal };
    });
    setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
  };

  const handleInputChange = (productId, value) => {
    const productData = products[productId];
    let newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 0) {
      newValue = 0;
    }
    if (newValue > productData.stock) {
      setErrorMessages((prev) => ({ ...prev, [productId]: 'לא ניתן להזין כמות יותר מהמלאי הקיים!' }));
      newValue = productData.stock;
    } else {
      setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
    }
    setOrderQuantities((prev) => ({
      ...prev,
      [productId]: newValue,
    }));
  };

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

  const calculateTotalQuantity = () => {
    let totalQuantity = 0;
    for (const productId in orderQuantities) {
      totalQuantity += parseInt(orderQuantities[productId], 10) || 0;
    }
    return totalQuantity;
  };

  const calculateTotalProductTypes = () => {
    return Object.values(orderQuantities).filter(qty => parseInt(qty, 10) > 0).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('יש לבחור לקוח');
      return;
    }

    const orderItems = {};
    Object.entries(orderQuantities).forEach(([productId, quantity]) => {
      const qty = parseInt(quantity, 10);
      if (qty > 0) {
        orderItems[productId] = {
          required: qty,
          picked: qty,
        };
      }
    });

    if (Object.keys(orderItems).length === 0) {
      alert('יש להזין כמות עבור לפחות מוצר אחד');
      return;
    }

    try {
      setIsSubmitting(true);

      for (const [productId, item] of Object.entries(orderItems)) {
        const productData = products[productId];
        if (!productData) {
          alert(`לא נמצא מוצר עם מזהה ${productId}`);
          setIsSubmitting(false);
          return;
        }
        if (productData.stock < item.picked) {
          alert(`המלאי של המוצר "${productData.name}" לא מספיק`);
          setIsSubmitting(false);
          return;
        }
        const newStock = productData.stock - item.picked;
        const newOrderedQuantity = (productData.orderedQuantity || 0) + item.picked;
        await updateStock(productId, newStock);
        await updateOrderedQuantity(productId, newOrderedQuantity);
      }

      const orderData = {
        customerId: selectedCustomer.value,
        date: new Date().toISOString(),
        items: orderItems,
        totalPrice: calculateTotalPrice(),
        status: selectedStatus.value,
      };
      await createOrder(orderData);

      const successMessage = document.getElementById('success-message');
      successMessage.style.display = 'block';
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 3000);

      // Clear form and localStorage after successful submission
      setSelectedCustomer(null);
      setOrderQuantities({});
      setProductFilter('');
      setErrorMessages({});
      setSelectedStatus({ value: 'הזמנה סופקה', label: 'הזמנה סופקה' });
      localStorage.removeItem('selectedCustomer');
      localStorage.removeItem('selectedStatus');
      localStorage.removeItem('orderQuantities');
    } catch (error) {
      console.error('Error processing order: ', error);
      alert('אירעה שגיאה בביצוע ההזמנה: ' + error.message);
      failureAudio.play();
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

  const handleBarcodePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    setBarcodeInput(pastedText);
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processBarcode(barcodeInput);
      setBarcodeInput('');
    }
  };

  const processBarcode = (code) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const foundProductId = Object.keys(products).find(
      (id) => products[id].code === trimmed
    );
    if (foundProductId) {
      setOrderQuantities((prev) => {
        const current = prev[foundProductId] ? parseInt(prev[foundProductId], 10) : 0;
        const newQty = current + 1 > products[foundProductId].stock
          ? products[foundProductId].stock
          : current + 1;
        return { ...prev, [foundProductId]: newQty };
      });
      setErrorMessages((prev) => ({ ...prev, [foundProductId]: '' }));
      successAudio.play();
    } else {
      failureAudio.play();
    }
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      fontFamily: 'Arial, sans-serif',
    }),
    menu: (base) => ({
      ...base,
      fontFamily: 'Arial, sans-serif',
    }),
    option: (base, state) => ({
      ...base,
      fontFamily: 'Arial, sans-serif',
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : '#fff',
      color: state.isSelected ? '#fff' : '#1f2937',
      padding: '10px',
      cursor: 'pointer',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
      fontFamily: 'Arial, sans-serif',
    }),
  };

  const styles = {
    container: {
      padding: '30px',
      direction: 'rtl',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    header: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e40af',
      marginBottom: '20px',
      textAlign: 'right',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '8px',
      display: 'block',
      fontSize: '16px',
    },
    selectContainer: {
      width: '100%',
      maxWidth: '350px',
    },
    subHeader: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1e40af',
      margin: '25px 0 15px 0',
      textAlign: 'right',
    },
    filterInput: {
      width: '100%',
      maxWidth: '350px',
      padding: '12px',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      fontSize: '14px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      transition: 'border-color 0.2s',
      outline: 'none',
    },
    noData: {
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#f1f5f9',
      borderRadius: '10px',
      color: '#6b7280',
      fontSize: '16px',
      fontWeight: '500',
    },
    tableContainer: {
      overflowX: 'auto',
      borderRadius: '12px',
      backgroundColor: '#fff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      marginBottom: '20px',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
      overflow: 'hidden',
      display: 'block',
      whiteSpace: 'nowrap',
    },
    tableHeader: {
      backgroundColor: '#eef2ff',
      borderBottom: '2px solid #e2e8f0',
    },
    tableHeaderCell: {
      padding: '14px 20px',
      textAlign: 'center',
      fontWeight: '600',
      color: '#1e40af',
      fontSize: '14px',
      borderBottom: '2px solid #e2e8f0',
      minWidth: '100px',
    },
    tableRow: {
      transition: 'background-color 0.2s',
    },
    tableCell: {
      padding: '14px 20px',
      textAlign: 'center',
      borderBottom: '1px solid #e2e8f0',
      color: '#374151',
      fontSize: '14px',
    },
    quantityCell: {
      padding: '14px 20px',
      borderBottom: '1px solid #e2e8f0',
      color: '#374151',
      verticalAlign: 'middle',
    },
    quantityControl: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      justifyContent: 'center',
    },
    quantityButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      width: '32px',
      height: '32px',
      fontSize: '18px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityInput: {
      width: '50px',
      textAlign: 'center',
      padding: '6px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      outline: 'none',
    },
    submitButton: {
      backgroundColor: '#1e40af',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 30px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.3s, transform 0.2s',
      boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)',
    },
    submitButtonDisabled: {
      backgroundColor: '#9ca3af',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 30px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    successMessage: {
      backgroundColor: '#10b981',
      color: 'white',
      padding: '12px',
      borderRadius: '10px',
      textAlign: 'center',
      display: 'none',
      marginTop: '20px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280',
      fontSize: '16px',
      fontWeight: '500',
    },
    summaryContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 20px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      marginTop: '20px',
      flexWrap: 'wrap',
      gap: '15px',
    },
    summaryText: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e40af',
    },
    paginationContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '20px',
    },
    paginationButton: {
      padding: '8px 12px',
      border: '1px solid #D1D5DB',
      borderRadius: '4px',
      background: 'white',
      cursor: 'pointer',
    },
    activePage: {
      background: '#3B82F6',
      color: 'white',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>הזמנה ללקוח</h2>
      {isLoading ? (
        <div style={styles.loadingContainer}>טוען מוצרים...</div>
      ) : (
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
              <div style={styles.formGroup}>
                <label style={styles.label}>קוד מוצר (הדבקה/סריקה):</label>
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  onPaste={handleBarcodePaste}
                  placeholder="הדבק או סרוק קוד מוצר..."
                  style={styles.filterInput}
                  disabled={isSubmitting}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>חיפוש מוצרים:</label>
                <input
                  type="text"
                  placeholder="הקלד שם מוצר או קוד..."
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
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
                        <th style={styles.tableHeaderCell}>תמונה</th>
                        <th style={styles.tableHeaderCell}>מק"ט</th>
                        <th style={styles.tableHeaderCell}>שם מוצר</th>
                        <th style={styles.tableHeaderCell}>מלאי</th>
                        <th style={styles.tableHeaderCell}>מחיר</th>
                        <th style={styles.tableHeaderCell}>כמות להזמנה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(filteredProducts).map((key) => {
                        const product = filteredProducts[key];
                        const quantity = orderQuantities[key] ? parseInt(orderQuantities[key], 10) : 0;
                        const highlightStyle = quantity > 0 ? { backgroundColor: '#D2FFCC' } : {};
                        return (
                          <tr
                            key={key}
                            style={{ ...styles.tableRow, ...highlightStyle }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = quantity > 0 ? '#D2FFCC' : '#f1f5f9')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = quantity > 0 ? '#D2FFCC' : '#fff')}
                          >
                            <td style={styles.tableCell}>
                              <ProductImage imageUrl={product.imageUrl} productName={product.name} />
                            </td>
                            <td style={styles.tableCell}>{product.code}</td>
                            <td style={styles.tableCell}>{product.name}</td>
                            <td style={styles.tableCell}>
                              {product.stock === 0 ? (
                                <span
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: '#fee2e2',
                                    color: '#ef4444',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    animation: 'pulse 1.5s infinite',
                                  }}
                                >
                                  אזל מהמלאי
                                </span>
                              ) : (
                                <span
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: product.stock <= 5 ? '#fef3c7' : '#d1fae5',
                                    color: product.stock <= 5 ? '#d97706' : '#10b981',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                  }}
                                >
                                  {product.stock}
                                </span>
                              )}
                            </td>
                            <td style={styles.tableCell}>₪{Number(product.price).toLocaleString()}</td>
                            <td style={styles.quantityCell}>
                              <div style={styles.quantityControl}>
                                <button
                                  type="button"
                                  style={{
                                    ...styles.quantityButton,
                                    opacity: quantity <= 0 ? 0.5 : 1,
                                    cursor: quantity <= 0 ? 'not-allowed' : 'pointer',
                                  }}
                                  onClick={() => handleDecrease(key)}
                                  onMouseDown={(e) => quantity > 0 && (e.currentTarget.style.transform = 'scale(0.95)')}
                                  onMouseUp={(e) => quantity > 0 && (e.currentTarget.style.transform = 'scale(1)')}
                                  disabled={quantity <= 0}
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
                                    ...styles.quantityInput,
                                    opacity: product.stock <= 0 ? 0.5 : 1,
                                    cursor: product.stock <= 0 ? 'not-allowed' : 'text',
                                    borderColor: quantity > product.stock ? '#ef4444' : '#e2e8f0',
                                    backgroundColor: quantity > product.stock ? '#fee2e2' : '#fff',
                                  }}
                                  disabled={product.stock <= 0}
                                />
                                <button
                                  type="button"
                                  style={{
                                    ...styles.quantityButton,
                                    opacity: product.stock <= 0 || quantity >= product.stock ? 0.5 : 1,
                                    cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
                                  }}
                                  onClick={() => handleIncrease(key)}
                                  onMouseDown={(e) => product.stock > 0 && quantity < product.stock && (e.currentTarget.style.transform = 'scale(0.95)')}
                                  onMouseUp={(e) => product.stock > 0 && quantity < product.stock && (e.currentTarget.style.transform = 'scale(1)')}
                                  disabled={product.stock <= 0 || quantity >= product.stock}
                                >
                                  +
                                </button>
                              </div>
                              {quantity > product.stock ? (
                                <div
                                  style={{
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    marginTop: '6px',
                                    fontWeight: '600',
                                    backgroundColor: '#fee2e2',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  נבחרה כמות מעל המלאי הזמין ({product.stock})
                                </div>
                              ) : (
                                errorMessages[key] && (
                                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
                                    {errorMessages[key]}
                                  </div>
                                )
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={styles.summaryContainer}>
                <div style={styles.summaryText}>סה"כ מוצרים: {calculateTotalQuantity()}</div>
                <div style={styles.summaryText}>סה"כ פריטים: {calculateTotalProductTypes()}</div>
                <div style={styles.summaryText}>סה"כ מחיר: ₪{Number(calculateTotalPrice()).toLocaleString()}</div>
              </div>
              <div
                style={{
                  position: 'fixed',
                  left: '20px',
                  top: '94%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: '1', maxWidth: '300px' }}>
                  <Select
                    options={orderStatusOptions}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    placeholder="בחר סטטוס הזמנה"
                    onMenuOpen={() => {
                      window.scrollTo({
                        top: document.documentElement.scrollHeight,
                        behavior: 'smooth'
                      });
                    }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={selectStyles}
                  />
                </div>
                <button
                  type="submit"
                  style={isSubmitting ? styles.submitButtonDisabled : styles.submitButton}
                  disabled={isSubmitting}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {isSubmitting ? 'מבצע הזמנה...' : 'שלח הזמנה'}
                </button>
              </div>

            </>
          )}
          <div id="success-message" style={styles.successMessage}>
            ההזמנה בוצעה בהצלחה!
          </div>
        </form>
      )}
    </div>
  );
};

export default MultiProductOrder;