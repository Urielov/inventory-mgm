// src/models/onlineOrderModel.js
import { db } from './firebase';
import { ref, push, set, onValue, update, query, orderByChild, equalTo, get } from 'firebase/database';

// יצירת הזמנה אונליין חדשה תחת הנתיב onlineOrders
export const createOnlineOrder = (orderData) => {
  const onlineOrdersRef = ref(db, 'onlineOrders');
  const newOnlineOrderRef = push(onlineOrdersRef);
  return set(newOnlineOrderRef, orderData).then(() => newOnlineOrderRef);
};

// האזנה לכל ההזמנות אונליין – ניתן להשתמש להצגה או לניהול
export const listenToOnlineOrders = (callback) => {
  const onlineOrdersRef = ref(db, 'onlineOrders');
  const unsubscribe = onValue(onlineOrdersRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return unsubscribe;
};

// עדכון הזמנה אונליין (למשל שינוי סטטוס)
export const updateOnlineOrder = (orderId, updatedData) => {
  const onlineOrderRef = ref(db, `onlineOrders/${orderId}`);
  return update(onlineOrderRef, updatedData);
};

// קבלת כל ההזמנות של לקוח מסוים לפי מזהה לקוח
export const getOrdersByCustomer = (customerId) => {
  const onlineOrdersRef = ref(db, 'onlineOrders');
  const q = query(onlineOrdersRef, orderByChild('customerId'), equalTo(customerId));
  return get(q);
};
