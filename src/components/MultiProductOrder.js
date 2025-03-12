// src/components/MultiProductOrder.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToProducts, updateStock } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';
import { createOrder } from '../models/orderModel';

const MultiProductOrder = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState({});
  const [products, setProducts] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});

  useEffect(() => {
    const unsubscribeCustomers = listenToCustomers(setCustomers);
    const unsubscribeProducts = listenToProducts(setProducts);
    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  // הכנת אפשרויות ל-dropdown עבור לקוחות
  const customerOptions = Object.keys(customers).map(key => ({
    value: key,
    label: customers[key].name,
  }));

  const handleQuantityChange = (productId, value) => {
    setOrderQuantities(prev => ({ ...prev, [productId]: value }));
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
      // בדיקה ועדכון מלאי לכל מוצר
      for (const [productId, item] of Object.entries(orderItems)) {
        const productData = products[productId];
        if (!productData) {
          alert(`לא נמצא מוצר עם מזהה ${productId}`);
          return;
        }
        if (productData.stock < item.quantity) {
          alert(`המלאי של המוצר "${productData.name}" לא מספיק`);
          return;
        }
      }
      // עדכון מלאי – עבור כל מוצר שיש בו הזמנה
      for (const [productId, item] of Object.entries(orderItems)) {
        const productData = products[productId];
        const newStock = productData.stock - item.quantity;
        await updateStock(productId, newStock);
      }

      // יצירת ההזמנה – רשומה אחת המכילה את כל הפריטים
      const orderData = {
        customerId: selectedCustomer.value,
        date: new Date().toISOString(),
        items: orderItems,
      };
      await createOrder(orderData);

      alert("ההזמנה בוצעה בהצלחה!");
      // איפוס בחירות
      setSelectedCustomer(null);
      setOrderQuantities({});
    } catch (error) {
      console.error("Error processing multi-product order: ", error);
      alert("אירעה שגיאה בביצוע ההזמנה: " + error.message);
    }
  };

  return (
    <div>
      <h2>הזמנה ללקוח - הזמנה מרובת מוצרים</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label>בחר לקוח:</label>
          <div style={{ width: '300px', marginTop: '5px' }}>
            <Select
              options={customerOptions}
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              placeholder="הקלד או בחר לקוח..."
              isClearable
            />
          </div>
        </div>
        <h3>רשימת מוצרים</h3>
        {Object.keys(products).length === 0 ? (
          <p>לא קיימים מוצרים.</p>
        ) : (
          <table border="1" cellPadding="5" cellSpacing="0">
            <thead>
              <tr>
                <th>שם מוצר</th>
                <th>קוד מוצר</th>
                <th>מחיר</th>
                <th>מלאי</th>
                <th>כמות להזמנה</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(products).map(key => {
                const product = products[key];
                return (
                  <tr key={key}>
                    <td>{product.name}</td>
                    <td>{product.code}</td>
                    <td>{product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={orderQuantities[key] || ''}
                        onChange={(e) => handleQuantityChange(key, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: '20px' }}>
          <button type="submit">שלח הזמנה</button>
        </div>
      </form>
    </div>
  );
};

export default MultiProductOrder;
