import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportToPdfButton = ({ data, fileName, title }) => {
  const tableRef = useRef();

  const handleExportPdf = async () => {
    if (!data || data.length === 0) {
      alert("אין נתונים לייצוא");
      return;
    }

    const input = tableRef.current;

    // Create canvas with high resolution
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // Generate A4-sized PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190; // Width in A4 page
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Title at the top
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(title, 105, 20, { align: "center" });

    // Divider line
    pdf.setLineWidth(0.5);
    pdf.line(15, 25, 195, 25);

    // Add table image
    pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);

    // Save the file
    pdf.save(`${fileName}.pdf`);
  };

  // Button styles
  const buttonStyle = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#e74c3c', // Red color for PDF
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  // Hover effect
  const hoverStyle = {
    backgroundColor: '#c0392b',
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

  // Enhanced table styles
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'right',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  const thStyle = {
    padding: '12px',
    border: '1px solid #ddd',
    backgroundColor: '#3498db',
    color: 'white',
    fontWeight: '600',
  };

  const tdStyle = {
    padding: '12px',
    border: '1px solid #ddd',
  };

  return (
    <div>
      <button
        onClick={handleExportPdf}
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
        ייצוא ל-PDF
      </button>

      {/* Hidden table for html2canvas */}
      <div ref={tableRef} style={{ position: 'absolute', top: '-9999px', direction: 'rtl' }}>
        <h2 style={{ textAlign: "center", marginBottom: "15px", color: '#333', fontFamily: 'Arial, sans-serif' }}>
          {title}
        </h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              {Object.keys(data[0] || {}).map((col, index) => (
                <th key={index} style={thStyle}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? '#f8f9fa' : 'white' }}>
                {Object.keys(row).map((col, colIndex) => (
                  <td key={colIndex} style={tdStyle}>
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExportToPdfButton;