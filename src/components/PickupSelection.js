import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToCustomers } from '../models/customerModel';
import { listenToProducts } from '../models/productModel';
import { createPickupOrder } from '../models/pickupOrderModel';
import { useNavigate } from 'react-router-dom';
import ProductImage from './ProductImage'; // ייבוא הקומפוננטה

const PickupSelection = () => {
  const [customers, setCustomers] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productFilter, setProductFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeCustomers = listenToCustomers(setCustomers);
    const unsubscribeProducts = listenToProducts(setProducts);
    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  const customerOptions = Object.keys(customers).map((key) => ({
    value: key,
    label: customers[key].name,
  }));

  const filteredProducts = Object.keys(products).filter((pid) => {
    const product = products[pid];
    const filterLower = productFilter.toLowerCase();
    return (
      product.name.toLowerCase().includes(filterLower) ||
      product.code.toLowerCase().includes(filterLower)
    );
  });

  const handleIncrease = (productId) => {
    const product = products[productId];
    if (!product) return;
    const currentQuantity = orderQuantities[productId] ? parseInt(orderQuantities[productId], 10) : 0;
    if (currentQuantity >= product.stock) {
      alert(`המלאי של המוצר "${product.name}" לא מספיק`);
      return;
    }
    setOrderQuantities((prev) => ({
      ...prev,
      [productId]: currentQuantity + 1,
    }));
  };

  const handleDecrease = (productId) => {
    setOrderQuantities((prev) => {
      const current = prev[productId] ? parseInt(prev[productId], 10) : 0;
      const newVal = current > 0 ? current - 1 : 0;
      return { ...prev, [productId]: newVal };
    });
  };

  const handleQuantityChange = (productId, value) => {
    const product = products[productId];
    if (!product) return;
    let numericValue = parseInt(value, 10) || 0;
    if (numericValue > product.stock) {
      alert(`המלאי של המוצר "${product.name}" לא מספיק. המלאי הקיים: ${product.stock}`);
      numericValue = product.stock;
    }
    setOrderQuantities((prev) => ({ ...prev, [productId]: numericValue }));
  };

  const validateOrder = () => {
    for (const [pid, qty] of Object.entries(orderQuantities)) {
      const quantity = parseInt(qty, 10) || 0;
      const product = products[pid];
      if (!product) continue;
      if (quantity > product.stock) {
        alert(`המלאי של המוצר "${product.name}" לא מספיק. נסה להזין כמות נמוכה יותר.`);
        return false;
      }
    }
    return true;
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

  const handleCreatePickup = async () => {
    if (!selectedCustomer) {
      alert('אנא בחר לקוח לפני שמירה');
      return;
    }
    const items = {};
    Object.entries(orderQuantities).forEach(([pid, qty]) => {
      const quantity = parseInt(qty, 10);
      if (quantity > 0) {
        items[pid] = { quantity };
      }
    });
    if (Object.keys(items).length === 0) {
      alert('לא נבחרו פריטים ללקיטה');
      return;
    }
    if (!validateOrder()) {
      return;
    }
    try {
      setIsSubmitting(true);
      const pickupData = {
        customerId: selectedCustomer.value,
        date: new Date().toISOString(),
        items,
        totalPrice: calculateTotalPrice(),
      };
      const newPickupRef = await createPickupOrder(pickupData);
      alert(`נוצרה הזמנת לקיטה חדשה (${newPickupRef.key})`);
      setSelectedCustomer(null);
      setOrderQuantities({});
      setProductFilter('');
      navigate('/confirm-pickup-order');
    } catch (error) {
      console.error('Error creating pickup order:', error);
      alert('שגיאה ביצירת הזמנת לקיטה');
    } finally {
      setIsSubmitting(false);
    }
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
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    selectContainer: {
      width: '100%',
      maxWidth: '200px',
      marginBottom: '20px',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E5E7EB',
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
    quantityControl: {
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #D1D5DB',
      borderRadius: '6px',
      overflow: 'hidden',
      width: 'fit-content',
      background: '#F9FAFB',
      margin: '0 auto',
    },
    quantityButton: {
      border: 'none',
      background: '#E5E7EB',
      color: '#1E293B',
      width: '36px',
      height: '36px',
      fontSize: '18px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    },
    quantityInput: {
      padding: '8px 0',
      border: 'none',
      borderLeft: '1px solid #D1D5DB',
      borderRight: '1px solid #D1D5DB',
      width: '50px',
      textAlign: 'center',
      fontSize: '15px',
      background: 'white',
      outline: 'none',
    },
    totalPrice: {
      margin: '20px 0',
      fontSize: '20px',
      fontWeight: '600',
      color: '#1E293B',
      textAlign: 'right',
      padding: '15px',
      background: '#F8FAFC',
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
    },
    noResults: {
      textAlign: 'center',
      padding: '30px',
      color: '#6B7280',
      fontSize: '16px',
      fontWeight: '500',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📦 יצירת הזמנת לקיטה</h2>
      <div style={styles.selectContainer}>
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
              '&:hover': { borderColor: '#9CA3AF' },
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
      {selectedCustomer && (
        <>
          <div style={styles.filterContainer}>
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
                <thead>
                  <tr>
                    <th style={styles.th}>תמונה</th> {/* עמודה חדשה */}
                    <th style={styles.th}>שם מוצר</th>
                    <th style={styles.th}>מק"ט</th>
                    <th style={styles.th}>מחיר</th>
                    <th style={styles.th}>מלאי</th>
                    <th style={styles.th}>כמות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((pid) => {
                    const product = products[pid];
                    const quantity = orderQuantities[pid] !== undefined ? orderQuantities[pid] : 0;
                    const isSelected = quantity > 0;

                    return (
                      <tr
                        key={pid}
                        style={{
                          transition: 'all 0.2s ease',
                          backgroundColor: isSelected ? '#DFFDDF' : 'transparent',
                          borderRight: isSelected ? '4px solid #3B82F6' : 'none',
                          transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                        }}
                      >
                        <td style={styles.td}>
                          <ProductImage
                            imageUrl={product.imageUrl}
                            productName={product.name}
                            isEditable={false} // לא ניתן לערוך כאן
                            onImageUpdate={() => {}} // פונקציה ריקה כי אין עריכה
                          />
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '600', color: '#1E293B' }}>{product.name}</div>
                        </td>
                        <td style={styles.td}>{product.code}</td>
                        <td style={styles.td}>₪{Number(product.price).toLocaleString()}</td>
                        <td style={styles.td}>
  {product.stock === 0 ? (
    <span
      style={{
        padding: '4px 8px',
        borderRadius: '12px',
        background: '#FEE2E2',
        color: '#EF4444',
        fontSize: '13px',
        fontWeight: '600',
      }}
    >
      אזל מהמלאי
    </span>
  ) : (
    <span
      style={{
        padding: '4px 8px',
        borderRadius: '12px',
        background: product.stock > 0 ? '#D1FAE5' : '#FEE2E2',
        color: product.stock > 0 ? '#10B981' : '#EF4444',
        fontSize: '13px',
      }}
    >
      {product.stock}
    </span>
  )}
</td>
                        <td style={styles.td}>
                          <div style={styles.quantityControl}>
                            <button
                              style={styles.quantityButton}
                              onClick={() => handleDecrease(pid)}
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
                              style={styles.quantityButton}
                              onClick={() => handleIncrease(pid)}
                              disabled={quantity >= product.stock}
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
              <div style={styles.noResults}>
                לא נמצאו מוצרים התואמים לחיפוש "{productFilter}"
              </div>
            )}
          </div>
          <div style={styles.totalPrice}>
            סה"כ מחיר: ₪{Number(calculateTotalPrice()).toLocaleString()}
          </div>
          <button
            onClick={handleCreatePickup}
            style={isSubmitting ? styles.disabledButton : styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    border: '3px solid #fff',
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginLeft: '8px',
                  }}
                ></span>
                שומר...
              </>
            ) : (
              <>
               
                שמור הזמנת לקיטה
              </>
            )}
          </button>
        </>
      )}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .tableContainer {
              margin: '0 -30px 30px -30px';
              border-radius: 0;
            }
            .th, .td {
              padding: 12px 10px;
            }
            .selectContainer, .filterContainer {
              max-width: 100%;
            }
          }
          @media (max-width: 480px) {
            .container {
              padding: 15px;
            }
            .quantityControl {
              transform: scale(0.9);
            }
          }
          .button:hover {
            background: #2563EB;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
          .quantityButton:hover {
            background: #D1D5DB;
          }
          .quantityButton:disabled {
            background: #E5E7EB;
            color: #9CA3AF;
            cursor: not-allowed;
          }
          tr:hover {
            background-color: #F0F7FF;
          }
          .filterInput:focus {
            border-color: #3B82F6;
          }
          .filterInput:hover {
            border-color: #9CA3AF;
          }
        `}
      </style>
    </div>
  );
};

export default PickupSelection;