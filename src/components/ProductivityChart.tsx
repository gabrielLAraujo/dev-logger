'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ActivityStatus = 'pendente' | 'em_andamento' | 'concluido';

interface DailyActivity {
  id: string;
  date: string;
  description: string;
  status: ActivityStatus;
}

interface Commit {
  message: string;
  date: string;
}

interface ProductivityChartProps {
  dailyActivities: DailyActivity[];
  commits: Record<string, Commit[]>;
  startDate: string;
  endDate: string;
}

export default function ProductivityChart({
  dailyActivities,
  commits,
  startDate,
  endDate,
}: ProductivityChartProps) {
  const [showChart, setShowChart] = useState(false);

  const handleExport = () => {
    const data = Object.entries(commits).map(([date, dateCommits]) => {
      const activities = dailyActivities.filter(
        activity => format(parseISO(activity.date), 'yyyy-MM-dd') === date
      );
      
      return {
        data: format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        commits: dateCommits.map(commit => commit.message),
        atividades: activities.map(activity => ({
          descricao: activity.description,
          status: activity.status
        }))
      };
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Commits,Atividades\n"
      + data.map(row => 
          `"${row.data}","${row.commits.join('; ')}","${row.atividades.map(a => `${a.descricao} (${a.status})`).join('; ')}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `produtividade_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: ActivityStatus) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'concluido':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusTitle = (status: ActivityStatus) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluido':
        return 'Concluído';
      default:
        return 'Status';
    }
  };

  const groupedActivities = dailyActivities.reduce((acc, activity) => {
    if (!acc[activity.status]) {
      acc[activity.status] = [];
    }
    acc[activity.status].push(activity);
    return acc;
  }, {} as Record<ActivityStatus, DailyActivity[]>);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gráfico de Produtividade</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowChart(!showChart)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            {showChart ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Exportar Dados
          </button>
        </div>
      </div>

      {showChart && (
        <div className="mt-6">
          {/* Aqui vai o seu componente de gráfico */}
        </div>
      )}
    </div>
  );
} 