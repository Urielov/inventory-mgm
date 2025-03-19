// src/models/productModel.js
import { db } from './firebase';
import { ref, push, set, update, remove, query, orderByChild, equalTo, get, onValue } from 'firebase/database';

// בעת יצירת מוצר חדש נוסיף גם orderedQuantity עם ערך התחלתי 0 וגם rejected עם ערך התחלתי 0
export const addProduct = ({ code, name, price, imageUrl }) => {
  const productsRef = ref(db, 'products');
  const newProductRef = push(productsRef); // יצירת מפתח אוטומטי
  return set(newProductRef, {
    code,
    name,
    price: parseFloat(price),
    stock: 0, // מתחילים עם מלאי 0
    orderedQuantity: 0, // מתחילים עם כמות מוזמנת 0
    rejected: 0, // מתחילים עם כמות מוצרים שנפסלו 0
    imageUrl: imageUrl || null, // שמירת ה-URL של התמונה, null אם לא קיים
  });
};

// updateStock יעדכן רק את המלאי (stock)
export const updateStock = (productKey, newStock) => {
  const productRef = ref(db, `products/${productKey}`);
  return update(productRef, { stock: newStock });
};

// פונקציה לעדכון orderedQuantity (הכמות הכוללת שהוזמנה)
export const updateOrderedQuantity = (productKey, newOrderedQuantity) => {
  const productRef = ref(db, `products/${productKey}`);
  return update(productRef, { orderedQuantity: newOrderedQuantity });
};

// פונקציה לעדכון rejected (כמות המוצרים שנפסלו)
export const updateRejectedQuantity = (productKey, newRejectedQuantity) => {
  const productRef = ref(db, `products/${productKey}`);
  return update(productRef, { rejected: newRejectedQuantity });
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

// עדכון מוצר כולל תמיכה ב-imageUrl, orderedQuantity וגם rejected
export const updateProduct = (productKey, updatedProduct) => {
  const productRef = ref(db, `products/${productKey}`);
  return update(productRef, {
    code: updatedProduct.code,
    name: updatedProduct.name,
    price: parseFloat(updatedProduct.price),
    stock: parseInt(updatedProduct.stock),
    orderedQuantity:
      updatedProduct.orderedQuantity !== undefined
        ? parseInt(updatedProduct.orderedQuantity)
        : 0,
    rejected:
      updatedProduct.rejected !== undefined
        ? parseInt(updatedProduct.rejected)
        : 0,
    imageUrl: updatedProduct.imageUrl || null, // תמיכה ב-URL של תמונה
  });
};

// מחיקת מוצר
export const deleteProduct = (productKey) => {
  const productRef = ref(db, `products/${productKey}`);
  return remove(productRef);
};
