// src/components/OnlineOrder.js
import React, { useState, useEffect } from 'react';
import { getCustomerByPhone, addCustomer } from '../models/customerModel';
import { createOnlineOrder, updateOnlineOrder } from '../models/onlineOrderModel';
import { listenToProducts } from '../models/productModel';
import ProductImageOnline from './ProductImageOnline';
import ExportToPdfButton from './ExportToPdfButton';
import OrderHistory from './OrderHistory';

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
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const styles = {
    container: {
      fontFamily: "'Assistant', sans-serif",
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f7fa',
      minHeight: '100vh',
      direction: 'rtl',
      position: 'relative',
      color: '#1e293b',
    },
    header: {
      textAlign: 'center',
      color: '#1e293b',
      fontSize: '2.5rem',
      marginBottom: '30px',
      fontWeight: '600',
      borderBottom: '3px solid #e2e8f0',
      paddingBottom: '15px',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      padding: '25px',
      marginBottom: '25px',
      transition: 'all 0.3s ease',
      color: '#1e293b',
    },
    input: {
      width: '100%',
      padding: '12px 15px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      fontSize: '16px',
      marginBottom: '15px',
      backgroundColor: '#ffffff',
      color: '#1e293b',
      transition: 'all 0.3s ease',
    },
    button: {
      padding: '12px 25px',
      backgroundColor: '#3b82f6',
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
      border: '1px solid #3b82f6',
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
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      fontWeight: '600',
    },
    errorMessage: {
      color: '#ef4444',
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
      backgroundColor: '#f8fafc',
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
      color: '#3b82f6',
      textAlign: 'right',
    },
    orderSummaryButtonContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '25px',
    },
    orderSummaryEditButton: {
      backgroundColor: '#6b7280',
      color: '#ffffff',
      padding: '12px 25px',
      borderRadius: '10px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    confirmationContainer: {
      padding: '20px',
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '60vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmationCard: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      padding: '40px',
      width: '100%',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    successIconContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '20px',
    },
    successIcon: {
      width: '80px',
      height: '80px',
      backgroundColor: '#10b981',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
    },
    confirmationHeader: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '30px',
      position: 'relative',
      paddingBottom: '15px',
    },
    confirmationDetails: {
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '25px',
      textAlign: 'right',
    },
    detailItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid #e2e8f0',
    },
    detailLabel: {
      fontWeight: '600',
      color: '#64748b',
    },
    detailValue: {
      fontWeight: '500',
      color: '#1e293b',
    },
    highlightedValue: {
      color: '#3b82f6',
      fontWeight: '700',
    },
    confirmationMessage: {
      marginBottom: '30px',
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#64748b',
    },
    confirmationActions: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '20px',
      flexWrap: 'wrap',
    },
    downloadButton: {
      backgroundColor: '#fff',
      color: '#3b82f6',
      border: '2px solid #3b82f6',
      padding: '12px 24px',
      borderRadius: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    newOrderButton: {
      backgroundColor: '#3b82f6',
      color: '#fff',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '10px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
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
        alert('לא הצלחנו למצוא אותך, מייד תועבר לרישום');
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

  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 1000000;
  };

  const handleIncrease = (productId) => {
    const currentQuantity = parseInt(orderQuantities[productId] || 0, 10);
    setOrderQuantities((prev) => ({ ...prev, [productId]: currentQuantity + 1 }));
    setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
  };

  const handleDecrease = (productId) => {
    setOrderQuantities((prev) => {
      const current = parseInt(prev[productId] || 0, 10);
      return { ...prev, [productId]: current > 0 ? current - 1 : 0 };
    });
    setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
  };

  const handleInputChange = (productId, value) => {
    let newValue = parseInt(value, 10);
    if (isNaN(newValue) || newValue < 0) newValue = 0;
    setOrderQuantities((prev) => ({ ...prev, [productId]: newValue }));
    setErrorMessages((prev) => ({ ...prev, [productId]: '' }));
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
      if (qty > 0) orderItemsData[productId] = { required: qty, picked: 0 };
    });
    if (!Object.keys(orderItemsData).length) return alert('יש לבחור לפחות מוצר אחד.');
    setOrderItems(orderItemsData);
    setShowOrderSummary(true);
  };

  const handleConfirmOrder = async () => {
    if (editingOrder) {
      await handleUpdateOrder();
      return;
    }
    try {
      setIsSubmitting(true);
      const orderData = {
        customerId: foundCustomer.value,
        date: new Date().toISOString(),
        items: orderItems,
        totalPrice: calculateTotalPrice(),
        status: 'הזמנה חדשה',
      };
      const orderRef = await createOnlineOrder(orderData);
      setOrderId(orderRef.key);
      setOrderConfirmed(true);
      setShowOrderSummary(false);
    } catch (error) {
      console.error('Error processing order: ', error);
      alert('שגיאה בהזמנה: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewOrder = () => {
    // Preserve foundCustomer, reset everything else
    setOrderQuantities({});
    setProductFilter('');
    setErrorMessages({});
    setOrderConfirmed(false);
    setOrderId(null);
    setOrderItems({});
    setShowOrderHistory(false);
    setEditingOrder(null);
    setShowOrderSummary(false);
    setShowCreateCustomer(false);
    // Do NOT reset phoneInput or foundCustomer
  };

  const exportOrderData = () => {
    if (!orderItems || !foundCustomer) return [];
    const customerName = foundCustomer.label;
    return Object.entries(orderItems).map(([productId, item]) => {
      const product = products[productId];
      return {
        "מזהה הזמנה": hashCode(orderId),
        "שם לקוח": customerName,
        "שם מוצר": product ? product.name : productId,
        "כמות": item.required,
        "מחיר ליחידה": product ? product.price : '-',
        "סה\"כ": product ? (product.price * item.required) : '-',
      };
    });
  };

  const filteredProducts = Object.keys(products).reduce((acc, key) => {
    const product = products[key];
    const searchText = productFilter.toLowerCase();
    if (product.name.toLowerCase().includes('אבותינו')) {
      return acc;
    }
    if (
      product.name.toLowerCase().includes(searchText) ||
      product.code.toLowerCase().includes(searchText)
    ) {
      acc[key] = product;
    }
    return acc;
  }, {});

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowOrderHistory(false);
    const newQuantities = {};
    const newOrderItems = {};
    Object.entries(order.items).forEach(([productId, item]) => {
      newQuantities[productId] = item.required;
      newOrderItems[productId] = { required: item.required, picked: item.picked || 0 };
    });
    setOrderQuantities(newQuantities);
    setOrderItems(newOrderItems);
    setOrderId(order.id);
  };

  const handleUpdateOrder = async () => {
    if (!foundCustomer) return alert('יש לבחור לקוח תחילה.');
    if (!Object.keys(orderItems).length) return alert('יש לבחור לפחות מוצר אחד.');
    try {
      setIsSubmitting(true);
      const updatedOrderData = {
        customerId: foundCustomer.value,
        date: new Date().toISOString(),
        items: orderItems,
        totalPrice: calculateTotalPrice(),
        status: editingOrder.status || 'הזמנה מעודכנת',
      };
      await updateOnlineOrder(editingOrder.id, updatedOrderData);
      alert('הזמנה עודכנה בהצלחה!');
      setOrderConfirmed(true);
      setEditingOrder(null);
      setShowOrderSummary(false);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('שגיאה בעדכון ההזמנה: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>מצות אבהתנא</h1>

      {orderConfirmed ? (
        <div style={styles.confirmationContainer}>
          <div style={styles.confirmationCard}>
            <div style={styles.successIconContainer}>
              <div style={styles.successIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
            <h2 style={styles.confirmationHeader}>
              {editingOrder ? 'הזמנה עודכנה בהצלחה!' : 'ההזמנה בוצעה בהצלחה!'}
            </h2>
            <div style={styles.confirmationDetails}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>שם לקוח:</span>
                <span style={styles.detailValue}>{foundCustomer.label}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>מספר הזמנה:</span>
                <span style={styles.highlightedValue}>{hashCode(orderId)}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>תאריך:</span>
                <span style={styles.detailValue}>{new Date().toLocaleDateString('he-IL')}</span>
              </div>
            </div>
            <div style={styles.confirmationMessage}>
              <p>תודה על הזמנתך ממצות אבהתנא!</p>
              <p>נציג שלנו יצור איתך קשר בהקדם לתיאום מועד איסוף/משלוח.</p>
            </div>
            <div style={styles.confirmationActions}>
              <ExportToPdfButton
                data={exportOrderData()}
                fileName={`order_${hashCode(orderId)}_export`}
                title="online order"
                label="הורד פרטי הזמנה"
                buttonStyle={styles.downloadButton}
              />
              <button onClick={handleNewOrder} style={styles.newOrderButton}>
                הזמנה חדשה
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {foundCustomer && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  if (showOrderHistory) {
                    handleNewOrder(); // Reset for new order, keeping customer
                  } else {
                    setShowOrderHistory(true); // Show history
                  }
                }}
                style={styles.button}
              >
                {showOrderHistory ? 'חזרה להזמנה חדשה' : 'הצג היסטוריית הזמנות'}
              </button>
            </div>
          )}

          {showOrderHistory && foundCustomer ? (
            <OrderHistory customerId={foundCustomer.value} onEditOrder={handleEditOrder} products={products}/>
          ) : (
            <>
              {!showOrderSummary && (
                <>
                  <div style={styles.card}>
                    <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                      {editingOrder ? `עריכת הזמנה ${hashCode(editingOrder.id)}` : 'הזמנה חדשה'}
                    </h3>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="הזן מספר טלפון..."
                      style={styles.input}
                      disabled={!!foundCustomer} // Disable input if customer is selected
                    />
                    <button
                      onClick={handleSearchCustomer}
                      style={styles.button}
                      disabled={!!foundCustomer} // Disable button if customer is selected
                    >
                      מצא אותי
                    </button>
                    {foundCustomer && (
                      <div style={{ marginTop: '10px' }}>
                        לקוח נבחר: <strong>{foundCustomer.label}</strong>
                      </div>
                    )}
                  </div>

                  {!foundCustomer && showCreateCustomer && (
                    <div style={styles.card}>
                      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
                        יצירת לקוח חדש
                      </h3>
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

              {showOrderSummary && (
                <div style={styles.orderSummary}>
                  <h3 style={styles.orderSummaryHeader}>
                    {editingOrder ? 'עריכת הזמנה' : 'סיכום הזמנה'}
                  </h3>
                  <div>
                    {Object.keys(orderItems).map((productId) => {
                      const product = products[productId];
                      const qty = orderItems[productId].required;
                      return (
                        <div key={productId} style={styles.orderSummaryItemRow}>
                          <div>
                            <span>
                              {product.name} (x{qty})
                            </span>
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
                      {isSubmitting
                        ? 'מעבד...'
                        : editingOrder
                        ? 'עדכן הזמנה'
                        : 'שלח הזמנה'}
                    </button>
                  </div>
                </div>
              )}

              {foundCustomer && !showOrderSummary && !showOrderHistory && (
                <div style={{ marginBottom: '150px' }}>
                  {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>טוען מוצרים...</div>
                  ) : (
                    <div style={styles.productGrid}>
                      {Object.keys(filteredProducts).map((key) => {
                        const product = filteredProducts[key];
                        const quantity = orderQuantities[key] || 0;
                        return (
                          <div key={key} style={styles.productCard}>
                            <ProductImageOnline
                              imageUrl={product.imageUrl}
                              productName={product.name}
                            />
                            <div style={{ marginTop: '15px' }}>
                              <div>{product.name}</div>
                              <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                                ₪{Number(product.price).toLocaleString()}
                              </div>
                            </div>
                            <div style={styles.quantityControl}>
                              <button
                                onClick={() => handleDecrease(key)}
                                style={styles.quantityButton}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={quantity}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                style={{ width: '60px', textAlign: 'center', padding: '5px' }}
                              />
                              <button
                                onClick={() => handleIncrease(key)}
                                style={styles.quantityButton}
                              >
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

              {foundCustomer && !showOrderSummary && !showOrderHistory && (
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
                    {isSubmitting ? 'מבצע...' : 'סיכום הזמנה'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default OnlineOrder;