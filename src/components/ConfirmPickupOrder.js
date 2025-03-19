import React, { useEffect, useRef, useState } from 'react';
import { listenToPickupOrders, removePickupOrder } from '../models/pickupOrderModel';
import { createOrder } from '../models/orderModel';
import { listenToProducts, updateStock, updateOrderedQuantity } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import { useNavigate } from 'react-router-dom';
import { ref, update } from 'firebase/database';
import { db } from '../models/firebase';
import ExportToExcelButton from './ExportToExcelButton';
import ExportToPdfButton from './ExportToPdfButton';
import ExportOrdersToPdfButton from './ExportOrdersToPdfButton';
import Select from 'react-select';
import ProductImage from './ProductImage';
import successSound from '../assets/sounds/success.mp3';
import failureSound from '../assets/sounds/failure.mp3';

const ConfirmPickupOrder = () => {
  const [pickupOrders, setPickupOrders] = useState({});
  const [products, setProducts] = useState({});
  const [customers, setCustomers] = useState({});
  const [selectedPickupId, setSelectedPickupId] = useState(null);
  const [editedItems, setEditedItems] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterCustomerSelect, setFilterCustomerSelect] = useState(null);
  const [searchPickupId, setSearchPickupId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState({ value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' });
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const successAudio = new Audio(successSound);
  const failureAudio = new Audio(failureSound);
  const navigate = useNavigate();

  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 1000000;
  };

  // Load data and restore state from localStorage
  useEffect(() => {
    const unsubOrders = listenToPickupOrders((data) => {
      setPickupOrders(data);
      setIsDataLoaded(true); // Mark data as loaded once pickupOrders is set
    });
    const unsubProducts = listenToProducts(setProducts);
    const unsubCustomers = listenToCustomers(setCustomers);

    return () => {
      unsubOrders();
      unsubProducts();
      unsubCustomers();
    };
  }, []);

  // Restore state once data is loaded
  useEffect(() => {
    if (isDataLoaded) {
      const savedPickupId = localStorage.getItem('pickup_selectedPickupId');
      const savedEditedItems = localStorage.getItem('pickup_editedItems');
      const savedStatus = localStorage.getItem('pickup_selectedStatus');

      console.log('Restoring state from localStorage:', { savedPickupId, savedEditedItems, savedStatus });

      if (savedPickupId && pickupOrders[savedPickupId]) {
        setSelectedPickupId(savedPickupId);
        const pickup = pickupOrders[savedPickupId];
        if (savedEditedItems) {
          const parsedItems = JSON.parse(savedEditedItems);
          // Validate restored items against current pickup data
          const validItems = {};
          Object.entries(parsedItems).forEach(([pid, item]) => {
            if (pickup.items[pid]) {
              validItems[pid] = {
                required: pickup.items[pid].required || pickup.items[pid].quantity,
                picked: item.picked || 0,
              };
            }
          });
          setEditedItems(validItems);
        }
      } else if (savedPickupId) {
        console.log('Saved pickupId not found in pickupOrders, clearing state');
        localStorage.removeItem('pickup_selectedPickupId');
        localStorage.removeItem('pickup_editedItems');
      }

      if (savedStatus) {
        setSelectedStatus(JSON.parse(savedStatus));
      }
    }
  }, [isDataLoaded, pickupOrders]);

  // Save state to localStorage for selectedPickupId
  useEffect(() => {
    if (selectedPickupId) {
      localStorage.setItem('pickup_selectedPickupId', selectedPickupId);
      console.log('Saved selectedPickupId:', selectedPickupId);
    } else {
      localStorage.removeItem('pickup_selectedPickupId');
      console.log('Cleared selectedPickupId');
    }
  }, [selectedPickupId]);

  // Save state to localStorage for editedItems
  useEffect(() => {
    if (Object.keys(editedItems).length > 0) {
      localStorage.setItem('pickup_editedItems', JSON.stringify(editedItems));
      console.log('Saved editedItems:', editedItems);
    } else {
      localStorage.removeItem('pickup_editedItems');
      console.log('Cleared editedItems');
    }
  }, [editedItems]);

  // Save state to localStorage for selectedStatus
  useEffect(() => {
    localStorage.setItem('pickup_selectedStatus', JSON.stringify(selectedStatus));
    console.log('Saved selectedStatus:', selectedStatus);
  }, [selectedStatus]);

  // Use useRef to skip resetting on initial mount
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Reset selection only if one of the filters changes (and they are not default)
    if (filterDate !== "" || filterCustomerSelect !== null || searchPickupId !== "") {
      setSelectedPickupId(null);
      setEditedItems({});
    }
  }, [filterDate, filterCustomerSelect, searchPickupId]);

  const customerFilterOptions = Object.keys(customers).map(key => ({
    value: key,
    label: customers[key].name,
  }));

  const orderStatusOptions = [
    { value: 'סופקה במלואה', label:  'סופקה במלואה' },
    { value: 'סופקה חלקית', label:  'סופקה חלקית' },
    { value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' },
    { value: 'ממתינה למשלוח לוקטה חלקית', label: 'ממתינה למשלוח לוקטה חלקית' },
    { value: 'ממתינה לאישור הלקוח', label: 'ממתינה לאישור הלקוח' },
  ];

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
  if (searchPickupId !== "") {
    filteredPickupOrders = Object.fromEntries(
      Object.entries(filteredPickupOrders).filter(([pickupId]) => {
        const shortId = hashCode(pickupId).toString();
        return shortId.includes(searchPickupId);
      })
    );
  }

  const handleSelectPickup = (pickupId) => {
    if (selectedPickupId === pickupId) {
      setSelectedPickupId(null);
      setEditedItems({});
      return;
    }
    setSelectedPickupId(pickupId);
    const pickup = pickupOrders[pickupId];
    if (pickup && pickup.items) {
      const initItems = {};
      Object.entries(pickup.items).forEach(([pid, item]) => {
        initItems[pid] = {
          required: item.required !== undefined ? item.required : item.quantity,
          picked: item.picked !== undefined ? item.picked : 0,
        };
      });
      setEditedItems(initItems);
    } else {
      setEditedItems({});
    }
  };

  const handleQuantityChange = (productId, newValue) => {
    const product = products[productId];
    const required = editedItems[productId]?.required || 0;
    let value = parseInt(newValue, 10) || 0;

    if (product && value > product.stock) {
      alert("לא ניתן לבחור כמות יותר מהמלאי הקיים");
      value = product.stock;
    }
    if (value > required) {
      alert(`לא ניתן לבחור יותר מהנדרש (${required})`);
      value = required;
    }

    setEditedItems(prev => ({
      ...prev,
      [productId]: { ...prev[productId], picked: value }
    }));
  };

  const handleIncrease = (productId) => {
    const product = products[productId];
    const currentPicked = editedItems[productId]?.picked || 0;
    const required = editedItems[productId]?.required || 0;

    if (product && currentPicked >= product.stock) {
      alert("לא ניתן לבחור כמות יותר מהמלאי הקיים");
      return;
    }
    if (currentPicked >= required) {
      alert(`לא ניתן לבחור יותר מהנדרש (${required})`);
      return;
    }

    setEditedItems(prev => ({
      ...prev,
      [productId]: { ...prev[productId], picked: currentPicked + 1 }
    }));
  };

  const handleDecrease = (productId) => {
    setEditedItems(prev => {
      const current = editedItems[productId]?.picked || 0;
      const newVal = current > 0 ? current - 1 : 0;
      return { ...prev, [productId]: { ...prev[productId], picked: newVal } };
    });
  };

  const calculateTotalPickedItems = () => {
    return Object.keys(editedItems).reduce((sum, pid) => sum + (editedItems[pid].picked || 0), 0);
  };

  const calculateTotalPickedProducts = () => {
    return Object.keys(editedItems).filter(pid => (editedItems[pid].picked || 0) > 0).length;
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processBarcode(barcodeInput);
      setBarcodeInput('');
    }
  };

  const handleBarcodePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    setBarcodeInput(pastedText);
  };

  const processBarcode = (code) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    if (!selectedPickupId) {
      alert("יש לבחור הזמנת ליקוט לפני הסריקה");
      failureAudio.play();
      return;
    }
    const foundProductId = Object.keys(products).find(pid => products[pid].code === trimmed);
    if (!foundProductId) {
      failureAudio.play();
      return;
    }
    if (!editedItems[foundProductId]) {
      alert("המוצר לא קיים בהזמנה הנוכחית");
      failureAudio.play();
      return;
    }
    const product = products[foundProductId];
    const currentPicked = editedItems[foundProductId]?.picked || 0;
    const required = editedItems[foundProductId]?.required || 0;
    if (currentPicked >= product.stock) {
      alert("לא ניתן לבחור כמות יותר מהמלאי הקיים");
      failureAudio.play();
      return;
    }
    if (currentPicked >= required) {
      alert(`לא ניתן לבחור יותר מהנדרש (${required})`);
      failureAudio.play();
      return;
    }
    setEditedItems(prev => ({
      ...prev,
      [foundProductId]: { ...prev[foundProductId], picked: currentPicked + 1 }
    }));
    successAudio.play();
  };

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

  const handleClosePickup = async () => {
    if (!selectedPickupId) {
      alert("יש לבחור הזמנה ללקיטה");
      return;
    }
    if (!selectedStatus || !selectedStatus.value) {
      alert("יש לבחור סטטוס להזמנה לפני הסגירה");
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
      for (const pid of Object.keys(editedItems)) {
        const pickedQty = editedItems[pid].picked;
        const product = products[pid];
        if (product) {
          const newStock = product.stock - pickedQty;
          const newOrderedQuantity = (product.orderedQuantity || 0) + pickedQty;
          await updateStock(pid, newStock);
          await updateOrderedQuantity(pid, newOrderedQuantity);
        }
      }
      const finalItems = {};
      for (const pid of Object.keys(editedItems)) {
        finalItems[pid] = {
          required: editedItems[pid].required,
          picked: editedItems[pid].picked
        };
      }
      let totalPrice = 0; // Calculate if needed
      const finalOrderData = {
        customerId: pickup.customerId,
        date: new Date().toISOString(),
        items: finalItems,
        totalPrice,
        status: selectedStatus.value,
      };
      await createOrder(finalOrderData);
      await removePickupOrder(selectedPickupId);
      alert("ההזמנה נסגרה בהצלחה והועברה להזמנות הסופיות");

      // Clear state and localStorage
      setSelectedPickupId(null);
      setEditedItems({});
      setSelectedStatus({ value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' });
      localStorage.removeItem('pickup_selectedPickupId');
      localStorage.removeItem('pickup_editedItems');
      localStorage.removeItem('pickup_selectedStatus');
      navigate('/view-orders');
    } catch (err) {
      console.error("Error closing pickup order:", err);
      alert("שגיאה בסגירת הזמנת הלקיטה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportData = () => {
    if (!selectedPickupId || !pickupOrders[selectedPickupId] || !pickupOrders[selectedPickupId].items) {
      return [];
    }
    const pickup = pickupOrders[selectedPickupId];
    const customer = customers[pickup.customerId];
    const customerName = customer ? customer.name : pickup.customerId;

    return Object.entries(pickup.items).map(([pid, item]) => {
      const product = products[pid];
      return {
        "מזהה לקיטה": hashCode(selectedPickupId),
        "שם לקוח": customerName,
        "שם מוצר": product ? product.name : pid,
        "כמות נדרשת": item.required !== undefined ? item.required : item.quantity,
        "נלקט": editedItems[pid] ? editedItems[pid].picked : 0,
        "מלאי": product ? product.stock : '-',
        "מחיר": product ? product.price : '-'
      };
    });
  };
  const excelData = exportData();

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
      marginBottom: '25px',
      textAlign: 'right',
    },
    filterContainer: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      marginBottom: '30px',
      flexWrap: 'wrap',
    },
    filterInput: {
      padding: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    selectContainer: {
      width: '300px',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
      backgroundColor: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    th: {
      padding: '12px',
      backgroundColor: '#eef2ff',
      color: '#1e40af',
      fontWeight: '600',
      textAlign: 'center',
      borderBottom: '2px solid #d1d5db',
    },
    td: {
      padding: '12px',
      textAlign: 'center',
      borderBottom: '1px solid #e5e7eb',
      transition: 'background-color 0.2s',
    },
    trHover: {
      backgroundColor: '#f1f5f9',
    },
    button: {
      backgroundColor: '#1e40af',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.3s, transform 0.2s',
    },
    disabledButton: {
      backgroundColor: '#9ca3af',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'not-allowed',
    },
    formArea: {
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      marginTop: '15px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      textAlign: 'right',
    },
    input: {
      width: '60px',
      textAlign: 'center',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    quantityControl: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    exportContainer: {
      marginTop: '20px',
      display: 'flex',
      gap: '15px',
    },
    productCount: {
      fontSize: '16px',
      color: '#7f8c8d',
      marginBottom: '16px',
      fontWeight: '500',
      textAlign: 'right',
    },
    resetButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.3s',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>ליקוט</h2>
      <div style={styles.filterContainer}>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={styles.filterInput}
        />
        <div style={styles.selectContainer}>
          <Select
            options={customerFilterOptions}
            value={filterCustomerSelect}
            onChange={setFilterCustomerSelect}
            placeholder="בחר לקוח לסינון..."
            isClearable
            noOptionsMessage={() => (
              <div>
                אין תוצאות
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterCustomerSelect(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#1e40af',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginRight: '5px',
                  }}
                >
                  איפוס
                </button>
              </div>
            )}
          />
        </div>
        <input
          type="text"
          value={searchPickupId}
          onChange={(e) => setSearchPickupId(e.target.value)}
          placeholder="סינון לפי מזהה לקיטה..."
          style={styles.filterInput}
        />
      </div>
      {Object.keys(filteredPickupOrders).length === 0 ? (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>
            לא קיימות הזמנות עבור הסינונים שנבחרו.
          </p>
          <button
            onClick={() => {
              setFilterDate("");
              setFilterCustomerSelect(null);
              setSearchPickupId("");
            }}
            style={styles.resetButton}
          >
            איפוס סינון
          </button>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>מזהה לקיטה</th>
              <th style={styles.th}>לקוח</th>
              <th style={styles.th}>תאריך</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(filteredPickupOrders)
              .sort(([, pickupA], [, pickupB]) => new Date(pickupB.date) - new Date(pickupA.date))
              .map(([pickupId, pickup]) => {
                const customer = customers[pickup.customerId];
                return (
                  <React.Fragment key={pickupId}>
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectPickup(pickupId)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={styles.td}>{hashCode(pickupId)}</td>
                      <td style={styles.td}>{customer ? customer.name : pickup.customerId}</td>
                      <td style={styles.td}>{new Date(pickup.date).toLocaleString()}</td>
                    </tr>
                    {selectedPickupId === pickupId && (
                      <tr>
                        <td style={styles.td} colSpan="3">
                          <div style={styles.formArea}>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e40af', marginBottom: '20px' }}>
                              עריכת הזמנת לקיטה: {hashCode(pickupId)}
                            </h3>
                            <div style={{ marginBottom: '15px' }}>
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                קוד מוצר (הדבקה/סריקה):
                              </label>
                              <input
                                type="text"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                onPaste={handleBarcodePaste}
                                placeholder="הדבק או סרוק ברקוד"
                                style={{
                                  padding: '10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  backgroundColor: '#fff',
                                  width: '280px',
                                }}
                                disabled={isSubmitting}
                              />
                            </div>
                            <table style={styles.table}>
                              <thead>
                                <tr>
                                  <th style={styles.th}>תמונה</th>
                                  <th style={styles.th}>שם מוצר</th>
                                  <th style={styles.th}>מלאי</th>
                                  <th style={styles.th}>נדרש</th>
                                  <th style={styles.th}>נלקט</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(pickup.items).map(([pid, item]) => {
                                  const product = products[pid];
                                  const requiredQuantity =
                                    item.required !== undefined ? item.required : item.quantity;
                                  const pickedQuantity = editedItems[pid] ? editedItems[pid].picked : 0;

                                  return (
                                    <tr key={pid}>
                                      <td style={styles.td}>
                                        {product && product.imageUrl ? (
                                          <ProductImage
                                            imageUrl={product.imageUrl}
                                            productName={product.name}
                                            isEditable={false}
                                          />
                                        ) : (
                                          "אין תמונה"
                                        )}
                                      </td>
                                      <td style={styles.td}>{product ? product.name : pid}</td>
                                      <td style={styles.td}>
                                        {product ? (
                                          product.stock === 0 ? (
                                            <span
                                              style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                backgroundColor: '#fee2e2',
                                                color: '#ef4444',
                                                fontWeight: '600',
                                                fontSize: '14px',
                                              }}
                                            >
                                              אזל מהמלאי
                                            </span>
                                          ) : (
                                            <span
                                              style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                backgroundColor:
                                                  product.stock <= 5 ? '#fef3c7' : '#d1fae5',
                                                color: product.stock <= 5 ? '#d97706' : '#10b981',
                                                fontWeight: '600',
                                                fontSize: '14px',
                                              }}
                                            >
                                              {product.stock}
                                            </span>
                                          )
                                        ) : (
                                          '-'
                                        )}
                                      </td>
                                      <td style={styles.td}>{requiredQuantity}</td>
                                      <td style={styles.td}>
                                        <div style={styles.quantityControl}>
                                          <button
                                            type="button"
                                            style={{
                                              ...styles.button,
                                              opacity:
                                                product && (product.stock <= 0 || pickedQuantity <= 0)
                                                  ? 0.5
                                                  : 1,
                                              cursor:
                                                product && product.stock <= 0
                                                  ? 'not-allowed'
                                                  : 'pointer',
                                            }}
                                            onClick={() => handleDecrease(pid)}
                                            disabled={
                                              product &&
                                              (product.stock <= 0 || pickedQuantity <= 0)
                                            }
                                          >
                                            –
                                          </button>
                                          <input
                                            type="number"
                                            min="0"
                                            value={pickedQuantity}
                                            onChange={(e) => handleQuantityChange(pid, e.target.value)}
                                            style={{
                                              ...styles.input,
                                              opacity:
                                                product && product.stock <= 0
                                                  ? 0.5
                                                  : 1,
                                              cursor:
                                                product && product.stock <= 0
                                                  ? 'not-allowed'
                                                  : 'text',
                                              borderColor:
                                                product && pickedQuantity > product.stock
                                                  ? '#ef4444'
                                                  : '#d1d5db',
                                              backgroundColor:
                                                product && pickedQuantity > product.stock
                                                  ? '#fee2e2'
                                                  : '#fff',
                                            }}
                                            disabled={product && product.stock <= 0}
                                          />
                                          <button
                                            type="button"
                                            style={{
                                              ...styles.button,
                                              opacity:
                                                product &&
                                                (product.stock <= 0 || pickedQuantity >= product.stock)
                                                  ? 0.5
                                                  : 1,
                                              cursor:
                                                product && product.stock <= 0
                                                  ? 'not-allowed'
                                                  : 'pointer',
                                            }}
                                            onClick={() => handleIncrease(pid)}
                                            disabled={
                                              product &&
                                              (product.stock <= 0 || pickedQuantity >= product.stock)
                                            }
                                          >
                                            +
                                          </button>
                                        </div>
                                        {product && pickedQuantity > product.stock && (
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
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            <div style={styles.productCount}>
                              <div>
                                כמות מוצרים שנלקטו: <strong>{calculateTotalPickedItems()}</strong>
                              </div>
                              <div>
                                מספר פריטים שנלקטו: <strong>{calculateTotalPickedProducts()}</strong>
                              </div>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                              <button
                                style={isSubmitting ? styles.disabledButton : styles.button}
                                onClick={handleSavePickup}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "שומר..." : "שמור ליקוט"}
                              </button>
                            </div>
                            <div style={{ marginTop: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                              <Select
                                options={orderStatusOptions}
                                value={selectedStatus}
                                onChange={setSelectedStatus}
                                placeholder="בחר סטטוס להזמנה"
                                menuPortalTarget={document.body}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    fontFamily: 'Arial, sans-serif',
                                  }),
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                }}
                              />
                              <button
                                style={isSubmitting ? styles.disabledButton : styles.button}
                                onClick={handleClosePickup}
                                disabled={isSubmitting}
                              >
                                סגור הזמנה
                              </button>
                            </div>
                            <div style={styles.exportContainer}>
                              <ExportToExcelButton
                                data={excelData}
                                fileName={`pickup_${hashCode(selectedPickupId)}_export`}
                              />
                              <ExportToPdfButton
                                data={excelData}
                                fileName={`pickup_${hashCode(selectedPickupId)}_export`}
                                title="pickup"
                              />
                              <ExportOrdersToPdfButton
                                data={excelData}
                                fileName={`pickup_${hashCode(selectedPickupId)}_export`}
                                title="pickup"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ConfirmPickupOrder;
