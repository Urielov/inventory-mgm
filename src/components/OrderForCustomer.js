// src/components/OrderForCustomer.js
import React, { useState } from 'react';
import { getProductByCode, updateStock } from '../models/productModel';
import { getCustomerByName, addCustomer, addOrderToCustomer } from '../models/customerModel';

const OrderForCustomer = () => {
  const [customerName, setCustomerName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // חיפוש מוצר לפי קוד
      const snapshot = await getProductByCode(productCode);
      if (snapshot.exists()) {
        let productKey;
        let productData;
        snapshot.forEach((child) => {
          productKey = child.key;
          productData = child.val();
        });
        if (productData.stock < parseInt(orderQuantity, 10)) {
          alert('המלאי לא מספיק לביצוע ההזמנה.');
          return;
        }
        // הפחתת מלאי
        const newStock = productData.stock - parseInt(orderQuantity, 10);
        await updateStock(productKey, newStock);
        
        // חיפוש לקוח לפי שם – אם לא קיים, יצירת לקוח חדש
        const customerSnapshot = await getCustomerByName(customerName);
        let customerKey;
        if (customerSnapshot.exists()) {
          customerSnapshot.forEach((child) => {
            customerKey = child.key;
          });
        } else {
          const newCustomerRef = await addCustomer(customerName);
          customerKey = newCustomerRef.key;
        }
        // הוספת הזמנה ללקוח
        const orderData = {
          productId: productKey,
          quantity: parseInt(orderQuantity, 10),
          date: new Date().toISOString()
        };
        await addOrderToCustomer(customerKey, orderData);
        alert('ההזמנה בוצעה בהצלחה!');
        setCustomerName('');
        setProductCode('');
        setOrderQuantity('');
      } else {
        alert('לא נמצא מוצר עם קוד זה.');
      }
    } catch (error) {
      console.error("Error processing order: ", error);
    }
  };

  return (
    <div>
      <h2>הזמנה ללקוח</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>שם לקוח:</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>קוד מוצר:</label>
          <input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            required
          />
        </div>
        <div>
          <label>כמות להזמנה:</label>
          <input
            type="number"
            value={orderQuantity}
            onChange={(e) => setOrderQuantity(e.target.value)}
            required
          />
        </div>
        <button type="submit">בצע הזמנה</button>
      </form>
    </div>
  );
};

export default OrderForCustomer;
