// src/components/ExportToPdfButton.js
import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportToPdfButton = ({ data, fileName, title = '', signatureImage, label = 'ייצא ל-PDF' }) => {
  console.log("🚀 ~ ExportToPdfButton ~ signatureImage:", signatureImage)

  const tableRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExportPdf = async () => {
    if (!data || data.length === 0) {
      alert('אין נתונים לייצוא');
      return;
    }
    setIsLoading(true);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const headerHeight = 20;
    const footerHeight = 10;
    const safeBottomMM = 10;
    const contentStartY = margin + headerHeight;
    const usableHeightMM = pageH - contentStartY - footerHeight - safeBottomMM;
    const usableWidthMM = pageW - margin * 2;

    const pxPerMM = 96 / 25.4;
    const scale = 2;
    const chunkHpx = usableHeightMM * pxPerMM * scale;
    const targetWpx = usableWidthMM * pxPerMM;

    const dateStr = new Date().toLocaleDateString('he-IL', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    const container = tableRef.current;
    if (!container) {
      console.error('tableRef is not set');
      setIsLoading(false);
      return;
    }
    const prevWidth = container.style.width;
    container.style.width = `${targetWpx}px`;

    const sampleRow = container.querySelector('tbody tr');
    const rowHeightPx = sampleRow
      ? sampleRow.getBoundingClientRect().height * scale
      : chunkHpx;

    const rowsPerPage = Math.floor(chunkHpx / rowHeightPx) || 1;
    const totalRows = data.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const origTbodyHTML = container.querySelector('tbody').innerHTML;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      pdf.setFont('helvetica', 'normal').setFontSize(10);
      pdf.text(` ${dateStr}`, pageW - margin, margin, { align: 'right' });
      if (title) {
        pdf.setFont('helvetica', 'bold').setFontSize(16);
        pdf.text(title, pageW / 2, margin + 8, { align: 'center' });
      }

      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      const pageRows = data.slice(start, end);

      const tbody = container.querySelector('tbody');
      tbody.innerHTML = pageRows
        .map(row => `<tr>${Object.values(row)
          .map(val => `<td style="padding:8px;border:1px solid #ddd;text-align:right">${val}</td>`)
          .join('')}</tr>`)
        .join('');

      const canvasPage = await html2canvas(container, { scale });
      const imgData = canvasPage.toDataURL('image/png');
      const imgH_mm = (canvasPage.height / pxPerMM) / scale;
      pdf.addImage(imgData, 'PNG', margin, contentStartY, usableWidthMM, imgH_mm);

      if (signatureImage && page === totalPages - 1) {
        const sigWidthMM = 50;
        const sigHeightMM = 20;
        const x = margin;
        const y = pageH - footerHeight - safeBottomMM - sigHeightMM;
        pdf.addImage(signatureImage, 'PNG', x, y, sigWidthMM, sigHeightMM);
      }

      pdf.setFont('helvetica', 'normal').setFontSize(8);
      pdf.text(`page ${page + 1}`, pageW / 2, pageH - footerHeight - (safeBottomMM / 2), { align: 'center' });
    }

    container.querySelector('tbody').innerHTML = origTbodyHTML;
    container.style.width = prevWidth;

    pdf.save(`${fileName}.pdf`);
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={handleExportPdf}
        disabled={isLoading}
        style={{
          padding: '8px 16px', background: '#3498db', color: '#fff', border: 'none',
          borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'מייצא...' : label}
      </button>
      {/* hidden table for export */}
      <div
        ref={tableRef}
        style={{
          position: 'absolute', top: 0, left: '-10000px',
          width: 'auto', direction: 'rtl'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {data[0] && Object.keys(data[0]).map((col, i) => (
                <th key={i} style={{ padding: '8px', border: '1px solid #ddd', background: '#3498db', color: '#fff', textAlign: 'right' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? '#f8f9fa' : '#fff' }}>
                {Object.values(row).map((val, ci) => (
                  <td key={ci} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
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