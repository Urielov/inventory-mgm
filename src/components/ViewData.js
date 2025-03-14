// src/components/ViewData.js
import React, { useState, useEffect } from 'react';
import { listenToProducts, updateProduct } from '../models/productModel';
import ExportToExcelButton from './ExportToExcelButton';
import ExportToPdfButton from './ExportToPdfButton';
import ProductImage from './ProductImage';

const ViewData = () => {
  const [products, setProducts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});

  useEffect(() => {
    const unsubscribe = listenToProducts(setProducts);
    return () => unsubscribe();
  }, []);

  const filteredProducts = Object.keys(products).filter((key) => {
    const product = products[key];
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEdit = (key) => {
    setEditingId(key);
    setEditedProduct({ ...products[key] });
  };

  const handleImageUpdate = async (key, newImageUrl) => {
    const updatedProduct = { ...products[key], imageUrl: newImageUrl };
    await updateProduct(key, updatedProduct);
    setProducts((prev) => ({
      ...prev,
      [key]: updatedProduct,
    }));
    if (editingId === key) {
      setEditedProduct(updatedProduct);
    }
  };

  const handleSave = async (key) => {
    await updateProduct(key, editedProduct);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleChange = (field, value) => {
    setEditedProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const exportData = () => {
    return filteredProducts.map((key) => {
      const product = products[key];
      return {
        // id: key,
        "שם מוצר": product.name,
        "מזהה מוצר": product.code,
        "מחיר": product.price,
        "מלאי": product.stock,
        "כמות שהוזמנה": product.orderedQuantity || 0,
        // imageUrl: product.imageUrl || 'ללא תמונה',
      };
    });
  };

  const excelData = exportData();

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      direction: 'rtl',
      fontFamily: 'Rubik, Arial, sans-serif',
    },
    header: {
      fontSize: '28px',
      fontWeight: 'bold',
      margin: '0 0 24px 0',
      color: '#2c3e50',
      borderBottom: '2px solid #3498db',
      paddingBottom: '10px',
    },
    searchContainer: {
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
    },
    searchInput: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #dcdfe6',
      outline: 'none',
      width: '100%',
      maxWidth: '400px',
      fontSize: '15px',
      transition: 'all 0.3s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    productCount: {
      fontSize: '16px',
      color: '#7f8c8d',
      marginBottom: '16px',
      fontWeight: '500',
    },
    tableContainer: {
      overflowX: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      borderRadius: '8px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'right',
    },
    tableHeader: {
      backgroundColor: '#f8f9fa',
      color: '#2c3e50',
      padding: '14px 16px',
      fontWeight: '600',
      fontSize: '15px',
      textAlign: 'right',
      position: 'sticky',
      top: 0,
      boxShadow: '0 1px 0 0 #e0e0e0',
    },
    tableCell: {
      padding: '14px 16px',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '14px',
      verticalAlign: 'middle',
    },
    evenRow: {
      backgroundColor: 'white',
    },
    oddRow: {
      backgroundColor: '#f8fafc',
    },
    lowStock: {
      color: '#e74c3c',
      fontWeight: 'bold',
    },
    outOfStock: {
      color: 'white',
      backgroundColor: '#e74c3c',
      padding: '4px 8px',
      borderRadius: '4px',
      fontWeight: 'bold',
      display: 'inline-block',
    },
    buttonContainer: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
    },
    editButton: {
      padding: '6px 12px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s',
    },
    saveButton: {
      padding: '6px 12px',
      backgroundColor: '#2ecc71',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s',
    },
    cancelButton: {
      padding: '6px 12px',
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s',
    },
    inputEdit: {
      padding: '8px 10px',
      borderRadius: '4px',
      border: '1px solid #dcdfe6',
      width: '100%',
      fontSize: '14px',
      outline: 'none',
    },
    noProducts: {
      textAlign: 'center',
      padding: '40px',
      color: '#7f8c8d',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      fontSize: '16px',
    },
    priceValue: {
      fontWeight: '500',
      color: '#2c3e50',
    },
    tableRow: {
      transition: 'background-color 0.2s',
    },
    exportContainer: {
      marginTop: '20px',
      display: 'flex',
      gap: '10px',
    },
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
        <div style={styles.productCount}>
          סה"כ: <strong>{filteredProducts.length}</strong> מוצרים
        </div>
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
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>תמונה</th>
                <th style={styles.tableHeader}>שם מוצר</th>
                <th style={styles.tableHeader}>קוד מוצר</th>
                <th style={styles.tableHeader}>מחיר</th>
                <th style={styles.tableHeader}>מלאי</th>
                <th style={styles.tableHeader}>כמות שהוזמנה</th>
                <th style={styles.tableHeader}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((key, index) => {
                const product = products[key];
                const isEditing = editingId === key;
                return (
                  <tr
                    key={key}
                    style={{
                      ...(index % 2 === 0 ? styles.evenRow : styles.oddRow),
                      ...styles.tableRow,
                    }}
                  >
                    <td style={styles.tableCell}>
                      <ProductImage
                        imageUrl={product.imageUrl}
                        productName={product.name}
                        isEditable={true}
                        onImageUpdate={(newUrl) => handleImageUpdate(key, newUrl)}
                      />
                    </td>
                    <td style={styles.tableCell}>
                      {isEditing ? (
                        <input
                          style={styles.inputEdit}
                          value={editedProduct.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                        />
                      ) : (
                        product.name
                      )}
                    </td>
                    <td style={styles.tableCell}>
                      {isEditing ? (
                        <input
                          style={styles.inputEdit}
                          value={editedProduct.code}
                          onChange={(e) => handleChange('code', e.target.value)}
                        />
                      ) : (
                        product.code
                      )}
                    </td>
                    <td style={styles.tableCell}>
                      {isEditing ? (
                        <input
                          style={styles.inputEdit}
                          type="number"
                          value={editedProduct.price}
                          onChange={(e) => handleChange('price', Number(e.target.value))}
                        />
                      ) : (
                        <span style={styles.priceValue}>₪{Number(product.price).toLocaleString()}</span>
                      )}
                    </td>
                    <td style={styles.tableCell}>{product.stock}</td>
                    <td style={styles.tableCell}>{product.orderedQuantity || 0}</td>
                    <td style={styles.tableCell}>
                      <div style={styles.buttonContainer}>
                        {isEditing ? (
                          <>
                            <button style={styles.saveButton} onClick={() => handleSave(key)}>
                              שמור
                            </button>
                            <button style={styles.cancelButton} onClick={handleCancel}>
                              בטל
                            </button>
                          </>
                        ) : (
                          <button style={styles.editButton} onClick={() => handleEdit(key)}>
                            ערוך
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.exportContainer}>
        <ExportToExcelButton data={excelData} fileName="products_export" />
        <ExportToPdfButton data={excelData} fileName="products_export" title="products" />
      </div>
    </div>
  );
};

export default ViewData;
