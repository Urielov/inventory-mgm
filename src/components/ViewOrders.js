// src/components/ViewOrdersTable.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToOrders, updateOrder } from '../models/orderModel';
import { listenToProducts, updateOrderedQuantity, updateStock } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import ExportToExcelButton from './ExportToExcelButton';
import ExportOrdersToPdfButton from './ExportOrdersToPdfButton';
import ExportToPdfButton from './ExportToPdfButton';

const ViewOrdersTable = () => {
  // State declarations
  const [orders, setOrders] = useState({});
  const [customers, setCustomers] = useState({});
  const [products, setProducts] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState({ value: 'all', label: 'כל הלקוחות' });
  const [selectedOrderStatus, setSelectedOrderStatus] = useState({ value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' });
  const [searchDate, setSearchDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [editedItems, setEditedItems] = useState({});
  const [editingStatus, setEditingStatus] = useState({});
  const [childEditMode, setChildEditMode] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Sorting state for column headers
  const [sortField, setSortField] = useState('date'); // 'date' or 'total'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  const orderStatusFilterOptions = [
    { value: 'all', label: 'כל הסטטוסים' },
    { value: 'סופקה במלואה', label:  'סופקה במלואה' },
    { value: 'סופקה חלקית', label:  'סופקה חלקית' },
    { value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' },
    { value: 'ממתינה למשלוח לוקטה חלקית', label: 'ממתינה למשלוח לוקטה חלקית' },
    { value: 'ממתינה לאישור הלקוח', label: 'ממתינה לאישור הלקוח' },
    { value: 'הזמנה בוטלה', label: 'הזמנה בוטלה' },


  ];

  const orderStatusOptions = [
    { value:  'סופקה במלואה', label:  'סופקה במלואה' },
    { value: 'סופקה חלקית', label:  'סופקה חלקית' },
    { value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' },
    { value: 'ממתינה למשלוח לוקטה חלקית', label: 'ממתינה למשלוח לוקטה חלקית' },
    { value: 'ממתינה לאישור הלקוח', label: 'ממתינה לאישור הלקוח' },
    { value: 'הזמנה בוטלה', label: 'הזמנה בוטלה' },


  ];

  // Hash function to convert orderId to a 6-digit identifier
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 1000000;
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeOrders = listenToOrders(setOrders);
    const unsubscribeProducts = listenToProducts(setProducts);
    const unsubscribeCustomers = listenToCustomers((data) => {
      setCustomers(data);
      setIsLoading(false);
    });
    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, []);

  // Reset page when filtering or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCustomer, selectedOrderStatus, searchDate, searchId, sortField, sortDirection]);

  const customerOptions = [
    { value: 'all', label: 'כל הלקוחות' },
    ...Object.keys(customers).map(key => ({
      value: key,
      label: customers[key].name,
    })),
  ];

  // Calculate total price of an order
  const calculateTotalPrice = (order) => {
    let total = 0;
    if (order.items) {
      Object.entries(order.items).forEach(([pid, item]) => {
        const product = products[pid];
        if (product) {
          const price = Number(product.price);
          const quantity = Number(item.picked); // Use picked instead of quantity
          if (!isNaN(price) && !isNaN(quantity)) {
            total += price * quantity;
          }
        }
      });
    }
    return total;
  };

  // Filter by customer
  let filteredOrders = {};
  if (selectedCustomer.value === 'all') {
    filteredOrders = { ...orders };
  } else {
    Object.keys(orders).forEach(orderId => {
      const order = orders[orderId];
      if (order.customerId === selectedCustomer.value) {
        filteredOrders[orderId] = order;
      }
    });
  }

  // Filter by status
  if (selectedOrderStatus.value !== 'all') {
    const tempOrders = {};
    Object.entries(filteredOrders).forEach(([orderId, order]) => {
      if (order.status === selectedOrderStatus.value) {
        tempOrders[orderId] = order;
      }
    });
    filteredOrders = tempOrders;
  }

  // Filter by date
  if (searchDate !== "") {
    const newFiltered = {};
    Object.entries(filteredOrders).forEach(([orderId, order]) => {
      const orderDate = new Date(order.date).toISOString().split('T')[0];
      if (orderDate === searchDate) {
        newFiltered[orderId] = order;
      }
    });
    filteredOrders = newFiltered;
  }

  // Filter by ID (6-digit short ID)
  if (searchId !== "") {
    const newFiltered = {};
    Object.entries(filteredOrders).forEach(([orderId, order]) => {
      const shortId = hashCode(orderId).toString();
      if (shortId.includes(searchId)) {
        newFiltered[orderId] = order;
      }
    });
    filteredOrders = newFiltered;
  }

  // Convert filteredOrders to array for sorting and pagination
  let ordersArray = Object.entries(filteredOrders);

  // Handle column header sort click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort by selected column
  if (sortField === 'date') {
    ordersArray.sort((a, b) => {
      let diff = new Date(a[1].date) - new Date(b[1].date);
      return sortDirection === 'asc' ? diff : -diff;
    });
  } else if (sortField === 'total') {
    ordersArray.sort((a, b) => {
      let diff = calculateTotalPrice(a[1]) - calculateTotalPrice(b[1]);
      return sortDirection === 'asc' ? diff : -diff;
    });
  }

  const totalPages = Math.ceil(ordersArray.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const currentOrders = ordersArray.slice(startIndex, startIndex + ordersPerPage);

  // Additional functions
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      if (newStatus === "הזמנה בוטלה") {
        const order = orders[orderId];
        if (order && order.items) {
          for (const [pid, item] of Object.entries(order.items)) {
            const product = products[pid];
            if (product) {
              const updatedStock = product.stock + item.picked;
              const currentOrdered = Number(product.orderedQuantity) || 0;
              const updatedOrdered = Math.max(currentOrdered - item.picked, 0);
              await updateStock(pid, updatedStock);
              await updateOrderedQuantity(pid, updatedOrdered);
            }
          }
        }
        await updateOrder(orderId, { status: newStatus, items: {}, totalPrice: 0 });
      } else {
        await updateOrder(orderId, { status: newStatus });
      }
      showToast("סטטוס ההזמנה עודכן בהצלחה!", "success");
      setEditingStatus(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (error) {
      console.error("Error updating order status: ", error);
      showToast("שגיאה בעדכון סטטוס ההזמנה", "error");
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
    if (!editedItems[orderId] && filteredOrders[orderId] && filteredOrders[orderId].items) {
      const initItems = {};
      Object.entries(filteredOrders[orderId].items).forEach(([pid, item]) => {
        initItems[pid] = {
          required: item.required,
          picked: item.picked,
          comment: item.comment || ""
        };
      });
      setEditedItems(prev => ({ ...prev, [orderId]: initItems }));
    }
  };

  const handleItemChange = (orderId, productId, field, value) => {
    setEditedItems(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [productId]: {
          ...prev[orderId]?.[productId],
          [field]: field === "comment" ? value : Number(value) || 0
        }
      }
    }));
  };

  const handleQuantityChange = (orderId, productId, newValue) => {
    const numericValue = Number(newValue) || 0;
    handleItemChange(orderId, productId, "picked", numericValue);
  };

  const handleIncrease = (orderId, productId) => {
    const current = editedItems[orderId]?.[productId]?.picked || filteredOrders[orderId].items[productId].picked || 0;
    handleItemChange(orderId, productId, "picked", current + 1);
  };

  const handleDecrease = (orderId, productId) => {
    const current = editedItems[orderId]?.[productId]?.picked || filteredOrders[orderId].items[productId].picked || 0;
    const newVal = current > 0 ? current - 1 : 0;
    handleItemChange(orderId, productId, "picked", newVal);
  };

  const handleCommentChange = (orderId, productId, newValue) => {
    handleItemChange(orderId, productId, "comment", newValue);
  };

  const handleSaveItem = async (orderId, productId) => {
    const itemEdits = editedItems[orderId]?.[productId];
    if (!itemEdits) return;

    const originalOrder = filteredOrders[orderId];
    const originalPicked = originalOrder.items[productId]?.picked || 0;
    const newPicked = itemEdits.picked;
    const quantityDiff = newPicked - originalPicked;

    try {
      await updateOrder(orderId, {
        [`items/${productId}/required`]: itemEdits.required,
        [`items/${productId}/picked`]: itemEdits.picked,
        [`items/${productId}/comment`]: itemEdits.comment,
      });

      const product = products[productId];
      if (product) {
        const currentOrderedQuantity = Number(product.orderedQuantity) || 0;
        const updatedOrderedQuantity = currentOrderedQuantity + quantityDiff;
        await updateOrderedQuantity(productId, updatedOrderedQuantity >= 0 ? updatedOrderedQuantity : 0);
      }

      showToast("עדכון הפריט נשמר בהצלחה!", "success");
      setChildEditMode((prev) => {
        const updated = { ...prev };
        if (updated[orderId]) {
          delete updated[orderId][productId];
        }
        return updated;
      });
    } catch (error) {
      console.error("שגיאה בעדכון הפריט:", error);
      showToast("שגיאה בעדכון הפריט", "error");
    }
  };

  // Calculate grand total for all displayed orders
  const calculateGrandTotal = () => {
    let grandTotal = 0;
    Object.values(filteredOrders).forEach(order => {
      grandTotal += calculateTotalPrice(order);
    });
    return grandTotal;
  };

  const exportData = () => {
    const productIds = new Set();
    Object.values(filteredOrders).forEach(order => {
      if (order.items) {
        Object.keys(order.items).forEach(pid => productIds.add(pid));
      }
    });
    const productIdArray = Array.from(productIds);

    return Object.entries(filteredOrders).map(([orderId, order]) => {
      const customer = customers[order.customerId];
      const row = {
        "מזהה הזמנה": hashCode(orderId),
        "שם לקוח": customer ? customer.name : order.customerId,
        "סטטוס": order.status || "",
        "תאריך": new Date(order.date).toLocaleString('he-IL'),
        "סה\"כ": "₪" + calculateTotalPrice(order).toLocaleString()
      };
      productIdArray.forEach(pid => {
        const productName = products[pid] ? products[pid].name : pid;
        row[`${productName} - נדרש`] = order.items && order.items[pid] ? order.items[pid].required : 0;
        row[`${productName} - נלקט`] = order.items && order.items[pid] ? order.items[pid].picked : 0;
      });
      return row;
    });
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      padding: '12px 24px',
      backgroundColor: type === 'success' ? '#34C759' : '#FF3B30',
      color: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '1000',
      fontSize: '16px',
      fontWeight: '500',
      opacity: '1',
      transition: 'opacity 0.3s ease-in-out'
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  const excelData = exportData();

  // Enhanced styles
  const styles = {
    container: {
      padding: '30px',
      direction: 'rtl',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: '"Rubik", "Assistant", Arial, sans-serif',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%)',
      minHeight: '100vh'
    },
    header: {
      color: '#1E293B',
      fontSize: '32px',
      fontWeight: '700',
      marginBottom: '30px',
      paddingBottom: '15px',
      borderBottom: '4px solid #3B82F6',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    filterContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
      background: 'white',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E5E7EB'
    },
    filterSection: {
      flexDirection: 'column',
      gap: '8px'
    },
    filterLabel: {
      fontWeight: '600',
      fontSize: '16px',
      color: '#374151',
      letterSpacing: '0.2px'
    },
    selectContainer: {
      width: '100%'
    },
    dateInput: {
      padding: '12px 15px',
      borderRadius: '8px',
      border: '1px solid #D1D5DB',
      width: '90%',
      fontSize: '15px',
      background: '#F9FAFB',
      transition: 'border-color 0.2s ease',
      cursor: 'pointer'
    },
    noData: {
      textAlign: 'center',
      padding: '50px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
      color: '#6B7280',
      fontSize: '18px',
      fontWeight: '500',
      border: '1px solid #E5E7EB'
    },
    resetButton: {
      padding: '12px 24px',
      background: '#3B82F6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
    },
    tableContainer: {
      overflowX: 'auto',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
      marginBottom: '30px',
      border: '1px solid #E5E7EB'
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
      fontSize: '15px'
    },
    tableHeader: {
      background: '#F8FAFC',
      borderBottom: '2px solid #E5E7EB'
    },
    tableHeaderCell: {
      padding: '18px 20px',
      textAlign: 'right',
      fontWeight: '700',
      color: '#1E293B',
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      fontSize: '13px',
      letterSpacing: '0.5px'
    },
    tableRow: {
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    tableRowEven: {
      backgroundColor: '#F9FAFB'
    },
    tableCell: {
      padding: '16px 20px',
      borderBottom: '1px solid #E5E7EB',
      color: '#4B5563',
      verticalAlign: 'middle'
    },
    expandedContainer: {
      background: '#F8FAFC',
      padding: '20px',
      borderRadius: '10px',
      margin: '0 20px 20px 20px',
      border: '1px solid #E5E7EB',
      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
      animation: 'slideDown 0.3s ease'
    },
    productDetail: {
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '20px',
      padding: '15px',
      borderRadius: '8px',
      background: 'white',
      border: '1px solid #E5E7EB',
      transition: 'all 0.2s ease'
    },
    productName: {
      fontWeight: '600',
      color: '#1E293B',
      fontSize: '16px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      width: '100%'
    },
    inputLabel: {
      fontWeight: '500',
      fontSize: '14px',
      color: '#4B5563'
    },
    commentInput: {
      padding: '10px 12px',
      border: '1px solid #D1D5DB',
      borderRadius: '6px',
      width: '100%',
      fontSize: '15px',
      background: '#F9FAFB',
      transition: 'border-color 0.2s ease'
    },
    quantityControl: {
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #D1D5DB',
      borderRadius: '6px',
      overflow: 'hidden',
      width: 'fit-content',
      background: '#F9FAFB'
    },
    quantityButton: {
      border: 'none',
      background: '#E5E7EB',
      color: '#1E293B',
      width: '36px',
      height: '36px',
      fontSize: '18px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    quantityInput: {
      padding: '8px 0',
      border: 'none',
      borderLeft: '1px solid #D1D5DB',
      borderRight: '1px solid #D1D5DB',
      width: '50px',
      textAlign: 'center',
      fontSize: '15px',
      background: 'white'
    },
    saveItemButton: {
      padding: '10px 20px',
      background: '#10B981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    editStatusButton: {
      padding: '6px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      background: '#E5E7EB',
      border: 'none',
      borderRadius: '6px',
      color: '#4B5563',
      transition: 'all 0.2s ease'
    },
    saveStatusButton: {
      padding: '6px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      background: '#10B981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      transition: 'all 0.2s ease'
    },
    cancelStatusButton: {
      padding: '6px 12px',
      fontSize: '13px',
      cursor: 'pointer',
      background: '#EF4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      transition: 'all 0.2s ease'
    },
    actionButton: {
      border: 'none',
      background: 'transparent',
      color: '#3B82F6',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease'
    },
    exportContainer: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      padding: '20px 0'
    },
    paginationContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginTop: '20px'
    },
    paginationButton: {
      padding: '8px 12px',
      border: '1px solid #D1D5DB',
      borderRadius: '4px',
      background: 'white',
      cursor: 'pointer'
    },
    activePage: {
      background: '#3B82F6',
      color: 'white'
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.header}>📦 צפייה בהזמנות</h2>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '6px solid #E5E7EB',
            borderTop: '6px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{ fontSize: '18px', color: '#4B5563', fontWeight: '500' }}>טוען נתונים...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📦 צפייה בהזמנות</h2>

      <div style={styles.filterContainer}>
        <div style={styles.filterSection}>
          <label style={styles.filterLabel}>בחר לקוח</label>
          <Select
            options={customerOptions}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="הקלד או בחר לקוח..."
            isClearable={false}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '44px',
                borderRadius: '8px',
                borderColor: '#D1D5DB',
                background: '#F9FAFB',
                boxShadow: 'none',
                fontSize: '15px'
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
                color: state.isSelected ? 'white' : '#1E293B',
                fontSize: '15px',
                padding: '10px 12px'
              })
            }}
          />
        </div>

        <div style={styles.filterSection}>
          <label style={styles.filterLabel}>בחר סטטוס</label>
          <Select
            options={orderStatusFilterOptions}
            value={selectedOrderStatus}
            onChange={setSelectedOrderStatus}
            placeholder="בחר סטטוס"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '44px',
                borderRadius: '8px',
                borderColor: '#D1D5DB',
                background: '#F9FAFB',
                boxShadow: 'none',
                fontSize: '15px'
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
                color: state.isSelected ? 'white' : '#1E293B',
                fontSize: '15px',
                padding: '10px 12px'
              })
            }}
          />
        </div>

        <div style={styles.filterSection}>
          <label style={styles.filterLabel}>בחר תאריך</label>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            style={styles.dateInput}
          />
        </div>

        <div style={styles.filterSection}>
          <label style={styles.filterLabel}>סינון לפי מזהה</label>
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="הקלד מזהה..."
            style={{ ...styles.dateInput, cursor: 'text' }}
          />
        </div>

        {(selectedCustomer.value !== 'all' || searchDate !== "" || selectedOrderStatus.value !== 'all' || searchId !== "") && (
          <div style={styles.filterSection}>
            <button
              style={{ ...styles.resetButton, marginTop: '28px' }}
              onClick={() => {
                setSelectedCustomer({ value: 'all', label: 'כל הלקוחות' });
                setSearchDate("");
                setSelectedOrderStatus({ value: 'all', label: 'כל הסטטוסים' });
                setSearchId("");
              }}
            >
              ניקוי סינון
            </button>
          </div>
        )}
      </div>

      {ordersArray.length > 0 && (
        <div style={{ textAlign: 'left', fontSize: '16px', color: '#7f8c8d', marginBottom: '16px', fontWeight: '500' }}>
          סה"כ הזמנות: <strong>{ordersArray.length}</strong>
        </div>
      )}

      {ordersArray.length === 0 ? (
        <div style={styles.noData}>
          <div style={{ fontSize: '60px', marginBottom: '20px', color: '#D1D5DB' }}>📭</div>
          <p>לא נמצאו הזמנות עבור סינון זה</p>
          <button
            style={styles.resetButton}
            onClick={() => {
              setSelectedCustomer({ value: 'all', label: 'כל הלקוחות' });
              setSearchDate("");
              setSelectedOrderStatus({ value: 'all', label: 'כל הסטטוסים' });
              setSearchId("");
            }}
          >
            הצג את כל ההזמנות
          </button>
        </div>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.tableHeaderCell}>שם לקוח</th>
                  <th style={styles.tableHeaderCell}>סטטוס</th>
                  <th
                    style={{ ...styles.tableHeaderCell, cursor: 'pointer' }}
                    onClick={() => handleSort('date')}
                  >
                    תאריך {sortField === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...styles.tableHeaderCell, cursor: 'pointer' }}
                    onClick={() => handleSort('total')}
                  >
                    סה"כ {sortField === 'total' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ ...styles.tableHeaderCell, width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map(([orderId, order], index) => {
                  const customer = customers[order.customerId];
                  const isExpanded = expandedOrders.includes(orderId);
                  const totalPrice = calculateTotalPrice(order);

                  return (
                    <React.Fragment key={orderId}>
                      <tr
                        style={{
                          ...styles.tableRow,
                          ...(index % 2 === 1 ? styles.tableRowEven : {}),
                          backgroundColor: isExpanded ? '#EFF6FF' : undefined
                        }}
                        onClick={() => toggleExpand(orderId)}
                      >
                        <td style={styles.tableCell}>
                          <div style={{ fontWeight: '600', color: '#1E293B' }}>
                            {customer ? customer.name : order.customerId}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6B7280' }}>
                            מזהה: {hashCode(orderId)}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          {editingStatus[orderId] ? (
                            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Select
                                options={orderStatusOptions}
                                value={editingStatus[orderId]}
                                onChange={(selectedOption) =>
                                  setEditingStatus(prev => ({ ...prev, [orderId]: selectedOption }))
                                }
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: '36px',
                                    borderRadius: '6px',
                                    borderColor: '#D1D5DB',
                                    background: '#F9FAFB',
                                    boxShadow: 'none'
                                  }),
                                  option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
                                    color: state.isSelected ? 'white' : '#1E293B'
                                  })
                                }}
                                isSearchable={false}
                              />
                              <button
                                style={styles.saveStatusButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(orderId, editingStatus[orderId].value);
                                }}
                              >
                                שמור
                              </button>
                              <button
                                style={styles.cancelStatusButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingStatus(prev => {
                                    const updated = { ...prev };
                                    delete updated[orderId];
                                    return updated;
                                  });
                                }}
                              >
                                בטל
                              </button>
                            </div>
                          ) : (
                            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                background:
                                  order.status === 'הזמנה סופקה' ? '#D1FAE5' :
                                  order.status === 'ממתינה למשלוח' ? '#FEF3C7' :
                                  order.status === 'הזמנה בוטלה' ? '#FEE2E2' :
                                  order.status === 'סופקה חלקית' ? '#DBEAFE' :
                                  order.status === 'מחכה לאישור הלקוח' ? '#EDE9FE' :
                                  order.status === 'לוקט במלואו' ? '#A7F3D0' :
                                  order.status === 'לוקט חלקית' ? '#FFEDD5' :
                                  '#FEF3C7', // ברירת מחדל ממתינה למשלוח
                                color:
                                  order.status === 'הזמנה סופקה' ? '#10B981' :
                                  order.status === 'ממתינה למשלוח' ? '#D97706' :
                                  order.status === 'הזמנה בוטלה' ? '#EF4444' :
                                  order.status === 'סופקה חלקית' ? '#3B82F6' :
                                  order.status === 'מחכה לאישור הלקוח' ? '#8B5CF6' :
                                  order.status === 'לוקט במלואו' ? '#059669' :
                                  order.status === 'לוקט חלקית' ? '#F97316' :
                                  '#D97706' // ברירת מחדל ממתינה למשלוח
                              }}>
                                {order.status || "ממתינה למשלוח"}
                              </span>
                              <button
                                style={styles.editStatusButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingStatus(prev => ({
                                    ...prev,
                                    [orderId]: { value: order.status || 'ממתינה למשלוח', label: order.status || 'ממתינה למשלוח' }
                                  }));
                                }}
                              >
                                ערוך
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          {new Date(order.date).toLocaleString('he-IL', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={{ fontWeight: '600', color: '#1E293B' }}>
                            ₪{totalPrice.toLocaleString()}
                          </div>
                          {order.items && (
                            <div style={{ fontSize: '13px', color: '#6B7280' }}>
                              {Object.keys(order.items).length} פריטים
                            </div>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <button style={styles.actionButton}>
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="5" style={{ padding: 0, borderBottom: '1px solid #E5E7EB' }}>
                            <div style={styles.expandedContainer}>
                              {order.items && Object.keys(order.items).length > 0 ? (
                                <>
                                  {Object.entries(order.items).map(([productId, item]) => {
                                    const product = products[productId];
                                    const isChildEditing = childEditMode[orderId] && childEditMode[orderId][productId];
                                    return (
                                      <div key={productId} style={styles.productDetail}>
                                        <div style={styles.productName}>
                                          {product ? product.name : productId}
                                          {product && (
                                            <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'normal' }}>
                                              ₪{product.price.toLocaleString()} ליחידה
                                            </div>
                                          )}
                                        </div>
                                        {isChildEditing ? (
                                          <div onClick={(e) => e.stopPropagation()} style={styles.inputGroup}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                              <span style={styles.inputLabel}>נדרש:</span>
                                              <input
                                                type="text"
                                                value={editedItems[orderId]?.[productId]?.required ?? item.required}
                                                onChange={(e) => handleItemChange(orderId, productId, "required", Number(e.target.value) || 0)}
                                                style={styles.quantityInput}
                                              />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                              <span style={styles.inputLabel}>נלקט:</span>
                                              <div style={styles.quantityControl}>
                                                <button
                                                  style={styles.quantityButton}
                                                  onClick={() => handleDecrease(orderId, productId)}
                                                >
                                                  -
                                                </button>
                                                <input
                                                  type="text"
                                                  value={editedItems[orderId]?.[productId]?.picked ?? item.picked}
                                                  onChange={(e) => handleQuantityChange(orderId, productId, e.target.value)}
                                                  style={styles.quantityInput}
                                                />
                                                <button
                                                  style={styles.quantityButton}
                                                  onClick={() => handleIncrease(orderId, productId)}
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                              <span style={styles.inputLabel}>הערה:</span>
                                              <input
                                                type="text"
                                                value={editedItems[orderId]?.[productId]?.comment ?? (item.comment || "")}
                                                onChange={(e) => handleCommentChange(orderId, productId, e.target.value)}
                                                style={styles.commentInput}
                                                placeholder="הוסף הערה..."
                                              />
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                              <button
                                                style={styles.saveItemButton}
                                                onClick={() => handleSaveItem(orderId, productId)}
                                              >
                                                שמור
                                              </button>
                                              <button
                                                style={styles.cancelStatusButton}
                                                onClick={() => {
                                                  setChildEditMode(prev => {
                                                    const updated = { ...prev };
                                                    if (updated[orderId]) {
                                                      delete updated[orderId][productId];
                                                    }
                                                    return updated;
                                                  });
                                                }}
                                              >
                                                בטל
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div>
                                              <div style={{ fontSize: '14px', color: '#4B5563' }}>
                                                נדרש: <span style={{ fontWeight: '600' }}>{item.required}</span>
                                              </div>
                                              <div style={{ fontSize: '14px', color: '#4B5563' }}>
                                                נלקט: <span style={{ fontWeight: '600' }}>{item.picked}</span>
                                              </div>
                                              <div style={{ fontSize: '14px', color: '#4B5563' }}>
                                                הערה: <span style={{ fontStyle: item.comment ? 'normal' : 'italic' }}>{item.comment || "ללא הערה"}</span>
                                              </div>
                                            </div>
                                            <button
                                              style={styles.editStatusButton}
                                              onClick={() => {
                                                setChildEditMode(prev => ({
                                                  ...prev,
                                                  [orderId]: {
                                                    ...prev[orderId],
                                                    [productId]: true
                                                  }
                                                }));
                                              }}
                                            >
                                              ערוך
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <div style={{ textAlign: 'left', fontWeight: '600', color: '#1E293B', fontSize: '16px' }}>
                                    סה"כ: ₪{calculateTotalPrice(order).toLocaleString()}
                                  </div>
                                </>
                              ) : (
                                <div style={{ padding: '25px', textAlign: 'center', color: '#6B7280', fontSize: '16px' }}>
                                  אין פריטים בהזמנה זו
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'right', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            סה"כ סכום : ₪{calculateGrandTotal().toLocaleString()}
          </div>

          <div style={styles.paginationContainer}>
            <button
              style={{
                ...styles.paginationButton,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              קודם
            </button>
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx + 1}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === idx + 1 ? styles.activePage : {})
                }}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              style={{
                ...styles.paginationButton,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              הבא
            </button>
          </div>

          <div style={styles.exportContainer}>
            <ExportToExcelButton
              data={excelData}
              fileName="orders_export"
              style={{
                padding: '12px 24px',
                background: '#10B981',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600'
              }}
            />
            <ExportOrdersToPdfButton
              data={excelData}
              fileName="orders_export"
              title="orders"
              style={{
                padding: '12px 24px',
                background: '#3B82F6',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600'
              }}
            />
            <ExportToPdfButton
              data={excelData}
              fileName="orders_export"
              title="orders"
              style={{
                padding: '12px 24px',
                background: '#3B82F6',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600'
              }}
            />
          </div>
        </>
      )}

      <style>
        {`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 768px) {
            .filterContainer {
              grid-template-columns: 1fr;
            }
            .productDetail {
              grid-template-columns: 1fr;
              gap: 15px;
            }
            .tableHeaderCell, .tableCell {
              padding: 12px 10px;
            }
          }
          @media (max-width: 480px) {
            .expandedContainer {
              margin: 0;
              borderRadius: 0;
            }
            .tableContainer {
              borderRadius: 0;
              margin: 0 -30px 30px -30px;
            }
            .container {
              padding: 15px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ViewOrdersTable;