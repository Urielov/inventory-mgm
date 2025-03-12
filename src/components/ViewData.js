// src/components/ViewData.js
import React, { useState, useEffect } from 'react';
import { listenToProducts } from '../models/productModel';

const ViewData = () => {
  const [products, setProducts] = useState({});

  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h2>מלאי מוצרים</h2>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewData;
