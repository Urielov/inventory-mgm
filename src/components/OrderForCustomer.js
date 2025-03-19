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

  useEffect(() => {
    const unsubscribeCustomers = listenToCustomers(setCustomers);
    const unsubscribeProducts = listenToProducts(setProducts);
    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  const customerOptions = Object.keys(customers).map(key => ({
    value: key,
    label: customers[key].name,
  }));

  const productOptions = Object.keys(products).map(key => ({
    value: key,
    label: products[key].name,
    code: products[key].code,
  }));

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
      const quantity = parseInt(orderQuantity, 10);
      if (productData.stock < quantity) {
        alert('המלאי לא מספיק לביצוע ההזמנה.');
        return;
      }
      const newStock = productData.stock - quantity;
      await updateStock(productKey, newStock);

      const customerKey = selectedCustomer.value;
      const orderData = {
        customerId: customerKey,
        date: new Date().toISOString(),
        items: {
          [productKey]: {
            required: quantity, // הכמות שנדרשה
            picked: quantity    // הכמות שנלקטה (שווה לנדרש כי ההזמנה סופקה מיד)
          }
        },
        totalPrice: productData.price * quantity, // חישוב המחיר הכולל
        status: 'סופקה במלואה' // סטטוס ברירת מחדל עבור הזמנה ישירה
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

  // בודקים האם יש להדגיש את רכיב בחירת המוצר
  const isHighlighted = selectedProduct && parseInt(orderQuantity, 10) > 0;

  // הגדרת סגנונות מותנים לרכיב ה-Select
  const productSelectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: isHighlighted ? '#e0f7fa' : provided.backgroundColor,
      borderColor: isHighlighted ? '#26a69a' : provided.borderColor,
      boxShadow: isHighlighted ? '0 0 0 1px #26a69a' : provided.boxShadow,
      '&:hover': {
        borderColor: isHighlighted ? '#26a69a' : provided.borderColor,
      }
    })
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
              styles={productSelectStyles}
            />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>כמות להזמנה:</label>
          <input
            type="number"
            value={orderQuantity}
            onChange={(e) => setOrderQuantity(e.target.value)}
            required
            min="1"
          />
        </div>
        <button type="submit">בצע הזמנה</button>
      </form>
    </div>
  );
};

export default OrderForCustomer;