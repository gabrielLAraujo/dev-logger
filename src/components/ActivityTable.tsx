import { format, parseISO, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityTableProps {
  commits: { [key: string]: { message: string; date: string }[] };
  activities: {
    id: string;
    description: string;
    date: string;
    status: 'pendente' | 'em_andamento' | 'concluido';
  }[];
  isWorkDay: (date: Date) => boolean;
  selectedMonth: Date;
}

const statusColors = {
  pendente: 'bg-yellow-100 border-yellow-500',
  em_andamento: 'bg-blue-100 border-blue-500',
  concluido: 'bg-green-100 border-green-500',
};

const statusLabels = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};

export default function ActivityTable({ commits, activities, isWorkDay, selectedMonth }: ActivityTableProps) {
  // Filtrar atividades do mês selecionado
  const filteredActivities = activities.filter(activity => 
    isSameMonth(parseISO(activity.date), selectedMonth)
  );

  // Filtrar commits do mês selecionado
  const filteredCommits = Object.entries(commits)
    .filter(([date]) => isSameMonth(parseISO(date), selectedMonth))
    .reduce((acc, [date, commits]) => {
      acc[date] = commits;
      return acc;
    }, {} as typeof commits);

  // Combinar datas de commits e atividades
  const allDates = Array.from(new Set([
    ...Object.keys(filteredCommits),
    ...filteredActivities.map(a => format(parseISO(a.date), 'yyyy-MM-dd'))
  ])).sort().reverse();

  if (allDates.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Histórico de Atividades</h2>
        <p className="text-gray-500 text-center py-4">
          Nenhuma atividade ou commit registrado neste mês.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Histórico de Atividades</h2>
          <div className="flex gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Atividades: </span>
              {filteredActivities.length}
            </div>
            <div>
              <span className="font-medium">Commits: </span>
              {Object.values(filteredCommits).reduce((acc, commits) => acc + commits.length, 0)}
            </div>
            <div>
              <span className="font-medium">Dias Produtivos: </span>
              {allDates.length}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allDates.map(date => {
                const dateActivities = filteredActivities.filter(
                  activity => format(parseISO(activity.date), 'yyyy-MM-dd') === date
                );
                const dateCommits = filteredCommits[date] || [];

                return (
                  <tr key={date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(date), "dd 'de' MMMM", { locale: ptBR })}
                      <div className="text-xs text-gray-400">
                        {isWorkDay(parseISO(date)) ? 'Dia útil' : 'Fim de semana'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-2">
                        {dateActivities.map(activity => (
                          <div key={activity.id} className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[activity.status]}`}>
                              {statusLabels[activity.status]}
                            </span>
                            <span>{activity.description}</span>
                          </div>
                        ))}
                        {dateCommits.map((commit, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                              Commit
                            </span>
                            <span>{commit.message}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 