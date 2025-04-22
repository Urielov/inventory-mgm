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

    // 1. הגדרות PDF ויחידות מ"מ ↔ פיקסלים (96dpi)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidthMM = pdf.internal.pageSize.getWidth();
    const pageHeightMM = pdf.internal.pageSize.getHeight();
    const marginMM = 10;
    const usableWidthMM = pageWidthMM - marginMM * 2;
    const usableHeightMM = pageHeightMM - marginMM * 2 - 10; // פחות מקום לכותרת ומספר עמוד
    const pxPerMM = 96 / 25.4;
    const targetWidthPx = usableWidthMM * pxPerMM;
    const usableHeightPx = usableHeightMM * pxPerMM;

    // 2. קובע רוחב קבוע לטבלה המוסתרת
    const container = tableRef.current;
    const prevWidth = container.style.width;
    container.style.width = `${targetWidthPx}px`;

    // 3. יוצא canvas ברזולוציה כפולה
    const canvas = await html2canvas(container, { scale: 2 });

    // 4. משיב רוחב ל־DOM
    container.style.width = prevWidth;

    // 5. חיתוך לקטעים בגובה העמוד
    const totalHeightPx = canvas.height;
    const chunkHeightPx = usableHeightPx * 2; // כי scale=2
    let yOffset = 0;
    let pageNum = 1;

    while (yOffset < totalHeightPx) {
      if (pageNum > 1) {
        pdf.addPage();
      }

      // א. כותרת בעמוד
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      if (title) {
        pdf.text(title, pageWidthMM / 2, marginMM, { align: 'center' });
      }

      // ב. חיתוך תמונה
      const canvasPage = document.createElement('canvas');
      canvasPage.width = canvas.width;
      const thisChunkPx = Math.min(chunkHeightPx, totalHeightPx - yOffset);
      canvasPage.height = thisChunkPx;
      const ctx = canvasPage.getContext('2d');
      ctx.drawImage(
        canvas,
        0, yOffset, canvas.width, thisChunkPx,
        0, 0, canvas.width, thisChunkPx
      );

      // ג. הוספת תמונה ל‑PDF
      const imgData = canvasPage.toDataURL('image/png');
      const imgHeightMM = (thisChunkPx / pxPerMM) / 2; // מחזירים למ"מ (scale=2 לכן חלק ב־2)
      pdf.addImage(
        imgData,
        'PNG',
        marginMM,
        marginMM + (title ? 5 : 0),
        usableWidthMM,
        imgHeightMM
      );

      // ד. מספר עמוד בתחתית
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(
        `page ${pageNum}`,
        pageWidthMM / 2,
        pageHeightMM - 5,
        { align: 'center' }
      );

      yOffset += thisChunkPx;
      pageNum++;
    }

    // 6. שמירה
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
              {Object.keys(data[0] || {}).map((col, idx) => (
                <th
                  key={idx}
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
            {data.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  background: rIdx % 2 === 0 ? '#f8f9fa' : '#fff',
                }}
              >
                {Object.values(row).map((val, cIdx) => (
                  <td
                    key={cIdx}
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
