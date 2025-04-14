'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data: Array<{
    dayOfWeek: string;
    date: string;
    startTime: string;
    endTime: string;
    description: React.ReactNode;
    descriptionForExport: string;
  }>;
  filename: string;
}

export default function ExportButton({ data, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      // Preparar dados para exportação
      const exportData = data.map(item => ({
        'Dia da Semana': item.dayOfWeek,
        'Data': item.date,
        'Início': item.startTime,
        'Fim': item.endTime,
        'Descrição': item.descriptionForExport,
      }));

      // Criar planilha
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 15 }, // Dia da Semana
        { wch: 12 }, // Data
        { wch: 8 },  // Início
        { wch: 8 },  // Fim
        { wch: 50 }, // Descrição
      ];
      ws['!cols'] = colWidths;

      // Exportar arquivo
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      {isExporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exportando...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar
        </>
      )}
    </button>
  );
} 