// src/models/productModel.js
import { db } from './firebase';
import { ref, push, set, update, remove, query, orderByChild, equalTo, get, onValue } from 'firebase/database';

export const addProduct = ({ code, name, price, imageUrl }) => {
  const productsRef = ref(db, 'products');
  const newProductRef = push(productsRef); // יצירת מפתח אוטומטי
  return set(newProductRef, {
    code,
    name,
    price: parseFloat(price),
    stock: 0, // מתחילים עם מלאי 0
    imageUrl: imageUrl || null, // שמירת ה-URL של התמונה, null אם לא קיים
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

// עדכון מוצר כולל תמיכה ב-imageUrl
export const updateProduct = (productKey, updatedProduct) => {
  const productRef = ref(db, `products/${productKey}`);
  return update(productRef, {
    code: updatedProduct.code,
    name: updatedProduct.name,
    price: parseFloat(updatedProduct.price),
    stock: parseInt(updatedProduct.stock),
    imageUrl: updatedProduct.imageUrl || null, // תמיכה ב-URL של תמונה
  });
};

// מחיקת מוצר
export const deleteProduct = (productKey) => {
  const productRef = ref(db, `products/${productKey}`);
  return remove(productRef);
};