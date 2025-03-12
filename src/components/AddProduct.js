// src/components/AddProduct.js
import React, { useState } from 'react';
import { addProduct } from '../models/productModel';

const AddProduct = () => {
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = async (e) => {
    console.log("🚀 ~ handleSubmit ~ e:", e)
    e.preventDefault();
    try {
      await addProduct({ code: productCode, name: productName, price });
      alert('המוצר נוסף בהצלחה!');
      setProductCode('');
      setProductName('');
      setPrice('');
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  return (
    <div>
      <h2>הוספת מוצר</h2>
      <form onSubmit={handleSubmit}>
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
          <label>שם מוצר:</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>מחיר:</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <button type="submit">הוסף מוצר</button>
      </form>
    </div>
  );
};

export default AddProduct;
