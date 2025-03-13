import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExportToExcelButton = ({ data, fileName }) => {
  const handleExportExcel = () => {
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
  };

  // Button styles
  const buttonStyle = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#28a745', // Green color for an "export" feel
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px', // Space between text and potential icon
  };

  // Hover effect
  const hoverStyle = {
    backgroundColor: '#218838',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  };

  // Combine styles dynamically on hover
  const handleMouseEnter = (e) => {
    Object.assign(e.target.style, hoverStyle);
  };

  const handleMouseLeave = (e) => {
    Object.assign(e.target.style, buttonStyle);
  };

  return (
    <button
      onClick={handleExportExcel}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
      ייצוא לאקסל
    </button>
  );
};

export default ExportToExcelButton;