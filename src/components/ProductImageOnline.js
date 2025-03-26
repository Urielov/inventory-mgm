import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const ProductImageOnline = ({ imageUrl, productName, isEditable = false, onImageUpdate }) => {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const toggleEnlarge = () => {
    setIsEnlarged(!isEnlarged);
    if (!isEnlarged) {
      setNewImageFile(null);
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImageToImgBB = async () => {
    if (!newImageFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', newImageFile);
    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=YOUR_API_KEY_HERE`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      if (data.success) {
        const newUrl = data.data.url;
        onImageUpdate(newUrl);
        setIsEnlarged(false);
        setNewImageFile(null);
        setPreviewUrl(null);
      } else {
        throw new Error(data.error?.message || 'שגיאה בהעלאה');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('שגיאה בהעלאת התמונה: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
    },
    thumbnail: {
      width: '200px',
      height: '200px',
      objectFit: 'contain',
      borderRadius: '16px',
      cursor: 'pointer',
      border: '2px solid #e0e0e0',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    thumbnailHover: {
      transform: 'scale(1.05)',
      boxShadow: '0 8px 12px rgba(0,0,0,0.15)',
    },
    noImage: {
      width: '200px',
      height: '200px',
      borderRadius: '16px',
      border: '2px dashed #b0b0b0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      color: '#666',
      cursor: 'pointer',
      backgroundColor: '#f9f9f9',
      transition: 'background-color 0.3s ease',
    },
    noImageHover: {
      backgroundColor: '#f0f0f0',
    },
    enlargedContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      boxSizing: 'border-box',
    },
    enlargedImage: {
      maxWidth: '90%',
      maxHeight: '80vh',
      objectFit: 'contain',
      borderRadius: '20px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
    },
    fileInputContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '15px',
      marginTop: '20px',
    },
    fileInput: {
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      padding: '10px',
      border: '1px solid #ced4da',
      color: '#495057',
    },
    button: {
      padding: '12px 24px',
      backgroundColor: '#27ae60',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
    },
    buttonHover: {
      backgroundColor: '#2ecc71',
      transform: 'scale(1.05)',
    },
  };

  const [isHovered, setIsHovered] = useState(false);

  const modal = isEnlarged && ReactDOM.createPortal(
    <div 
      style={styles.enlargedContainer} 
      onClick={(e) => { if (e.target === e.currentTarget) toggleEnlarge(); }}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="תצוגה מקדימה" style={styles.enlargedImage} />
      ) : imageUrl ? (
        <img src={imageUrl} alt={productName} style={styles.enlargedImage} />
      ) : (
        <div style={styles.noImage}>ללא תמונה</div>
      )}
      {isEditable && (
        <div style={styles.fileInputContainer}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            style={styles.fileInput} 
          />
          {newImageFile && (
            <button 
              onClick={uploadImageToImgBB} 
              disabled={isUploading} 
              style={{
                ...styles.button,
                ...(isHovered ? styles.buttonHover : {})
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
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
    <div style={styles.container}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={productName}
          style={{
            ...styles.thumbnail,
            ...(isHovered ? styles.thumbnailHover : {})
          }}
          onClick={toggleEnlarge}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onError={(e) => (e.target.src = 'https://via.placeholder.com/200?text=ללא+תמונה')}
        />
      ) : (
        <div 
          style={{
            ...styles.noImage,
            ...(isHovered ? styles.noImageHover : {})
          }}
          onClick={toggleEnlarge}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          ללא תמונה
        </div>
      )}
      {modal}
    </div>
  );
};

export default ProductImageOnline;