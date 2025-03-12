// src/components/ViewCustomerOrders.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToCustomers } from '../models/customerModel';
import { listenToProducts } from '../models/productModel';

const ViewCustomerOrders = () => {
  const [customers, setCustomers] = useState({});
  const [products, setProducts] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState({ value: 'all', label: 'כל הלקוחות' });

  useEffect(() => {
    const unsubscribeCustomers = listenToCustomers(setCustomers);
    const unsubscribeProducts = listenToProducts(setProducts);
    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  // יצירת רשימת אפשרויות ל-dropdown
  const customerOptions = [
    { value: 'all', label: 'כל הלקוחות' },
    ...Object.keys(customers).map(key => ({
      value: key,
      label: customers[key].name,
    }))
  ];

  // מסנן לקוחות לפי הבחירה
  const filteredCustomers =
    selectedCustomer.value === 'all'
      ? customers
      : { [selectedCustomer.value]: customers[selectedCustomer.value] };

  return (
    <div>
      <h2>הזמנות לקוחות</h2>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ marginRight: '10px' }}>בחר לקוח: </label>
        <div style={{ width: '300px', display: 'inline-block' }}>
          <Select
            options={customerOptions}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="הקלד או בחר שם לקוח..."
          />
        </div>
      </div>
      {Object.keys(filteredCustomers).length === 0 ? (
        <p>לא נמצאו לקוחות התואמים לסינון.</p>
      ) : (
        Object.keys(filteredCustomers).map((custKey) => {
          const customer = filteredCustomers[custKey];
          return (
            <div
              key={custKey}
              style={{
                marginBottom: '20px',
                borderBottom: '1px solid #ccc',
                paddingBottom: '10px'
              }}
            >
              <h3>{customer.name}</h3>
              {customer.orders ? (
                <table border="1" cellPadding="5" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>מוצר</th>
                      <th>כמות</th>
                      <th>תאריך</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(customer.orders).map((orderKey) => {
                      const order = customer.orders[orderKey];
                      const productName =
                        products[order.productId] && products[order.productId].name
                          ? products[order.productId].name
                          : order.productId;
                      return (
                        <tr key={orderKey}>
                          <td>{productName}</td>
                          <td>{order.quantity}</td>
                          <td>{new Date(order.date).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p>אין הזמנות עבור לקוח זה.</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ViewCustomerOrders;
