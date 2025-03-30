import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportToPdfButton = ({ data, fileName, title }) => {
  const tableRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const handleExportPdf = async () => {
    if (!data || data.length === 0) {
      alert("אין נתונים לייצוא");
      return;
    }
  
    setIsLoading(true);
    const input = tableRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 10;
    const marginRight = 10;
    const usableWidth = pageWidth - marginLeft - marginRight;
    const titleHeight = 15;
  
    // לכידת ה-header (חלק הכותרות של הטבלה)
    const headerElement = input.querySelector('thead');
    const headerCanvas = await html2canvas(headerElement, { scale: 2 });
    const headerImgData = headerCanvas.toDataURL('image/png');
    const headerImgHeight = (headerCanvas.height * usableWidth) / headerCanvas.width;
  
    const footerHeight = 10;
    // גובה פנוי לכל עמוד (כולל כותרת, header ותחתית)
    const availableHeight = pageHeight - titleHeight - headerImgHeight - footerHeight;
    const scaleFactor = usableWidth / canvas.width;
  
    // שימו לב: אנו מדלגים על החלק העליון (ה-header) שבתוך ה-canvas
    let currentY = headerCanvas.height;
    let pageNumber = 1;
  
    while (currentY < canvas.height) {
      if (pageNumber > 1) {
        pdf.addPage();
      }
  
      // הוספת כותרת (title) בכל עמוד
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(title, pageWidth / 2, 10, { align: "center" });
      pdf.setLineWidth(0.5);
      pdf.line(marginLeft, titleHeight - 2, pageWidth - marginRight, titleHeight - 2);
  
      // הוספת ה-header בכל עמוד
      pdf.addImage(headerImgData, 'PNG', marginLeft, titleHeight, usableWidth, headerImgHeight);
  
      // נקודת התחלה לתוכן מתחת לכותרת ול-header
      const offsetY = titleHeight + headerImgHeight + 2;
      const remainingCanvasHeight = canvas.height - currentY;
      const chunkHeight = Math.min(remainingCanvasHeight, availableHeight / scaleFactor);
  
      // יצירת קנבס זמני לעמוד הנוכחי
      const canvasPage = document.createElement('canvas');
      canvasPage.width = canvas.width;
      canvasPage.height = chunkHeight;
      const ctx = canvasPage.getContext('2d');
      ctx.drawImage(
        canvas,
        0, currentY, canvas.width, chunkHeight,
        0, 0, canvas.width, chunkHeight
      );
      const imgDataPage = canvasPage.toDataURL('image/png');
      const renderedImgHeight = chunkHeight * scaleFactor;
      pdf.addImage(imgDataPage, 'PNG', marginLeft, offsetY, usableWidth, renderedImgHeight);
  
      // הוספת מספר עמוד בתחתית
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(`page ${pageNumber}`, pageWidth / 2, pageHeight - 5, { align: "center" });
  
      currentY += chunkHeight;
      pageNumber++;
    }
  
    pdf.save(`${fileName}.pdf`);
    setIsLoading(false);
  };
  
  
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

  const handleMouseEnter = (e) => {
    if (!isLoading) Object.assign(e.target.style, hoverStyle);
  };

  const handleMouseLeave = (e) => {
    if (!isLoading) Object.assign(e.target.style, buttonStyle);
  };

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
    padding: '10px',
    border: '1px solid #ddd',
  };

  return (
    <div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <button
        onClick={handleExportPdf}
        style={{ ...buttonStyle, ...(isLoading ? loadingStyle : {}) }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div style={spinnerStyle}></div>
            מייצא...
          </>
        ) : (
          <>
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
          </>
        )}
      </button>

      <div ref={tableRef} style={{ position: 'absolute', top: '-9999px', direction: 'rtl' }}>
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