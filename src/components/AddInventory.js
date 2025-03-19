import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import BarcodeScanner from './BarcodeScanner'; // ודא שהנתיב נכון
import { updateStock, listenToProducts } from '../models/productModel';
// ייבוא קבצי הצליל מתוך תיקיית src
import successSound from '../assets/sounds/success.mp3';
import failureSound from '../assets/sounds/failure.mp3';

const AddInventory = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [barcodeInput, setBarcodeInput] = useState(''); // נצבור בו את קוד המוצר
  const [products, setProducts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // יצירת מופעי Audio מהקבצים המיובאים
  const successAudio = new Audio(successSound);
  const failureAudio = new Audio(failureSound);

  // מאזין לשינויים במוצרים מהדאטה-בייס
  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  // בניית אפשרויות ל-Select לפי המוצרים
  const productOptions = Object.keys(products).map((key) => ({
    value: key,
    label: `${products[key].name} - ${products[key].code}`,
    stock: products[key].stock || 0,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('נא לבחור מוצר');
      return;
    }
    if (!quantity || parseInt(quantity, 10) <= 0) {
      alert('נא להזין כמות חיובית');
      return;
    }

    setIsSubmitting(true);
    try {
      const productKey = selectedProduct.value;
      const productData = products[productKey];
      const currentStock = productData.stock || 0;
      const newStock = currentStock + parseInt(quantity, 10);
      await updateStock(productKey, newStock);
      alert('המלאי עודכן בהצלחה!');
      setSelectedProduct(null);
      setQuantity('');
    } catch (error) {
      console.error('Error updating inventory: ', error);
      alert('אירעה שגיאה בעדכון המלאי: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // טיפול בהדבקת טקסט – המשתמש לא יכול להקליד ידנית, אבל יכול להדביק או לסרוק
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    setBarcodeInput(pastedText);
  };

  // פונקציה שמעבדת את ערך הברקוד לאחר סריקה (או הדבקה) ולחיצה על Enter
  const processBarcode = (code) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // חיפוש מוצר לפי קוד
    const foundKey = Object.keys(products).find(
      (key) => products[key].code === trimmed
    );

    if (foundKey) {
      // אם כבר נבחר אותו מוצר – מגדיל את כמות ההוספה ב-1
      if (selectedProduct && selectedProduct.value === foundKey) {
        setQuantity((prev) => String((parseInt(prev, 10) || 0) + 1));
      } else {
        // בוחר את המוצר ומעדכן את הכמות ל-1
        setSelectedProduct({
          value: foundKey,
          label: `${products[foundKey].code} - ${products[foundKey].name}`,
          stock: products[foundKey].stock || 0,
        });
        setQuantity('1');
      }
      // מנגן צליל הצלחה
      successAudio.play();
    } else {
      // מנגן צליל כישלון
      failureAudio.play();
    }
  };

  // נריץ את processBarcode רק ב-Enter (ונבטל את ברירת המחדל של Enter)
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // מבטל את "submit" או ירידת השורה
      processBarcode(barcodeInput);
      setBarcodeInput(''); // איפוס השדה כדי לאפשר סריקה חוזרת
    }
  };

  const handleScanError = (error) => {
    console.error('Barcode scan error: ', error);
    if (error.name === 'NotAllowedError') {
      alert('נא לאשר גישה למצלמה בדפדפן');
    } else if (error.name === 'NotFoundError') {
      alert('לא נמצאה מצלמה במכשיר');
    } else {
      alert('שגיאה בסריקת הברקוד: ' + error.message);
    }
  };

  const handleBarcodeScan = (data) => {
    if (data) {
      // מצביע לכך שנסרק ברקוד במצלמה
      processBarcode(data);
      setShowScanner(false);
      setBarcodeInput('');
    }
  };

  const closeScanner = () => {
    setShowScanner(false);
  };

  // סגנונות CSS עבור AddInventory
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
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      fontWeight: 'bold',
      marginBottom: '8px',
      fontSize: '14px',
      color: '#2c3e50',
    },
    input: {
      padding: '10px 12px',
      borderRadius: '4px',
      border: '1px solid #dcdfe6',
      fontSize: '14px',
      width: '100%',
      boxSizing: 'border-box',
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
    disabledButton: {
      backgroundColor: '#95a5a6',
      cursor: 'not-allowed',
    },
    stockInfo: {
      fontSize: '14px',
      color: '#7f8c8d',
      marginTop: '8px',
    },
    currentStock: {
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    newStock: {
      fontWeight: 'bold',
      color: '#27ae60',
    },
  };

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#dcdfe6',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3498db' },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3498db'
        : state.isFocused
        ? '#ebf5fb'
        : null,
      color: state.isSelected ? 'white' : '#2c3e50',
      textAlign: 'right',
      direction: 'rtl',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  const currentStock = selectedProduct
    ? products[selectedProduct.value]?.stock || 0
    : 0;
  const newStock =
    quantity && selectedProduct
      ? currentStock + parseInt(quantity || 0, 10)
      : currentStock;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>הוספת מלאי</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>בחר מוצר:</label>
          <Select
            options={productOptions}
            value={selectedProduct}
            onChange={setSelectedProduct}
            placeholder="הקלד או בחר מוצר..."
            isClearable
            isDisabled={isSubmitting}
            styles={selectStyles}
          />
          {/* <button
            type="button"
            style={styles.button}
            onClick={() => setShowScanner(true)}
            disabled={isSubmitting}
            onMouseOver={(e) =>
              !isSubmitting && (e.target.style.backgroundColor = '#2980b9')
            }
            onMouseOut={(e) =>
              !isSubmitting && (e.target.style.backgroundColor = '#3498db')
            }
          >
            סרוק ברקוד
          </button> */}
          {selectedProduct && (
            <div style={styles.stockInfo}>
              מלאי נוכחי:{' '}
              <span style={styles.currentStock}>{currentStock}</span> יחידות
            </div>
          )}
        </div>

        {/* שדה קלט לקוד מוצר – מאפשר סריקה והדבקה. מעבדים רק ב-Enter */}
        <div style={styles.formGroup}>
          <label style={styles.label}>קוד מוצר (הדבקה/סריקה):</label>
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}  // מאזינים ל-Enter
            onPaste={handlePaste}
            placeholder="הדבק או סרוק קוד מוצר"
            style={styles.input}
            disabled={isSubmitting}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>כמות להוספה:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            min="1"
            style={styles.input}
            disabled={isSubmitting || !selectedProduct}
          />
          {selectedProduct && quantity && parseInt(quantity, 10) > 0 && (
            <div style={styles.stockInfo}>
              מלאי לאחר העדכון:{' '}
              <span style={styles.newStock}>{newStock}</span> יחידות
            </div>
          )}
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(isSubmitting ? styles.disabledButton : {}),
          }}
          disabled={
            isSubmitting ||
            !selectedProduct ||
            !quantity ||
            parseInt(quantity, 10) <= 0
          }
          onMouseOver={(e) =>
            !isSubmitting && (e.target.style.backgroundColor = '#2980b9')
          }
          onMouseOut={(e) =>
            !isSubmitting && (e.target.style.backgroundColor = '#3498db')
          }
        >
          {isSubmitting ? 'מעדכן...' : 'עדכן מלאי'}
        </button>
      </form>

      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeScan}
          onError={handleScanError}
          onClose={closeScanner}
        />
      )}
    </div>
  );
};

export default AddInventory;
