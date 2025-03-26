import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportToPdfButton = ({ data, fileName, title }) => {
  const contentRef = useRef();
  const [loading, setLoading] = useState(false);

  const handleExportPdf = async () => {
    if (!data || data.length === 0) {
      alert("אין נתונים לייצוא");
      return;
    }
    setLoading(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginLeft = 10;
      const marginRight = 10;
      const usableWidth = pageWidth - marginLeft - marginRight;
      const titleHeight = 10;
      const footerHeight = 5;

      let currentY = titleHeight + 2;
      let pageNumber = 1;

      for (let i = 0; i < data.length; i++) {
        const canvas = await html2canvas(contentRef.current.children[i], { scale: 2 });
        const scaleFactor = usableWidth / canvas.width;
        const imgHeight = canvas.height * scaleFactor;

        if (currentY + imgHeight > pageHeight - footerHeight && i > 0) {
          // הוספת מספור לעמוד הקודם לפני מעבר לעמוד חדש
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.text(`page ${pageNumber} from ${Math.ceil(data.length / 2)}`, pageWidth / 2, pageHeight - 2, { align: "center" });
          pdf.addPage();
          pageNumber++;
          currentY = titleHeight + 2;
        }

        if (currentY === titleHeight + 2) {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.text(title, pageWidth / 2, titleHeight / 2, { align: "center" });
          pdf.setLineWidth(0.2);
          pdf.line(marginLeft, titleHeight - 2, pageWidth - marginRight, titleHeight - 2);
        }

        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          marginLeft,
          currentY,
          usableWidth,
          imgHeight
        );

        currentY += imgHeight + 1;

        // הוספת מספור לעמוד האחרון
        if (i === data.length - 1) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.text(`page ${pageNumber} from ${Math.ceil(data.length / 2)}`, pageWidth / 2, pageHeight - 2, { align: "center" });
        }
      }

      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error(error);
      alert("אירעה שגיאה ביצירת הקובץ");
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#3498db',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const hoverStyle = {
    backgroundColor: '#2980b9',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  };

  const spinnerStyle = {
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    width: '12px',
    height: '12px',
    animation: 'spin 1s linear infinite',
  };

  const spinnerKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div>
      <style>{spinnerKeyframes}</style>
      <button
        onClick={handleExportPdf}
        style={buttonStyle}
        onMouseEnter={(e) => Object.assign(e.target.style, hoverStyle)}
        onMouseLeave={(e) => Object.assign(e.target.style, buttonStyle)}
        disabled={loading}
      >
        {loading ? (
          <div style={spinnerStyle} />
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
            ייצוא מיוחד ל-PDF
          </>
        )}
      </button>

      <div ref={contentRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', direction: 'rtl' }}>
        {data.map((row, rowIndex) => {
          const allColumns = Object.keys(row).filter(col => row[col] !== 0 && row[col] !== "0");
          const itemsPerRow = 2;
          const rows = [];
          for (let i = 0; i < allColumns.length; i += itemsPerRow) {
            rows.push(allColumns.slice(i, i + itemsPerRow));
          }

          return (
            <div
              key={rowIndex}
              style={{
                width: '390px',
                padding: '5px',
                marginBottom: '2px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e0e7ff',
                display: 'inline-block',
                verticalAlign: 'top',
                marginRight: rowIndex % 2 === 0 ? '5px' : '0',
              }}
            >
              {/* כותרת עם מספר סידורי */}
              <div
                style={{
                  backgroundColor: '#4b6584',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '12px',
                  fontWeight: '700',
                  textAlign: 'center',
                  margin: '-5px -5px 4px -5px',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                הזמנה #{rowIndex + 1}
              </div>

              {/* זוגות key-value */}
              <div style={{ padding: '0 4px' }}>
                {rows.map((rowCols, rowIdx) => (
                  <div
                    key={rowIdx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'nowrap',
                      padding: '2px 0',
                    }}
                  >
                    {rowCols.map((col, colIdx) => (
                      <div
                        key={colIdx}
                        style={{
                          display: 'flex',
                          flex: '1',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginRight: colIdx < rowCols.length - 1 ? '8px' : '0',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: '600',
                            fontSize: '10px',
                            color: '#2d3748',
                            padding: '2px 6px',
                            minWidth: '80px',
                            textAlign: 'right',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        >
                          {col}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#4a5568',
                            padding: '2px 6px',
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: '1',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        >
                          {row[col]}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExportToPdfButton;