import React, { useState, useEffect } from 'react';

interface DailyActivity {
  id: string;
  description: string;
  date: string;
  status: 'backlog' | 'in-development' | 'testing' | 'done';
  createdAt: string;
}

interface DailyActivitiesProps {
  projectId: string;
}

export default function DailyActivities({ projectId }: DailyActivitiesProps) {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [newTasks, setNewTasks] = useState({
    backlog: '',
    'in-development': '',
    testing: '',
    done: ''
  });

  const handleAddTask = async (status: DailyActivity['status']) => {
    const description = newTasks[status];
    if (!description.trim()) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/daily-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          date: new Date().toISOString(),
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar tarefa');
      }

      const newActivity = await response.json();
      setActivities(prev => [...prev, newActivity]);
      setNewTasks(prev => ({ ...prev, [status]: '' }));
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/daily-activities/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir tarefa');
      }

      setActivities(prev => prev.filter(activity => activity.id !== taskId));
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/daily-activities`);
        if (!response.ok) {
          throw new Error('Erro ao buscar atividades');
        }
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Erro ao buscar atividades:', error);
      }
    };

    fetchActivities();
  }, [projectId]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Atividades Diárias</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coluna Backlog */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Backlog</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTasks.backlog}
                onChange={(e) => setNewTasks(prev => ({ ...prev, backlog: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTasks.backlog.trim()) {
                    handleAddTask('backlog');
                  }
                }}
                placeholder="Nova tarefa..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleAddTask('backlog')}
                disabled={!newTasks.backlog.trim()}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                +
              </button>
            </div>
            {activities
              .filter(activity => activity.status === 'backlog')
              .map(activity => (
                <div key={activity.id} className="flex items-center justify-between bg-white p-2 rounded shadow">
                  <span className="text-gray-700">{activity.description}</span>
                  <button
                    onClick={() => handleDeleteTask(activity.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Coluna Em Desenvolvimento */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">Em Desenvolvimento</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTasks['in-development']}
                onChange={(e) => setNewTasks(prev => ({ ...prev, 'in-development': e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTasks['in-development'].trim()) {
                    handleAddTask('in-development');
                  }
                }}
                placeholder="Nova tarefa..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleAddTask('in-development')}
                disabled={!newTasks['in-development'].trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                +
              </button>
            </div>
            {activities
              .filter(activity => activity.status === 'in-development')
              .map(activity => (
                <div key={activity.id} className="flex items-center justify-between bg-white p-2 rounded shadow">
                  <span className="text-gray-700">{activity.description}</span>
                  <button
                    onClick={() => handleDeleteTask(activity.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Coluna Em Testes */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-700 mb-4">Em Testes</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTasks.testing}
                onChange={(e) => setNewTasks(prev => ({ ...prev, testing: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTasks.testing.trim()) {
                    handleAddTask('testing');
                  }
                }}
                placeholder="Nova tarefa..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleAddTask('testing')}
                disabled={!newTasks.testing.trim()}
                className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                +
              </button>
            </div>
            {activities
              .filter(activity => activity.status === 'testing')
              .map(activity => (
                <div key={activity.id} className="flex items-center justify-between bg-white p-2 rounded shadow">
                  <span className="text-gray-700">{activity.description}</span>
                  <button
                    onClick={() => handleDeleteTask(activity.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Coluna Concluído */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-700 mb-4">Concluído</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTasks.done}
                onChange={(e) => setNewTasks(prev => ({ ...prev, done: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTasks.done.trim()) {
                    handleAddTask('done');
                  }
                }}
                placeholder="Nova tarefa..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleAddTask('done')}
                disabled={!newTasks.done.trim()}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                +
              </button>
            </div>
            {activities
              .filter(activity => activity.status === 'done')
              .map(activity => (
                <div key={activity.id} className="flex items-center justify-between bg-white p-2 rounded shadow">
                  <span className="text-gray-700">{activity.description}</span>
                  <button
                    onClick={() => handleDeleteTask(activity.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 