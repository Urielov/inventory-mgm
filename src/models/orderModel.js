// src/models/orderModel.js
import { db } from './firebase';
import { ref, push, set, onValue } from 'firebase/database';

export const createOrder = ({ customerId, date, items }) => {
  const ordersRef = ref(db, 'orders');
  const newOrderRef = push(ordersRef);
  return set(newOrderRef, { customerId, date, items }).then(() => newOrderRef);
};

export const listenToOrders = (callback) => {
  const ordersRef = ref(db, 'orders');
  const unsubscribe = onValue(ordersRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return unsubscribe;
};
