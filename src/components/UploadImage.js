// src/components/UploadImage.js
import React, { useState } from 'react';

const UploadImage = ({ onImageUploaded }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const uploadImage = async () => {
    if (!file) {
      alert('בחר תמונה קודם!');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=d7186c4acd061cf1f55d294eb684e9fa`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();

      if (data.success) {
        const url = data.data.url;
        setImageUrl(url);
        onImageUploaded(url);
        alert('התמונה הועלתה בהצלחה!');
      } else {
        throw new Error('שגיאה בהעלאה');
      }
    } catch (error) {
      console.error('שגיאה:', error);
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* אפשרות לבחירת תמונה מהגלריה */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={styles.fileInput}
      />

      {/* אפשרות לצילום ישיר מהמצלמה (באמצעות המצלמה האחורית) */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={styles.fileInput}
      />

      <button onClick={uploadImage} disabled={uploading} style={styles.uploadButton}>
        {uploading ? 'מעלה...' : 'העלה תמונה'}
      </button>

      {imageUrl && (
        <div>
          <p>תמונה שהועלתה:</p>
          <img src={imageUrl} alt="Uploaded" style={styles.previewImage} />
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    direction: 'rtl',
    textAlign: 'right',
    padding: '20px',
  },
  fileInput: {
    margin: '10px 0',
    display: 'block',
  },
  uploadButton: {
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  previewImage: {
    maxWidth: '200px',
    marginTop: '10px',
  },
};

export default UploadImage;
