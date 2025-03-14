import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExportToExcelButton = ({ data, fileName }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExportExcel = () => {
    setIsLoading(true);
    
    // ניתן לעטוף ב-setTimeout קטן כדי לאפשר לעדכון ה-state להתבצע לפני הייצוא
    setTimeout(() => {
      // 1. Convert data to Worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // 2. Create a new Workbook and append the Worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
      // 3. Generate Buffer/Blob from Workbook
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
      // 4. Convert Buffer to Blob and save
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, fileName + '.xlsx');
      console.log("🚀 ~ handleExportExcel ~ blob:", blob);
      
      setIsLoading(false);
    }, 100);
  };

  // Button styles
  const buttonStyle = {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    direction: 'rtl'
  };

  const hoverStyle = {
    backgroundColor: '#2980b9',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  };

  const loadingStyle = {
    opacity: '0.8',
    cursor: 'not-allowed',
  };

  const spinnerStyle = {
    border: '2px solid #ffffff',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    animation: 'spin 1s linear infinite',
    marginLeft: '6px',
  };

  // Handle hover effects
  const handleMouseEnter = (e) => {
    if (!isLoading) Object.assign(e.target.style, hoverStyle);
  };

  const handleMouseLeave = (e) => {
    if (!isLoading) Object.assign(e.target.style, buttonStyle);
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <button
        onClick={handleExportExcel}
        style={{ ...buttonStyle, ...(isLoading ? loadingStyle : {}) }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isLoading}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16v16H4z" />
          <path d="M8 8h8v8H8z" />
          <path d="M12 16v4" />
          <path d="M10 18h4" />
        </svg>
        {isLoading ? (
          <>
            <span>מייצא...</span>
            <div style={spinnerStyle}></div>
          </>
        ) : (
          'ייצוא לאקסל'
        )}
      </button>
    </>
  );
};

export default ExportToExcelButton;
