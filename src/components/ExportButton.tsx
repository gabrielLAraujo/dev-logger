'use client';

import { DownloadIcon } from 'lucide-react';
import Button from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: any[];
  filename: string;
}

export default function ExportButton({ data, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Converte os dados para o formato esperado pelo Excel
      const excelData = data.map(row => ({
        'Dia da Semana': row.dayOfWeek,
        'Data': row.date,
        'Início': row.startTime,
        'Fim': row.endTime,
        'Descrição': row.description
      }));

      // Faz a requisição para a API
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: excelData,
          filename: `${filename}.xlsx`
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

      // Obtém o blob da resposta
      const blob = await response.blob();
      
      // Cria um URL para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Cria um link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;
      
      // Adiciona o link ao documento, clica nele e remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpa o URL do blob
      window.URL.revokeObjectURL(url);
      
      toast.success('Arquivo exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar arquivo');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleExport}
      leftIcon={<DownloadIcon className="h-4 w-4" />}
    >
      Exportar para Excel
    </Button>
  );
} 