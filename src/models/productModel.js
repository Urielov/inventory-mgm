// src/models/productModel.js
import { db } from './firebase';
import { ref, push, set, update, query, orderByChild, equalTo, get, onValue } from 'firebase/database';

export const addProduct = ({ code, name, price }) => {
  const productsRef = ref(db, 'products');
  const newProductRef = push(productsRef);
  return set(newProductRef, {
    code,
    name,
    price: parseFloat(price),
    stock: 0, // מתחילים עם מלאי 0
  });
};

export const updateStock = (productKey, newStock) => {
  const productRef = ref(db, `products/${productKey}`);
  return update(productRef, { stock: newStock });
};

export const getProductByCode = (code) => {
  const productsRef = ref(db, 'products');
  const q = query(productsRef, orderByChild('code'), equalTo(code));
  return get(q);
};

export const listenToProducts = (callback) => {
  const productsRef = ref(db, 'products');
  const unsubscribe = onValue(productsRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
  return unsubscribe;
};
