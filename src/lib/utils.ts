import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Transaction } from '@/types';

// Export to Excel
export const exportToExcel = (data: unknown[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export to PDF
export const exportToPDF = (data: unknown[], filename: string, columns: string[]) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(filename, 14, 22);
  
  // Add table
  const tableData = data.map(item => 
    columns.map(col => {
      const value = (item as Record<string, unknown>)[col];
      if (value instanceof Date) {
        return value.toLocaleDateString('id-ID');
      }
      if (typeof value === 'number') {
        return value.toLocaleString('id-ID', { 
          style: 'currency', 
          currency: 'IDR',
          minimumFractionDigits: 0
        });
      }
      return value;
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).autoTable({
    head: [columns],
    body: tableData,
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });

  doc.save(`${filename}.pdf`);
};

// Format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

// Format date
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'Tanggal tidak tersedia';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return 'Tanggal tidak valid';
  }
  
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Calculate HPP (Harga Pokok Penjualan)
export const calculateHPP = (transactions: Transaction[]): number => {
  return transactions.reduce((total, transaction) => {
    const itemsHPP = transaction.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity * 0.6); // Assuming 60% cost
    }, 0);
    return total + itemsHPP;
  }, 0);
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'Tanggal tidak tersedia';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Tanggal tidak valid';
  }
  
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
