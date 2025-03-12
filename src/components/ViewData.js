import React, { useState, useEffect } from 'react';
import { listenToProducts } from '../models/productModel';

const ViewData = () => {
  const [products, setProducts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  const filteredProducts = Object.keys(products).filter(key => {
    const product = products[key];
    return (
      product.name.includes(searchTerm) || 
      product.code.includes(searchTerm)
    );
  });

  // CSS styles
  const styles = {
    container: {
      maxWidth: '900px',
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
    searchContainer: {
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'flex-start',
    },
    searchInput: {
      padding: '8px 12px',
      borderRadius: '4px',
      border: '1px solid #dcdfe6',
      width: '250px',
      fontSize: '14px',
    },
    noProducts: {
      textAlign: 'center',
      padding: '20px',
      color: '#7f8c8d',
      backgroundColor: '#f9f9f9',
      borderRadius: '4px',
      border: '1px dashed #dcdfe6',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
    },
    tableHeader: {
      backgroundColor: '#3498db',
      color: 'white',
      textAlign: 'right',
      padding: '12px 15px',
      fontWeight: 'bold',
    },
    tableCell: {
      padding: '10px 15px',
      borderBottom: '1px solid #eaeaea',
      textAlign: 'right',
    },
    evenRow: {
      backgroundColor: '#f9f9f9',
    },
    oddRow: {
      backgroundColor: 'white',
    },
    lowStock: {
      color: '#e74c3c',
      fontWeight: 'bold',
    },
    productCount: {
      fontSize: '14px',
      color: '#7f8c8d',
      marginBottom: '10px',
      textAlign: 'right',
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>מלאי מוצרים</h2>
      
      <div style={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="חיפוש לפי שם או קוד מוצר" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>
      
      <div style={styles.productCount}>
        סה"כ: {filteredProducts.length} מוצרים
      </div>
      
      {Object.keys(products).length === 0 ? (
        <div style={styles.noProducts}>
          <p>לא קיימים מוצרים במערכת.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={styles.noProducts}>
          <p>לא נמצאו מוצרים התואמים לחיפוש.</p>
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>שם מוצר</th>
              <th style={styles.tableHeader}>קוד מוצר</th>
              <th style={styles.tableHeader}>מחיר</th>
              <th style={styles.tableHeader}>מלאי</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((key, index) => {
              const product = products[key];
              const isLowStock = product.stock < 5;
              
              return (
                <tr 
                  key={key} 
                  style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
                >
                  <td style={styles.tableCell}>{product.name}</td>
                  <td style={styles.tableCell}>{product.code}</td>
                  <td style={styles.tableCell}>₪{Number(product.price).toLocaleString()}</td>
                  <td style={{
                    ...styles.tableCell,
                    ...(isLowStock ? styles.lowStock : {})
                  }}>
                    {product.stock}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewData;