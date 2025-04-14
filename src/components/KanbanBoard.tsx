'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { DailyActivity } from '@/types';

interface KanbanBoardProps {
  projectId: string;
}

export default function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const columns = {
    backlog: { title: 'Backlog', color: 'bg-gray-100' },
    'in-development': { title: 'Em Desenvolvimento', color: 'bg-blue-100' },
    testing: { title: 'Em Teste', color: 'bg-yellow-100' },
    done: { title: 'Concluído', color: 'bg-green-100' }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/daily-activities`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar tarefas');
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/daily-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          description: newTask,
          status: 'pendente',
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar tarefa');
      }

      const data = await response.json();
      setTasks([...tasks, data]);
      setNewTask('');
      toast.success('Tarefa adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      toast.error('Erro ao adicionar tarefa');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (deletingTaskId === taskId) return;

    setDeletingTaskId(taskId);
    try {
      const response = await fetch(`/api/projects/${projectId}/daily-activities/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir tarefa');
      }

      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success('Tarefa excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/daily-activities/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status da tarefa');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
      toast.success('Tarefa movida com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast.error('Erro ao mover tarefa');
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    handleMoveTask(draggableId, destination.droppableId);
  };

  const renderTaskCard = (task: DailyActivity) => {
    const isDeleting = task.id === deletingTaskId;
    const createdDate = format(parseISO(task.date), 'dd/MM/yyyy', { locale: ptBR });
    
    return (
      <Draggable key={task.id} draggableId={task.id} index={tasks.indexOf(task)}>
        {(provided) => (
          <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="bg-white p-4 rounded-lg shadow mb-2"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-gray-800">{task.description}</p>
                <p className="text-sm text-gray-500 mt-1">Criado em: {createdDate}</p>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                className={`text-red-500 hover:text-red-700 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isDeleting}
              >
                {isDeleting ? '🗑️' : '🗑️'}
              </button>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const renderColumn = (status: string, title: string) => (
    <Droppable droppableId={status}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="bg-gray-100 p-4 rounded-lg w-64"
        >
          <h3 className="font-semibold mb-4">{title}</h3>
          {tasks
            .filter(task => task.status === status)
            .map(task => renderTaskCard(task))}
          {provided.placeholder}
          <div className="mt-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Nova tarefa..."
              className="w-full p-2 rounded border mb-2"
            />
            <button
              onClick={handleAddTask}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}
    </Droppable>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {renderColumn('pendente', 'Pendente')}
        {renderColumn('em_andamento', 'Em Andamento')}
        {renderColumn('concluido', 'Concluído')}
      </div>
    </DragDropContext>
  );
} 