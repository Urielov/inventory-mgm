import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToOnlineOrders, updateOnlineOrder } from '../models/onlineOrderModel';
import { listenToProducts } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import { createPickupOrder } from '../models/pickupOrderModel';
import ExportToExcelButton from './ExportToExcelButton';
import ExportOrdersToPdfButton from './ExportOrdersToPdfButton';
import ExportToPdfButton from './ExportToPdfButton';

const ViewOnlineOrders = () => {
  const [orders, setOrders] = useState({});
  const [customers, setCustomers] = useState({});
  const [products, setProducts] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState({ value: 'all', label: 'כל הלקוחות' });
  const [selectedOrderStatus, setSelectedOrderStatus] = useState({ value: 'all', label: 'כל הסטטוסים' });
  const [searchDate, setSearchDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [editedItems, setEditedItems] = useState({});
  const [editingStatus, setEditingStatus] = useState({});
  const [childEditMode, setChildEditMode] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const orderStatusFilterOptions = [
    { value: 'all', label: 'כל הסטטוסים' },
    { value: 'הזמנה חדשה', label: 'הזמנה חדשה'},
    { value: 'סופקה במלואה', label: 'סופקה במלואה' },
    { value: 'סופקה חלקית', label: 'סופקה חלקית' },
    { value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' },
    { value: 'ממתינה למשלוח לוקטה חלקית', label: 'ממתינה למשלוח לוקטה חלקית' },
    { value: 'ממתינה לאישור הלקוח', label: 'ממתינה לאישור הלקוח' },
    { value: 'הזמנה בוטלה', label: 'הזמנה בוטלה' },
    { value: 'הועבר ללקיטה', label: 'הועבר ללקיטה' },
  ];

  const orderStatusOptions = [
    { value: 'הזמנה חדשה', label: 'הזמנה חדשה'},
    { value: 'סופקה במלואה', label: 'סופקה במלואה' },
    { value: 'סופקה חלקית', label: 'סופקה חלקית' },
    { value: 'ממתינה למשלוח', label: 'ממתינה למשלוח' },
    { value: 'ממתינה למשלוח לוקטה חלקית', label: 'ממתינה למשלוח לוקטה חלקית' },
    { value: 'ממתינה לאישור הלקוח', label: 'ממתינה לאישור הלקוח' },
    { value: 'הזמנה בוטלה', label: 'הזמנה בוטלה' },
    { value: 'הועבר ללקיטה', label: 'הועבר ללקיטה' },
  ];

  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 1000000;
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeOnlineOrders = listenToOnlineOrders(setOrders);
    const unsubscribeProducts = listenToProducts(setProducts);
    const unsubscribeCustomers = listenToCustomers((data) => {
      setCustomers(data);
      setIsLoading(false);
    });
    return () => {
      unsubscribeOnlineOrders();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, []);

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

  const calculateTotalPrice = (order) => {
    return Object.entries(order.items || {}).reduce((total, [productId, item]) => {
      const quantity = parseInt(item.picked, 10) || 0;
      const product = products[productId];
      return product && quantity > 0 ? total + product.price * quantity : total;
    }, 0);
  };

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

  if (selectedOrderStatus.value !== 'all') {
    const temp = {};
    Object.entries(filteredOrders).forEach(([orderId, order]) => {
      if (order.status === selectedOrderStatus.value) {
        temp[orderId] = order;
      }
    });
    filteredOrders = temp;
  }

  if (searchDate !== "") {
    const temp = {};
    Object.entries(filteredOrders).forEach(([orderId, order]) => {
      const orderDate = new Date(order.date).toISOString().split('T')[0];
      if (orderDate === searchDate) {
        temp[orderId] = order;
      }
    });
    filteredOrders = temp;
  }

  if (searchId !== "") {
    const temp = {};
    Object.entries(filteredOrders).forEach(([orderId, order]) => {
      const shortId = hashCode(orderId).toString();
      if (shortId.includes(searchId)) {
        temp[orderId] = order;
      }
    });
    filteredOrders = temp;
  }

  let ordersArray = Object.entries(filteredOrders);


  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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

  const exportSingleOrderData = (orderId) => {
    const order = filteredOrders[orderId];
    if (!order) return [];
    const customer = customers[order.customerId];
    let rows = [];
    if (order.items) {
      Object.entries(order.items).forEach(([pid, item]) => {
        const product = products[pid];
        rows.push({
          "מזהה הזמנה": hashCode(orderId),
          "שם לקוח": customer ? customer.name : order.customerId,
          "שם מוצר": product ? product.name : pid,
          "כמות נדרשת": item.required,
          "נלקט": item.picked,
          "מחיר": product ? product.price : '-'
        });
      });
    }
    return rows;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOnlineOrder(orderId, { status: newStatus });
      showToast("סטטוס ההזמנה עודכן בהצלחה!", "success");
      setEditingStatus(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (error) {
      console.error("שגיאה בעדכון סטטוס ההזמנה: ", error);
      showToast("שגיאה בעדכון סטטוס ההזמנה", "error");
    }
  };

  const handleTransferToPickup = async (orderId) => {
    const order = filteredOrders[orderId];
    if (!order || !order.items) {
      showToast("אין פריטים להעברה להזמנת לקיטה", "error");
      return;
    }

    const pickupItems = {};
    Object.entries(order.items).forEach(([productId, item]) => {
      const quantity = parseInt(item.required, 10) || 0;
      if (quantity > 0) {
        pickupItems[productId] = { quantity };
      }
    });

    if (Object.keys(pickupItems).length === 0) {
      showToast("אין כמויות נדרשות להעברה", "error");
      return;
    }

    const pickupData = {
      customerId: order.customerId,
      date: new Date().toISOString(),
      items: pickupItems,
      totalPrice: calculateTotalPrice(order),
      sourceOrderId: orderId,
      status: 'חדש'
    };

    try {
      const newPickupRef = await createPickupOrder(pickupData);
      const pickupShortId = hashCode(newPickupRef.key);
      showToast(`הזמנה הועברה ללקיטה בהצלחה! מזהה: ${pickupShortId}`, "success");
      await updateOnlineOrder(orderId, { status: 'הועבר ללקיטה' });
    } catch (error) {
      console.error("Error transferring order to pickup:", error);
      showToast("שגיאה בהעברה להזמנת לקיטה", "error");
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

    try {
      await updateOnlineOrder(orderId, {
        [`items/${productId}/required`]: itemEdits.required,
        [`items/${productId}/picked`]: itemEdits.picked,
        [`items/${productId}/comment`]: itemEdits.comment,
      });
      showToast("עדכון הפריט נשמר בהצלחה!", "success");
      setChildEditMode(prev => {
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

  const calculateGrandTotal = () => {
    let grandTotal = 0;
    Object.values(filteredOrders).forEach(order => {
      grandTotal += calculateTotalPrice(order);
    });
    return grandTotal;
  };

  const exportDataForExcel = exportData();

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

  const stylesObj = {
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
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
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
    filterLabel: {
      fontWeight: '600',
      fontSize: '16px',
      color: '#374151'
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
    resetButton: {
      padding: '12px 24px',
      background: '#3B82F6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '600',
      transition: 'all 0.3s ease'
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
    },
    pdfButtonStyle: {
      padding: '6px 12px',
      background: '#3B82F6',
      color: 'white',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600'
    },
    transferButton: {
      padding: '6px 12px',
      background: '#8B5CF6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={stylesObj.container}>
      <h2 style={stylesObj.header}>📦 צפייה בהזמנות אונליין</h2>
      
      <div style={stylesObj.filterContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={stylesObj.filterLabel}>בחר לקוח</label>
          <Select
            options={customerOptions}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="הקלד או בחר לקוח..."
            isClearable={false}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={stylesObj.filterLabel}>בחר סטטוס</label>
          <Select
            options={orderStatusFilterOptions}
            value={selectedOrderStatus}
            onChange={setSelectedOrderStatus}
            placeholder="בחר סטטוס"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={stylesObj.filterLabel}>בחר תאריך</label>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            style={stylesObj.dateInput}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={stylesObj.filterLabel}>סינון לפי מזהה</label>
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="הקלד מזהה..."
            style={{ ...stylesObj.dateInput, cursor: 'text' }}
          />
        </div>
        {(selectedCustomer.value !== 'all' || searchDate !== "" || selectedOrderStatus.value !== 'all' || searchId !== "") && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              style={{ ...stylesObj.resetButton, marginTop: '28px' }}
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
        <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)', color: '#6B7280', fontSize: '18px', fontWeight: '500', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px', color: '#D1D5DB' }}>📭</div>
          <p>לא נמצאו הזמנות עבור סינון זה</p>
          <button
            style={stylesObj.resetButton}
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
          <div style={stylesObj.tableContainer}>
            <table style={stylesObj.table}>
              <thead style={stylesObj.tableHeader}>
                <tr>
                  <th style={stylesObj.tableHeaderCell}>שם לקוח</th>
                  <th style={stylesObj.tableHeaderCell}>סטטוס</th>
                  <th
                    style={{ ...stylesObj.tableHeaderCell, cursor: 'pointer' }}
                    onClick={() => handleSort('date')}
                  >
                    תאריך {sortField === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...stylesObj.tableHeaderCell, cursor: 'pointer' }}
                    onClick={() => handleSort('total')}
                  >
                    סה"כ {sortField === 'total' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={stylesObj.tableHeaderCell}>PDF</th>
                  <th style={stylesObj.tableHeaderCell}>לקיטה</th>
                  <th style={{ ...stylesObj.tableHeaderCell, width: '60px' }}></th>
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
                          ...stylesObj.tableRow,
                          ...(index % 2 === 1 ? stylesObj.tableRowEven : {}),
                          backgroundColor: isExpanded ? '#EFF6FF' : undefined
                        }}
                        onClick={() => toggleExpand(orderId)}
                      >
                        <td style={stylesObj.tableCell}>
                          <div style={{ fontWeight: '600', color: '#1E293B' }}>
                            {customer ? customer.name : order.customerId}
                          </div>
                          <div style={{ fontSize: '13px', color: '#6B7280' }}>
                            מזהה: {hashCode(orderId)}
                          </div>
                        </td>
                        <td style={stylesObj.tableCell}>
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
                                style={stylesObj.saveStatusButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(orderId, editingStatus[orderId].value);
                                }}
                              >
                                שמור
                              </button>
                              <button
                                style={stylesObj.cancelStatusButton}
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
                                  order.status === 'הזמנה חדשה' ? '#EDE9FE' :
                                  order.status === 'סופקה במלואה' ? '#D1FAE5' :
                                  order.status === 'ממתינה למשלוח' ? '#FEF3C7' :
                                  order.status === 'הזמנה בוטלה' ? '#FEE2E2' :
                                  order.status === 'סופקה חלקית' ? '#DBEAFE' :
                                  order.status === 'ממתינה לאישור הלקוח' ? '#EDE9FE' :
                                  order.status === 'ממתינה למשלוח לוקטה חלקית' ? '#A7F3D0' :
                                  order.status === 'הועבר ללקיטה' ? '#E9D5FF' :
                                  '#FEF3C7',
                                color:
                                  order.status === 'הזמנה חדשה' ? '#8B5CF6' :
                                  order.status === 'סופקה במלואה' ? '#10B981' :
                                  order.status === 'ממתינה למשלוח' ? '#D97706' :
                                  order.status === 'הזמנה בוטלה' ? '#EF4444' :
                                  order.status === 'סופקה חלקית' ? '#3B82F6' :
                                  order.status === 'ממתינה לאישור הלקוח' ? '#8B5CF6' :
                                  order.status === 'ממתינה למשלוח לוקטה חלקית' ? '#F97316' :
                                  order.status === 'הועבר ללקיטה' ? '#9333EA' :
                                  '#D97706'
                              }}>
                                {order.status || 'הזמנה חדשה'}
                              </span>
                              <button
                                style={stylesObj.editStatusButton}
                                onClick={() => {
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
                        <td style={stylesObj.tableCell}>
                          {new Date(order.date).toLocaleString('he-IL', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={stylesObj.tableCell}>
                          <div style={{ fontWeight: '600', color: '#1E293B' }}>
                            ₪{totalPrice.toLocaleString()}
                          </div>
                          {order.items && (
                            <div style={{ fontSize: '13px', color: '#6B7280' }}>
                              {Object.keys(order.items).length} פריטים
                            </div>
                          )}
                        </td>
                        <td style={stylesObj.tableCell}>
                          <ExportToPdfButton
                            data={exportSingleOrderData(orderId)}
                            fileName={`online_order_${hashCode(orderId)}_export`}
                            title="order"
                            style={stylesObj.pdfButtonStyle}
                          />
                        </td>
                        <td style={stylesObj.tableCell}>
                          {order.status === 'הזמנה חדשה' && (
                            <button
                              style={stylesObj.transferButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTransferToPickup(orderId);
                              }}
                            >
                              העבר ללקיטה
                            </button>
                          )}
                        </td>
                        <td style={stylesObj.tableCell}>
                          <button style={stylesObj.actionButton}>
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="7" style={{ padding: 0, borderBottom: '1px solid #E5E7EB' }}>
                            <div style={stylesObj.expandedContainer}>
                              {order.items && Object.keys(order.items).length > 0 ? (
                                <>
                                  {Object.entries(order.items).map(([productId, item]) => {
                                    const product = products[productId];
                                    const isChildEditing = childEditMode[orderId] && childEditMode[orderId][productId];
                                    return (
                                      <div key={productId} style={stylesObj.productDetail}>
                                        <div style={stylesObj.productName}>
                                          {product ? product.name : productId}
                                          {product && (
                                            <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 'normal' }}>
                                              ₪{product.price.toLocaleString()} ליחידה
                                            </div>
                                          )}
                                        </div>
                                        {isChildEditing ? (
                                          <div onClick={(e) => e.stopPropagation()} style={stylesObj.inputGroup}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                              <span style={stylesObj.inputLabel}>נדרש:</span>
                                              <input
                                                type="text"
                                                value={editedItems[orderId]?.[productId]?.required ?? item.required}
                                                onChange={(e) => handleItemChange(orderId, productId, "required", Number(e.target.value) || 0)}
                                                style={stylesObj.quantityInput}
                                              />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                              <span style={stylesObj.inputLabel}>נלקט:</span>
                                              <div style={stylesObj.quantityControl}>
                                                <button
                                                  style={stylesObj.quantityButton}
                                                  onClick={() => handleDecrease(orderId, productId)}
                                                >
                                                  -
                                                </button>
                                                <input
                                                  type="text"
                                                  value={editedItems[orderId]?.[productId]?.picked ?? item.picked}
                                                  onChange={(e) => handleQuantityChange(orderId, productId, e.target.value)}
                                                  style={stylesObj.quantityInput}
                                                />
                                                <button
                                                  style={stylesObj.quantityButton}
                                                  onClick={() => handleIncrease(orderId, productId)}
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                              <span style={stylesObj.inputLabel}>הערה:</span>
                                              <input
                                                type="text"
                                                value={editedItems[orderId]?.[productId]?.comment ?? (item.comment || "")}
                                                onChange={(e) => handleCommentChange(orderId, productId, e.target.value)}
                                                style={stylesObj.commentInput}
                                                placeholder="הוסף הערה..."
                                              />
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                              <button
                                                style={stylesObj.saveItemButton}
                                                onClick={() => handleSaveItem(orderId, productId)}
                                              >
                                                שמור
                                              </button>
                                              <button
                                                style={stylesObj.cancelStatusButton}
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
                                              style={stylesObj.editStatusButton}
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

          <div style={stylesObj.paginationContainer}>
            <button
              style={{
                ...stylesObj.paginationButton,
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
                  ...stylesObj.paginationButton,
                  ...(currentPage === idx + 1 ? stylesObj.activePage : {})
                }}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              style={{
                ...stylesObj.paginationButton,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              הבא
            </button>
          </div>

          <div style={stylesObj.exportContainer}>
            <ExportToExcelButton
              data={exportDataForExcel}
              fileName="online_orders_export"
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
              data={exportDataForExcel}
              fileName="online_orders_export"
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
              {ordersArray.length <= 20 && (
            <ExportToPdfButton
              data={exportDataForExcel}
              fileName="online_orders_export"
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
            )}
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

export default ViewOnlineOrders;