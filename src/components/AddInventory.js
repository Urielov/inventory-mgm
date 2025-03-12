// src/components/AddInventory.js
import React, { useState } from 'react';
import { getProductByCode, updateStock } from '../models/productModel';

const AddInventory = () => {
  const [productCode, setProductCode] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const snapshot = await getProductByCode(productCode);
      if (snapshot.exists()) {
        let productKey;
        let currentStock = 0;
        snapshot.forEach((child) => {
          productKey = child.key;
          currentStock = child.val().stock || 0;
        });
        const newStock = currentStock + parseInt(quantity, 10);
        await updateStock(productKey, newStock);
        alert('המלאי עודכן בהצלחה!');
        setProductCode('');
        setQuantity('');
      } else {
        alert('לא נמצא מוצר עם קוד זה.');
      }
    } catch (error) {
      console.error("Error updating inventory: ", error);
    }
  };

  return (
    <div>
      <h2>הוספת מלאי</h2>
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
          <label>כמות להוספה:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <button type="submit">עדכן מלאי</button>
      </form>
    </div>
  );
};

export default AddInventory;
