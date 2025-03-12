// src/models/customerModel.js
import {db} from './firebase';

export const addCustomer = (name) => {
  return db.ref('customers').push({ name });
};

export const getCustomerByName = (name) => {
  return db.ref('customers').orderByChild('name').equalTo(name).once('value');
};

export const addOrderToCustomer = (customerKey, orderData) => {
  return db.ref(`customers/${customerKey}/orders`).push(orderData);
};

export const listenToCustomers = (callback) => {
  const ref = db.ref('customers');
  ref.on('value', (snapshot) => {
    callback(snapshot.val() || {});
  });
  return () => ref.off();
};
