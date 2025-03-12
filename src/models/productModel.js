// src/models/productModel.js
import {db}  from './firebase';

export const addProduct = ({ code, name, price }) => {
  return db.ref('products').push({
    code,
    name,
    price: parseFloat(price),
    stock: 0, // מתחילים עם מלאי 0
  });
};

export const updateStock = (productKey, newStock) => {
  return db.ref(`products/${productKey}`).update({ stock: newStock });
};

export const getProductByCode = (code) => {
  return db.ref('products').orderByChild('code').equalTo(code).once('value');
};

export const listenToProducts = (callback) => {
  const ref = db.ref('products');
  ref.on('value', (snapshot) => {
    callback(snapshot.val() || {});
  });
  return () => ref.off();
};
