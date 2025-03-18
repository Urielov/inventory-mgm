import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import BarcodeReader from 'react-barcode-reader';
import { updateStock, listenToProducts } from '../models/productModel'; // התאם למודל שלך

const AddInventory = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [products, setProducts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const mediaStreamRef = useRef(null); // לשמירת זרם המצלמה
  const videoRef = useRef(null); // הפניה ל-video element

  // מאזין למוצרים מהדאטה-בייס
  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  // בניית אפשרויות ל-Select
  const productOptions = Object.keys(products).map((key) => ({
    value: key,
    label: `${products[key].code} - ${products[key].name}`,
    stock: products[key].stock || 0,
  }));

  // בקשת הרשאה ופתיחת המצלמה
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream; // חיבור הזרם ל-video element
        videoRef.current.play(); // התחלת השידור
      }
      console.log("Camera permission granted");
      setShowScanner(true);
    } catch (error) {
      console.error("Camera permission denied: ", error);
      alert("נדרשת הרשאה למצלמה כדי לסרוק ברקודים");
    }
  };

  // סגירת המצלמה
  const closeScanner = () => {
    if (mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getTracks();
      tracks.forEach((track) => track.stop()); // עצירת הזרם
      mediaStreamRef.current = null;
    }
    setShowScanner(false);
  };

  // טיפול בהגשת הטופס
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
      console.error("Error updating inventory: ", error);
      alert("אירעה שגיאה בעדכון המלאי: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // טיפול בשגיאות סריקה
  const handleScanError = (error) => {
    console.error("Barcode scan error: ", error);
    if (error.name === "NotAllowedError") {
      alert("נא לאשר גישה למצלמה בדפדפן");
    } else if (error.name === "NotFoundError") {
      alert("לא נמצאה מצלמה במכשיר");
    } else {
      alert("שגיאה בסריקת הברקוד: " + error.message);
    }
  };

  // טיפול בסריקת ברקוד
  const handleBarcodeScan = (data) => {
    if (data) {
      const foundKey = Object.keys(products).find((key) => products[key].code === data);
      if (foundKey) {
        const selected = {
          value: foundKey,
          label: `${products[foundKey].code} - ${products[foundKey].name}`,
          stock: products[foundKey].stock || 0,
        };
        setSelectedProduct(selected);
        closeScanner(); // סגירת הסורק לאחר סריקה מוצלחת
      } else {
        alert('המוצר לא נמצא עבור הברקוד: ' + data);
      }
    }
  };

  // סגנונות CSS
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
    scannerOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      zIndex: 10000,
      color: 'white',
    },
    scannerContainer: {
      width: '80%',
      maxWidth: '400px',
      position: 'relative',
    },
    video: {
      width: '100%',
      height: 'auto',
      borderRadius: '8px',
    },
    closeButton: {
      marginBottom: '20px',
      backgroundColor: '#e74c3c',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      color: 'white',
      cursor: 'pointer',
    },
  };

  // סגנונות ל-react-select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#dcdfe6',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3498db' },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3498db' : state.isFocused ? '#ebf5fb' : null,
      color: state.isSelected ? 'white' : '#2c3e50',
      textAlign: 'right',
      direction: 'rtl',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  // חישוב מלאי
  const currentStock = selectedProduct ? (products[selectedProduct.value]?.stock || 0) : 0;
  const newStock = quantity && selectedProduct ? currentStock + parseInt(quantity || 0, 10) : currentStock;

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
          <button
            type="button"
            style={styles.button}
            onClick={requestCameraPermission}
            disabled={isSubmitting}
            onMouseOver={(e) => !isSubmitting && (e.target.style.backgroundColor = '#2980b9')}
            onMouseOut={(e) => !isSubmitting && (e.target.style.backgroundColor = '#3498db')}
          >
            סרוק ברקוד
          </button>
          {selectedProduct && (
            <div style={styles.stockInfo}>
              מלאי נוכחי: <span style={styles.currentStock}>{currentStock}</span> יחידות
            </div>
          )}
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
              מלאי לאחר העדכון: <span style={styles.newStock}>{newStock}</span> יחידות
            </div>
          )}
        </div>

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(isSubmitting ? styles.disabledButton : {}),
          }}
          disabled={isSubmitting || !selectedProduct || !quantity || parseInt(quantity, 10) <= 0}
          onMouseOver={(e) => !isSubmitting && (e.target.style.backgroundColor = '#2980b9')}
          onMouseOut={(e) => !isSubmitting && (e.target.style.backgroundColor = '#3498db')}
        >
          {isSubmitting ? 'מעדכן...' : 'עדכן מלאי'}
        </button>
      </form>

      {showScanner && (
        <div style={styles.scannerOverlay}>
          <button
            style={styles.closeButton}
            onClick={closeScanner}
          >
            סגור סריקה
          </button>
          <div style={styles.scannerContainer}>
            <video ref={videoRef} style={styles.video} muted playsInline />
            <BarcodeReader
              onError={handleScanError}
              onScan={handleBarcodeScan}
              facingMode="environment"
              resolution={1280}
            />
          </div>
          <p>אנא כוון את הברקוד למרכז המסך</p>
        </div>
      )}
    </div>
  );
};

export default AddInventory;