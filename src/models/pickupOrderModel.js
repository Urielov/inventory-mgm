// src/models/pickupOrderModel.js
import { db } from './firebase';
import { ref, push, set, onValue, update, remove } from 'firebase/database';

// יצירת הזמנה חדשה ללקיטה בטבלת pickupOrders
export const createPickupOrder = (pickupData) => {
  const pickupRef = ref(db, 'pickupOrders');
  const newRef = push(pickupRef);
  return set(newRef, pickupData).then(() => newRef);
};

// האזנה לכל ההזמנות ללקיטה
export const listenToPickupOrders = (callback) => {
  const pickupRef = ref(db, 'pickupOrders');
  const unsubscribe = onValue(pickupRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return unsubscribe;
};

// עדכון הזמנה ללקיטה (למשל, הוספת/עדכון פריטים)
export const updatePickupOrder = (pickupOrderId, updatedData) => {
  const orderRef = ref(db, `pickupOrders/${pickupOrderId}`);
  return update(orderRef, updatedData);
};

// מחיקת הזמנה ללקיטה (אופציונלי, אם רוצים להסיר אותה אחרי סגירה)
export const removePickupOrder = (pickupOrderId) => {
  const orderRef = ref(db, `pickupOrders/${pickupOrderId}`);
  return remove(orderRef);
};
