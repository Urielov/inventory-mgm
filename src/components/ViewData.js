// src/components/ViewData.js
import React, { useState, useEffect } from 'react';
import { listenToProducts } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';

const ViewData = () => {
  const [products, setProducts] = useState({});
  const [customers, setCustomers] = useState({});

  useEffect(() => {
    const offProducts = listenToProducts(setProducts);
    const offCustomers = listenToCustomers(setCustomers);
    return () => {
      offProducts();
      offCustomers();
    };
  }, []);

  return (
    <div>
      <h2>מלאי מוצרים</h2>
      <ul>
        {Object.keys(products).length === 0 && <li>לא קיימים מוצרים.</li>}
        {Object.keys(products).map(key => (
          <li key={key}>
            <strong>{products[key].name}</strong> (קוד: {products[key].code}) – מחיר: {products[key].price} – מלאי: {products[key].stock}
          </li>
        ))}
      </ul>

      <h2>הזמנות לקוחות</h2>
      {Object.keys(customers).length === 0 && <p>לא קיימים לקוחות או הזמנות.</p>}
      {Object.keys(customers).map(custKey => (
        <div key={custKey}>
          <h3>{customers[custKey].name}</h3>
          {customers[custKey].orders ? (
            <ul>
              {Object.keys(customers[custKey].orders).map(orderKey => (
                <li key={orderKey}>
                  הזמנה עבור מוצר ID: {customers[custKey].orders[orderKey].productId} – כמות: {customers[custKey].orders[orderKey].quantity} – תאריך: {new Date(customers[custKey].orders[orderKey].date).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>אין הזמנות עבור לקוח זה.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ViewData;
