// src/components/AddProduct.js
import React, { useState } from 'react';
import { addProduct } from '../models/productModel';
import ProductImage from './ProductImage'; // מייבאים את ProductImage במקום UploadImage

const AddProduct = () => {
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // state ל-URL של התמונה
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!productCode.trim()) errors.code = 'יש להזין קוד מוצר';
    if (!productName.trim()) errors.name = 'יש להזין שם מוצר';
    if (!price || parseFloat(price) <= 0) errors.price = 'יש להזין מחיר חיובי';
    // ניתן להוסיף בדיקה לתמונה במידת הצורך
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageUploaded = (url) => {
    setImageUrl(url); // עדכון ה-URL כשהתמונה מועלית
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await addProduct({
        code: productCode,
        name: productName,
        price: parseFloat(price),
        stock: 0,
        imageUrl: imageUrl || null, // שמירת ה-URL, או null אם אין תמונה
      });
      alert('המוצר נוסף בהצלחה!');
      // איפוס כל השדות
      setProductCode('');
      setProductName('');
      setPrice('');
      setImageUrl('');
      setFormErrors({});
    } catch (error) {
      console.error('Error adding product: ', error);
      alert('אירעה שגיאה בהוספת המוצר: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSS styles (ללא שינויים מהגרסה המקורית)
  const styles = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f7f9fc',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl',
    },
    header: {
      color: '#2c3e50',
      borderBottom: '2px solid #3498db',
      paddingBottom: '10px',
      marginBottom: '20px',
      textAlign: 'center',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    label: {
      fontWeight: 'bold',
      fontSize: '14px',
      color: '#2c3e50',
    },
    input: {
      padding: '10px 12px',
      borderRadius: '4px',
      border: '1px solid #dcdfe6',
      fontSize: '14px',
      transition: 'border-color 0.2s',
      outline: 'none',
    },
    errorInput: {
      borderColor: '#e74c3c',
      backgroundColor: '#fef5f5',
    },
    errorMessage: {
      color: '#e74c3c',
      fontSize: '12px',
      marginTop: '4px',
    },
    button: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '12px',
      borderRadius: '4px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      marginTop: '10px',
    },
    buttonHover: {
      backgroundColor: '#2980b9',
    },
    disabledButton: {
      backgroundColor: '#95a5a6',
      cursor: 'not-allowed',
    },
    formHint: {
      fontSize: '12px',
      color: '#7f8c8d',
      marginTop: '2px',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>הוספת מוצר חדש</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>קוד מוצר:</label>
          <input
            type="text"
            value={productCode}
            onChange={(e) => {
              setProductCode(e.target.value);
              if (formErrors.code) {
                setFormErrors({ ...formErrors, code: null });
              }
            }}
            placeholder="הזן קוד מוצר ייחודי"
            style={{
              ...styles.input,
              ...(formErrors.code ? styles.errorInput : {}),
            }}
            disabled={isSubmitting}
          />
          {formErrors.code && <div style={styles.errorMessage}>{formErrors.code}</div>}
          <div style={styles.formHint}>הקוד צריך להיות ייחודי לכל מוצר</div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>שם מוצר:</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
              if (formErrors.name) {
                setFormErrors({ ...formErrors, name: null });
              }
            }}
            placeholder="הזן שם מוצר"
            style={{
              ...styles.input,
              ...(formErrors.name ? styles.errorInput : {}),
            }}
            disabled={isSubmitting}
          />
          {formErrors.name && <div style={styles.errorMessage}>{formErrors.name}</div>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>מחיר:</label>
          <input
            type="number"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              if (formErrors.price) {
                setFormErrors({ ...formErrors, price: null });
              }
            }}
            placeholder="הזן מחיר בש״ח"
            min="0.01"
            step="0.01"
            style={{
              ...styles.input,
              ...(formErrors.price ? styles.errorInput : {}),
            }}
            disabled={isSubmitting}
          />
          {formErrors.price && <div style={styles.errorMessage}>{formErrors.price}</div>}
          <div style={styles.formHint}>המחיר בש״ח</div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>תמונת מוצר:</label>
          {/* שימוש ב־ProductImage עם אפשרות עריכה */}
          <ProductImage
            imageUrl={imageUrl}
            productName={productName || 'מוצר חדש'}
            isEditable={true}
            onImageUpdate={handleImageUploaded}
          />
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(isSubmitting ? styles.disabledButton : {}),
          }}
          disabled={isSubmitting}
          onMouseOver={(e) => !isSubmitting && (e.target.style.backgroundColor = '#2980b9')}
          onMouseOut={(e) => !isSubmitting && (e.target.style.backgroundColor = '#3498db')}
        >
          {isSubmitting ? 'מוסיף מוצר...' : 'הוסף מוצר'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
