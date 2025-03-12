// src/components/ViewOrdersTable.js
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { listenToOrders } from '../models/orderModel';
import { listenToProducts } from '../models/productModel';
import { listenToCustomers } from '../models/customerModel';

const ViewOrdersTable = () => {
  const [orders, setOrders] = useState({});
  const [customers, setCustomers] = useState({});
  const [products, setProducts] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState({ value: 'all', label: 'כל הלקוחות' });

  useEffect(() => {
    const unsubscribeOrders = listenToOrders(setOrders);
    const unsubscribeProducts = listenToProducts(setProducts);
    const unsubscribeCustomers = listenToCustomers(setCustomers);
    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, []);

  // הכנת אפשרויות ל-dropdown של לקוחות
  const customerOptions = [
    { value: 'all', label: 'כל הלקוחות' },
    ...Object.keys(customers).map(key => ({
      value: key,
      label: customers[key].name,
    })),
  ];

  // סינון ההזמנות לפי הלקוח הנבחר
  let filteredOrders = {};
  if (selectedCustomer.value === 'all') {
    filteredOrders = orders;
  } else {
    Object.keys(orders).forEach(orderId => {
      const order = orders[orderId];
      if (order.customerId === selectedCustomer.value) {
        filteredOrders[orderId] = order;
      }
    });
  }

  // מחשבים את קבוצת המזהים של כל המוצרים שהוזמנו בהזמנות המסוננות
  const orderedProductIds = new Set();
  Object.values(filteredOrders).forEach(order => {
    if (order.items) {
      Object.keys(order.items).forEach(productId => orderedProductIds.add(productId));
    }
  });
  const productColumns = Array.from(orderedProductIds);

  // ממיינים את העמודות לפי שם המוצר (אם קיים) או לפי מזהה
  productColumns.sort((a, b) => {
    const nameA = products[a]?.name || a;
    const nameB = products[b]?.name || b;
    return nameA.localeCompare(nameB);
  });

  return (
    <div>
      <h2>צפייה בהזמנות - טבלה</h2>
      <div style={{ marginBottom: '20px' }}>
        <label>בחר לקוח: </label>
        <div style={{ width: '300px', display: 'inline-block', marginLeft: '10px' }}>
          <Select
            options={customerOptions}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="הקלד או בחר לקוח..."
            isClearable={false}
          />
        </div>
      </div>
      {Object.keys(filteredOrders).length === 0 ? (
        <p>לא קיימות הזמנות עבור לקוח זה.</p>
      ) : (
        <table border="1" cellPadding="5" cellSpacing="0">
          <thead>
            <tr>
              <th>שם לקוח</th> 
              <th>מזהה הזמנה</th>        
              <th>תאריך</th>
              {productColumns.map(productId => (
                <th key={productId}>
                  {products[productId] ? products[productId].name : productId}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(filteredOrders).map(([orderId, order]) => {
              const customer = customers[order.customerId];
              return (
                <tr key={orderId}>
                  <td>{customer ? customer.name : order.customerId}</td>
                  <td>{orderId}</td>        
                  <td>{new Date(order.date).toLocaleString()}</td>
                  {productColumns.map(productId => (
                    <td key={productId}>
                      {order.items && order.items[productId]
                        ? order.items[productId].quantity
                        : 0}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewOrdersTable;
