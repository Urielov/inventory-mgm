// src/components/ProductImage.js
import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const ProductImage = ({ imageUrl, productName, isEditable = false, onImageUpdate }) => {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // URL זמני לתצוגה מקדימה
  const [isUploading, setIsUploading] = useState(false); // מצב טעינה

  const toggleEnlarge = () => {
    setIsEnlarged(!isEnlarged);
    if (!isEnlarged) {
      setNewImageFile(null); // איפוס כשפותחים
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // יצירת URL זמני לתצוגה מקדימה
    }
  };

  const uploadImageToImgBB = async () => {
    if (!newImageFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', newImageFile);

    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=d7186c4acd061cf1f55d294eb684e9fa`, // החלף ב-API Key שלך
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      if (data.success) {
        const newUrl = data.data.url;
        onImageUpdate(newUrl); // מעביר את ה-URL החדש לרכיב האב
        setIsEnlarged(false); // סוגר את המודאל
        setNewImageFile(null);
        setPreviewUrl(null); // מאפס את התצוגה המקדימה
      } else {
        throw new Error(data.error?.message || 'שגיאה בהעלאת התמונה');
      }
    } catch (error) {
      console.error('שגיאה בהעלאה:', error);
      alert('שגיאה בהעלאת התמונה: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const styles = {
    thumbnail: {
      width: '50px',
      height: '50px',

      borderRadius: '4px',
      cursor: 'pointer',
      border: '1px solid #e9ecef',
    },
    noImage: {
      width: '50px',
      height: '50px',
      borderRadius: '4px',
      border: '1px dashed #e9ecef',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      color: '#7f8c8d',
      cursor: 'pointer',
      backgroundColor: '#f0f0f0',
    },
    enlargedContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      gap: '20px',
    },
    enlargedImage: {
      maxWidth: '90%',
      maxHeight: '70%',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    },
    noImageEnlarged: {
      width: '200px',
      height: '200px',
      borderRadius: '8px',
      border: '1px dashed #e9ecef',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      color: '#7f8c8d',
      backgroundColor: '#f0f0f0',
    },
    changeButton: {
      padding: '8px 16px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s',
    },
    changeButtonHover: {
      backgroundColor: '#2980b9',
    },
    fileInput: {
      padding: '8px',
      fontSize: '14px',
    },
  };

  // המודאל יוצא ל-Poratal כדי שיופיע על כל המסך
  const modal = isEnlarged && ReactDOM.createPortal(
    <div
      style={styles.enlargedContainer}
      onClick={(e) => {
        // סוגר את המודאל אם לוחצים מחוץ לתמונה
        if (e.target === e.currentTarget) {
          toggleEnlarge();
        }
      }}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="תצוגה מקדימה" style={styles.enlargedImage} />
      ) : imageUrl ? (
        <img src={imageUrl} alt={productName} style={styles.enlargedImage} />
      ) : (
        <div style={styles.noImageEnlarged}>ללא תמונה</div>
      )}
      {isEditable && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          {newImageFile && (
            <button
              disabled={isUploading}
              style={{
                ...styles.changeButton,
                opacity: isUploading ? 0.6 : 1,
                cursor: isUploading ? 'not-allowed' : 'pointer',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = styles.changeButtonHover.backgroundColor)}
              onMouseOut={(e) => (e.target.style.backgroundColor = styles.changeButton.backgroundColor)}
              onClick={uploadImageToImgBB}
            >
              {isUploading ? 'טוען...' : 'שמור תמונה'}
            </button>
          )}
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={productName}
          style={styles.thumbnail}
          onClick={toggleEnlarge}
          onError={(e) => (e.target.src = 'https://via.placeholder.com/50?text=No+Image')}
        />
      ) : (
        <div style={styles.noImage} onClick={toggleEnlarge}>
          ללא תמונה
        </div>
      )}
      {modal}
    </>
  );
};

export default ProductImage;
