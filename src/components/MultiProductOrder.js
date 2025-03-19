import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToProducts, updateStock, updateOrderedQuantity } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import { createOrder } from '../models/orderModel';
import ProductImage from './ProductImage';
import successSound from '../assets/sounds/success.mp3';
import failureSound from '../assets/sounds/failure.mp3';

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { textAlign: 'center', color: '#2c3e50', marginBottom: '20px' },
  card: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' },
  selectContainer: { maxWidth: '400px' },
  filterInput: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' },
  subHeader: { color: '#2c3e50', margin: '20px 0' },
  noData: { textAlign: 'center', color: '#64748b', padding: '20px' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8fafc' },
  tableHeaderCell: { padding: '12px', textAlign: 'right', color: '#475569', fontWeight: '600' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  tableCell: { padding: '12px', textAlign: 'right' },
  quantityCell: { padding: '12px', textAlign: 'center' },
  quantityControl: { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' },
  quantityButton: { 
    width: '32px', 
    height: '32px', 
    border: '1px solid #e2e8f0', 
    background: '#fff', 
    borderRadius: '4px',
    fontSize: '18px',
    transition: 'all 0.2s'
  },
  quantityInput: { 
    width: '60px', 
    textAlign: 'center', 
    padding: '6px', 
    border: '1px solid #e2e8f0', 
    borderRadius: '4px' 
  },
  summaryContainer: { 
    marginTop: '20px', 
    padding: '15px', 
    background: '#f8fafc', 
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  summaryText: { color: '#2c3e50', fontWeight: '600' },
  button: { 
    padding: '12px 24px', 
    background: '#3498db', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  disabledButton: { 
    padding: '12px 24px', 
    background: '#94a3b8', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'not-allowed'
  },
  successMessage: { 
    display: 'none', 
    marginTop: '20px', 
    padding: '10px', 
    background: '#d1fae5', 
    color: '#10b981', 
    borderRadius: '4px',
    textAlign: 'center'
  }
};

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

  useEffect(() => {
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

  useEffect(() => {
    const savedState = localStorage.getItem("multiProductOrderState");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.selectedCustomer) setSelectedCustomer(state.selectedCustomer);
        if (state.orderQuantities) setOrderQuantities(state.orderQuantities);
        if (state.productFilter) setProductFilter(state.productFilter);
        if (state.selectedStatus) setSelectedStatus(state.selectedStatus);
      } catch (e) {
        console.error("Error parsing saved state", e);
      }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
      selectedCustomer,
      orderQuantities,
      productFilter,
      selectedStatus,
    };
    localStorage.setItem("multiProductOrderState", JSON.stringify(stateToSave));
  }, [selectedCustomer, orderQuantities, productFilter, selectedStatus]);

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
      alert('נא לבחור לקוח');
      return;
    }

    const orderItems = {};
    Object.entries(orderQuantities).forEach(([productId, quantity]) => {
      const qty = parseInt(quantity, 10);
      if (qty > 0) {
        orderItems[productId] = {
          required: qty,
          picked: qty
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

      successAudio.play();

      const successMessage = document.getElementById('success-message');
      successMessage.style.display = 'block';
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 3000);

      setSelectedCustomer(null);
      setOrderQuantities({});
      setProductFilter('');
      setErrorMessages({});
      setSelectedStatus({ value: 'הזמנה סופקה', label: 'הזמנה סופקה' });
      localStorage.removeItem("multiProductOrderState");
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

  useEffect(() => {
    const trimmed = barcodeInput.trim();
    if (trimmed) {
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
      setBarcodeInput('');
    }
  }, [barcodeInput, products]);

  const handleBarcodePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    setBarcodeInput(pastedText);
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      borderColor: '#dcdfe6',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3498db' },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3498db'
        : state.isFocused
        ? '#ebf5fb'
        : null,
      color: state.isSelected ? 'white' : '#2c3e50',
      textAlign: 'right',
      direction: 'rtl',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  if (isLoading) {
    return <div style={styles.container}>טוען...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>הזמנה ללקוח</h2>
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
                onPaste={handleBarcodePaste}
                readOnly
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
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
                style={isSubmitting ? styles.disabledButton : styles.button}
                disabled={isSubmitting}
                onMouseEnter={(e) =>
                  !isSubmitting && (e.currentTarget.style.transform = 'scale(1.02)')
                }
                onMouseLeave={(e) =>
                  !isSubmitting && (e.currentTarget.style.transform = 'scale(1)')
                }
              >
                {isSubmitting ? 'מבצע הזמנה...' : 'שלח הזמנה'}
              </button>
            </div>
            <div id="success-message" style={styles.successMessage}>
              ההזמנה בוצעה בהצלחה!
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default MultiProductOrder;