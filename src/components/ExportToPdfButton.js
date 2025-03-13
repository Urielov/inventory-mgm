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

    // מגדירים קנבס עם רזולוציה גבוהה
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // מייצרים מסמך PDF בגודל A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190; // הרוחב בעמוד A4
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // כותרת בראש המסמך
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(title, 105, 20, { align: "center" });

    // קו הפרדה
    pdf.setLineWidth(0.5);
    pdf.line(15, 25, 195, 25);

    // מוסיפים את הטבלה מהתמונה
    pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);

    // שומרים את הקובץ
    pdf.save(`${fileName}.pdf`);
  };

  return (
    <div>
      <button 
        onClick={handleExportPdf}
        style={{
          marginLeft: '10px',
          padding: '10px 20px',
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ייצוא ל-PDF
      </button>

      {/* טבלה מוסתרת שתשמש את `html2canvas` */}
      <div ref={tableRef} style={{ position: 'absolute', top: '-9999px', direction: 'rtl' }}>
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>{title}</h2>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'right',
          fontFamily: 'Arial, sans-serif'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#3498db', color: 'white' }}>
              {Object.keys(data[0] || {}).map((col, index) => (
                <th key={index} style={{ padding: '10px', border: '1px solid black' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? '#f8f9fa' : 'white' }}>
                {Object.keys(row).map((col, colIndex) => (
                  <td key={colIndex} style={{ padding: '10px', border: '1px solid black' }}>
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
