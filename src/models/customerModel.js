// src/models/customerModel.js
import { db } from './firebase';
import { ref, push, get, query, orderByChild, equalTo, onValue } from 'firebase/database';

export const addCustomer = ({ name, phone1, phone2, email, address }) => {
  const customersRef = ref(db, 'customers');
  // שומרים את כל הפרטים כולל שני שדות טלפון
  return push(customersRef, { name, phone1, phone2, email, address });
};

export const getCustomerByName = (name) => {
  const customersRef = ref(db, 'customers');
  const q = query(customersRef, orderByChild('name'), equalTo(name));
  return get(q);
};

export const addOrderToCustomer = (customerKey, orderData) => {
  const ordersRef = ref(db, `customers/${customerKey}/orders`);
  return push(ordersRef, orderData);
};

export const listenToCustomers = (callback) => {
  const customersRef = ref(db, 'customers');
  const unsubscribe = onValue(customersRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return unsubscribe;
};
