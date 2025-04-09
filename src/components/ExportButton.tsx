'use client';

import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  data: any[];
  filename: string;
}

export default function ExportButton({ data, filename }: ExportButtonProps) {
  const handleExport = () => {
    // Criar uma cópia dos dados para não modificar os originais
    const sanitizedData = data.map(row => {
      const sanitizedRow = { ...row };
      
      // Sanitizar a descrição para remover informações sensíveis
      if (sanitizedRow.description) {
        sanitizedRow.description = sanitizedRow.description
          .replace(/password|senha|token|key|api[_-]?key|secret|credencial/i, '[INFORMAÇÃO REMOVIDA]')
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REMOVIDO]')
          .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF REMOVIDO]')
          .replace(/\b\d{2}\.?\d{4,5}-?\d{4}\b/g, '[TELEFONE REMOVIDO]');
      }
      
      return sanitizedRow;
    });

    // Criar a planilha
    const worksheet = XLSX.utils.json_to_sheet(sanitizedData);

    // Configurar o estilo das células para preservar quebras de linha
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cell_address];
        if (cell && cell.v && typeof cell.v === 'string' && cell.v.includes('\n')) {
          cell.s = {
            alignment: {
              wrapText: true,
              vertical: 'top',
            },
          };
        }
      }
    }

    // Ajustar a largura das colunas
    const maxWidth = Object.keys(sanitizedData[0] || {}).reduce((acc, key) => {
      const maxLength = Math.max(
        key.length,
        ...sanitizedData.map(row => String(row[key]).length)
      );
      acc[key] = Math.min(maxLength + 2, 50); // Limitar a largura máxima
      return acc;
    }, {} as Record<string, number>);

    worksheet['!cols'] = Object.values(maxWidth).map(width => ({ width }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    XLSX.writeFile(workbook, filename);
  };

  return (
    <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Exportar Excel
    </Button>
  );
} 