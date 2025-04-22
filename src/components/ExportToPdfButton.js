// src/components/ExportToPdfButton.js
import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportToPdfButton = ({ data, fileName, title = '', label = 'ייצא ל‑PDF' }) => {
  const tableRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const handleExportPdf = async () => {
    if (!data || data.length === 0) {
      alert("אין נתונים לייצוא");
      return;
    }
    setIsLoading(true);

    // 1. הגדרות PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;                   // שוליים מכל צד
    const headerHeight = 20;             // מרווח לתאריך + כותרת
    const footerHeight = 10;             // מרווח למספר עמוד
    const safeBottomMM = 10;              // מרווח נוסף בתחתית כדי לא להגיע עד הסוף
    const contentStartY = margin + headerHeight;
    // באזור התוכן מנכים גם את ה‑safeBottomMM
    const usableHeightMM = pageH - contentStartY - footerHeight - safeBottomMM;
    const usableWidthMM  = pageW - margin * 2;

    // 2. המרת מ"מ לפיקסלים + סקל
    const pxPerMM   = 96 / 25.4;
    const scale     = 2;
    const usableHpx = usableHeightMM * pxPerMM;
    const chunkHpx  = usableHpx * scale;
    const targetWpx = usableWidthMM * pxPerMM;

    // 3. תאריך לכותרת
    const dateStr = new Date().toLocaleDateString('he-IL', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    // 4. קביעת רוחב לטבלה לצילום
    const container = tableRef.current;
    const prevWidth = container.style.width;
    container.style.width = `${targetWpx}px`;

    // 5. צילום ל‑canvas
    const canvas = await html2canvas(container, { scale });
    container.style.width = prevWidth;

    // 6. חלוקה לעמודים
    let yOffset = 0;
    let pageNum = 1;
    while (yOffset < canvas.height) {
      if (pageNum > 1) pdf.addPage();

      // א) תאריך מימין למעלה
      pdf.setFont('helvetica', 'normal').setFontSize(10);
      pdf.text(` ${dateStr}`, pageW - margin, margin, { align: 'right' });

      // ב) כותרת במרכז
      if (title) {
        pdf.setFont('helvetica', 'bold').setFontSize(16);
        pdf.text(title, pageW / 2, margin + 8, { align: 'center' });
      }

      // ג) חיתוך חתיכה בגובה מוגבל
      const sliceH = Math.min(chunkHpx, canvas.height - yOffset);
      const tmp = document.createElement('canvas');
      tmp.width  = canvas.width;
      tmp.height = sliceH;
      tmp.getContext('2d').drawImage(
        canvas,
        0, yOffset,
        canvas.width, sliceH,
        0, 0,
        canvas.width, sliceH
      );

      // ד) הוספת התמונה
      const imgData = tmp.toDataURL('image/png');
      const imgH_mm = (sliceH / pxPerMM) / scale;
      pdf.addImage(imgData, 'PNG', margin, contentStartY, usableWidthMM, imgH_mm);

      // ה) מספר עמוד בתחתית
      pdf.setFont('helvetica', 'normal').setFontSize(8);
      pdf.text(`page ${pageNum}`, pageW / 2, pageH - footerHeight - (safeBottomMM/2), { align: 'center' });

      yOffset += sliceH;
      pageNum++;
    }

    // 7. שמירה
    pdf.save(`${fileName}.pdf`);
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={handleExportPdf}
        disabled={isLoading}
        style={{
          padding: '8px 16px',
          background: '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'מייצא...' : label}
      </button>

      {/* הטבלה המוסתרת לצילום */}
      <div
        ref={tableRef}
        style={{
          position: 'absolute',
          top: 0,
          left: '-10000px',
          direction: 'rtl',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {Object.keys(data[0] || {}).map((col, i) => (
                <th
                  key={i}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    background: '#3498db',
                    color: '#fff',
                    textAlign: 'right',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  background: ri % 2 === 0 ? '#f8f9fa' : '#fff',
                }}
              >
                {Object.values(row).map((val, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      textAlign: 'right',
                    }}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ExportToPdfButton;
