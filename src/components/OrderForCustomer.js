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
      // שלב 1: חיפוש מוצר לפי קוד
      const productSnapshot = await getProductByCode(productCode);
      if (!productSnapshot.exists()) {
        alert('לא נמצא מוצר עם קוד זה.');
        return;
      }
      let productKey;
      let productData;
      productSnapshot.forEach(child => {
        productKey = child.key;
        productData = child.val();
      });
      if (productData.stock < parseInt(orderQuantity, 10)) {
        alert('המלאי לא מספיק לביצוע ההזמנה.');
        return;
      }
      // שלב 2: עדכון מלאי
      const newStock = productData.stock - parseInt(orderQuantity, 10);
      await updateStock(productKey, newStock);

      // שלב 3: חיפוש לקוח לפי שם, או יצירת לקוח אם אינו קיים
      const customerSnapshot = await getCustomerByName(customerName);
      let customerKey;
      if (customerSnapshot.exists()) {
        customerSnapshot.forEach(child => {
          customerKey = child.key;
        });
      } else {
        const newCustomerRef = await addCustomer(customerName);
        customerKey = newCustomerRef.key;
      }
      
      // שלב 4: הוספת הזמנה ללקוח
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
    } catch (error) {
      console.error("Error processing order: ", error);
      alert("אירעה שגיאה בביצוע ההזמנה: " + error.message);
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
