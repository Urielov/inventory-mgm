// src/components/ExportToPdfButton.js
import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportToPdfButton = ({ data, fileName, title = '', label = 'ייצא ל-PDF' }) => {
  const tableRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const handleExportPdf = async () => {
    if (!data || data.length === 0) {
      alert("אין נתונים לייצוא");
      return;
    }
    setIsLoading(true);

    // 1. הגדרות PDF ופרמטרים
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const headerHeight = 20;
    const footerHeight = 10;
    const safeBottomMM = 10;
    const contentStartY = margin + headerHeight;
    const usableHeightMM = pageH - contentStartY - footerHeight - safeBottomMM;
    const usableWidthMM  = pageW - margin * 2;

    // 2. המרת מ"מ לפיקסלים + סקל
    const pxPerMM = 96 / 25.4;
    const scale   = 2;
    const chunkHpx = usableHeightMM * pxPerMM * scale;
    const targetWpx = usableWidthMM * pxPerMM;

    // 3. תאריך לכותרת
    const dateStr = new Date().toLocaleDateString('he-IL', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    // 4. קביעת רוחב לטבלה לצילום
    const container = tableRef.current;
    const prevWidth = container.style.width;
    container.style.width = `${targetWpx}px`;

    // 5. חשיפת שורה לדגימה כדי למדוד גובה שורה
    const sampleRow = container.querySelector('tbody tr');
    const rowHeightPx = sampleRow
      ? sampleRow.getBoundingClientRect().height * scale
      : chunkHpx;  // fallback במקרה של טבלה ריקה

    // 6. חישוב כמה שורות נכנסות בכל עמוד
    const rowsPerPage = Math.floor(chunkHpx / rowHeightPx) || 1;
    const totalRows = data.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    // שמירת תבנית ה-tbody המקורית
    const origTbodyHTML = container.querySelector('tbody').innerHTML;

    // 7. יצירת עמודים לפי שורות
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      // א) כותרת עליונה – תאריך וכותרת
      pdf.setFont('helvetica', 'normal').setFontSize(10);
      pdf.text(` ${dateStr}`, pageW - margin, margin, { align: 'right' });
      if (title) {
        pdf.setFont('helvetica', 'bold').setFontSize(16);
        pdf.text(title, pageW / 2, margin + 8, { align: 'center' });
      }

      // ב) קיזוז הנתונים לעמוד הנוכחי
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      const pageRows = data.slice(start, end);

      // ג) בניית tbody לדף הזה
      const tbody = container.querySelector('tbody');
      tbody.innerHTML = pageRows
        .map(row => `<tr>${Object.values(row)
          .map(val => `<td style="padding:8px;border:1px solid #ddd;text-align:right">${val}</td>`)
          .join('')}</tr>`)
        .join('');

      // ד) צילום הדף
      //    – מכיוון שב־tbody יש רק השורות שרוצות, html2canvas יצייר בדיוק את העמוד
      const canvasPage = await html2canvas(container, { scale });

      // ה) הוספת התמונה ל-PDF
      const imgData = canvasPage.toDataURL('image/png');
      const imgH_mm = (canvasPage.height / pxPerMM) / scale;
      pdf.addImage(imgData, 'PNG', margin, contentStartY, usableWidthMM, imgH_mm);

      // ו) מספר עמוד בתחתית
      const pageNum = page + 1;
      pdf.setFont('helvetica', 'normal').setFontSize(8);
      pdf.text(`page ${pageNum}`, pageW / 2, pageH - footerHeight - (safeBottomMM/2), { align: 'center' });
    }

    // 8. השבת tbody המקורי
    container.querySelector('tbody').innerHTML = origTbodyHTML;
    container.style.width = prevWidth;

    // 9. שמירה
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
                <th key={i} style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  background: '#3498db',
                  color: '#fff',
                  textAlign: 'right',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} style={{
                background: ri % 2 === 0 ? '#f8f9fa' : '#fff',
              }}>
                {Object.values(row).map((val, ci) => (
                  <td key={ci} style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    textAlign: 'right',
                  }}>
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
