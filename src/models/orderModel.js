// src/models/orderModel.js
import { db } from './firebase';
import { ref, push, set, onValue, update } from 'firebase/database';

// יצירת הזמנה חדשה בטבלת orders (הזמנות סופיות)
export const createOrder = (orderData) => {
  const ordersRef = ref(db, 'orders');
  const newOrderRef = push(ordersRef);
  return set(newOrderRef, orderData).then(() => newOrderRef);
};

// האזנה לכל ההזמנות הסופיות (אם רוצים להציגן)
export const listenToOrders = (callback) => {
  const ordersRef = ref(db, 'orders');
  const unsubscribe = onValue(ordersRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return unsubscribe;
};

// עדכון הזמנה סופית (לא תמיד צריך)
export const updateOrder = (orderId, updatedData) => {
  const orderRef = ref(db, `orders/${orderId}`);
  return update(orderRef, updatedData);
};
