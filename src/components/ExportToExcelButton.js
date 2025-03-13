import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExportToExcelButton = ({ data, fileName }) => {
  // data – מערך של אובייקטים, למשל [{ name: 'Product1', stock: 10 }, ...]
  // fileName – שם הקובץ (ללא סיומת) שנשמור

  const handleExportExcel = () => {
    // 1. ממירים את הנתונים (data) ל־Worksheet של xlsx
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // 2. יוצרים Workbook חדש ומוסיפים אליו את ה־Worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // 3. מייצרים Buffer/Blob מה־Workbook
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // 4. ממירים את ה־Buffer ל־Blob ושומרים
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName + '.xlsx');
    console.log("🚀 ~ handleExportExcel ~ blob:", blob)
  };

  return (
    <button onClick={handleExportExcel}>
      ייצוא לאקסל
    </button>
  );
};

export default ExportToExcelButton;
