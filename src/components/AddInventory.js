// src/components/AddInventory.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { updateStock } from '../models/productModel';
import { listenToProducts } from '../models/productModel';

const AddInventory = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [products, setProducts] = useState({});

  // מאזינים למוצרים
  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  // בניית אפשרויות ל-dropdown: כל אפשרות תציג את קוד המוצר ושמו
  const productOptions = Object.keys(products).map(key => ({
    value: key,
    label: `${products[key].code} - ${products[key].name}`,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('נא לבחור מוצר');
      return;
    }
    try {
      const productKey = selectedProduct.value;
      const productData = products[productKey];
      if (!productData) {
        alert('המוצר לא נמצא');
        return;
      }
      const currentStock = productData.stock || 0;
      const newStock = currentStock + parseInt(quantity, 10);
      await updateStock(productKey, newStock);
      alert('המלאי עודכן בהצלחה!');
      setSelectedProduct(null);
      setQuantity('');
    } catch (error) {
      console.error("Error updating inventory: ", error);
      alert("אירעה שגיאה בעדכון המלאי: " + error.message);
    }
  };

  return (
    <div>
      <h2>הוספת מלאי</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>בחר מוצר:</label>
          <div style={{ width: '300px', marginTop: '5px' }}>
            <Select
              options={productOptions}
              value={selectedProduct}
              onChange={setSelectedProduct}
              placeholder="הקלד או בחר מוצר..."
              isClearable
            />
          </div>
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
