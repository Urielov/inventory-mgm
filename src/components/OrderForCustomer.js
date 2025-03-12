// src/components/OrderForCustomer.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { updateStock } from '../models/productModel';
import { listenToCustomers, addOrderToCustomer } from '../models/customerModel';
import { listenToProducts } from '../models/productModel';

const OrderForCustomer = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customers, setCustomers] = useState({});
  const [products, setProducts] = useState({});
  const [orderQuantity, setOrderQuantity] = useState('');

  // מאזינים לנתוני הלקוחות והמוצרים
  useEffect(() => {
    const unsubscribeCustomers = listenToCustomers(setCustomers);
    const unsubscribeProducts = listenToProducts(setProducts);
    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  // אפשרויות ל-dropdown עבור לקוחות – מציגים את שם הלקוח
  const customerOptions = Object.keys(customers).map(key => ({
    value: key,
    label: customers[key].name,
  }));

  // אפשרויות ל-dropdown עבור מוצרים – הערך (value) הוא המזהה, ה-label הוא שם המוצר, והקוד נשמר בשדה code
  const productOptions = Object.keys(products).map(key => ({
    value: key,
    label: products[key].name,
    code: products[key].code,
  }));

  // פונקציית סינון מותאמת – תבדוק את הקוד של המוצר ולא את השם
  const customFilterOption = (option, rawInput) => {
    return option.data.code.toLowerCase().includes(rawInput.toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert("יש לבחור לקוח");
      return;
    }
    if (!selectedProduct) {
      alert("יש לבחור מוצר");
      return;
    }
    try {
      const productKey = selectedProduct.value;
      const productData = products[productKey];
      if (!productData) {
        alert('לא נמצא מוצר.');
        return;
      }
      if (productData.stock < parseInt(orderQuantity, 10)) {
        alert('המלאי לא מספיק לביצוע ההזמנה.');
        return;
      }
      // עדכון מלאי
      const newStock = productData.stock - parseInt(orderQuantity, 10);
      await updateStock(productKey, newStock);

      // שימוש בלקוח שנבחר
      const customerKey = selectedCustomer.value;
      const orderData = {
        productId: productKey,
        quantity: parseInt(orderQuantity, 10),
        date: new Date().toISOString()
      };
      await addOrderToCustomer(customerKey, orderData);

      alert('ההזמנה בוצעה בהצלחה!');
      setSelectedCustomer(null);
      setSelectedProduct(null);
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
        <div style={{ marginBottom: '10px' }}>
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
        <div style={{ marginBottom: '10px' }}>
          <label>בחר מוצר (בהקלדת קוד):</label>
          <div style={{ width: '300px', marginTop: '5px' }}>
            <Select
              options={productOptions}
              value={selectedProduct}
              onChange={setSelectedProduct}
              placeholder="הקלד קוד מוצר..."
              isClearable
              filterOption={customFilterOption}
            />
          </div>
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
