import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { updateStock } from '../models/productModel';
import { listenToProducts } from '../models/productModel';

const AddInventory = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [products, setProducts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // מאזינים למוצרים
  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  // בניית אפשרויות ל-dropdown: כל אפשרות תציג את קוד המוצר ושמו
  const productOptions = Object.keys(products).map(key => ({
    value: key,
    label: `${products[key].code} - ${products[key].name}`,
    stock: products[key].stock || 0
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
      if (!productData) {
        alert('המוצר לא נמצא');
        return;
      }
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

  // CSS styles
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
    selectContainer: {
      marginBottom: '5px',
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
    buttonHover: {
      backgroundColor: '#2980b9',
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
    }
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#dcdfe6',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3498db',
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#95a5a6',
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
    })
  };

  // Calculate new stock if product and quantity are selected
  const currentStock = selectedProduct ? (products[selectedProduct.value]?.stock || 0) : 0;
  const newStock = quantity && selectedProduct ? currentStock + parseInt(quantity || 0, 10) : currentStock;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>הוספת מלאי</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>בחר מוצר:</label>
          <div style={styles.selectContainer}>
            <Select
              options={productOptions}
              value={selectedProduct}
              onChange={setSelectedProduct}
              placeholder="הקלד או בחר מוצר..."
              isClearable
              isDisabled={isSubmitting}
              styles={selectStyles}
            />
          </div>
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
            ...(isSubmitting ? styles.disabledButton : {})
          }}
          disabled={isSubmitting || !selectedProduct || !quantity || parseInt(quantity, 10) <= 0}
          onMouseOver={(e) => !isSubmitting && (e.target.style.backgroundColor = '#2980b9')}
          onMouseOut={(e) => !isSubmitting && (e.target.style.backgroundColor = '#3498db')}
        >
          {isSubmitting ? 'מעדכן...' : 'עדכן מלאי'}
        </button>
      </form>
    </div>
  );
};

export default AddInventory;