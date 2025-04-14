import { format, parseISO, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '@/components/StrictModeDroppable';

type Status = 'pendente' | 'em_andamento' | 'concluido';

interface ActivityKanbanProps {
  activities: {
    id: string;
    description: string;
    date: string;
    status: Status;
  }[];
  onStatusChange: (activityId: string, newStatus: Status) => void;
  onDeleteActivity: (activityId: string) => Promise<void>;
  selectedMonth: Date;
  projectId: string;
  onActivityAdded: () => void;
}

const statusColors = {
  pendente: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    text: 'text-yellow-700'
  },
  em_andamento: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    button: 'bg-blue-500 hover:bg-blue-600 text-white',
    text: 'text-blue-700'
  },
  concluido: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    button: 'bg-green-500 hover:bg-green-600 text-white',
    text: 'text-green-700'
  },
} as const;

const statusTitles = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
} as const;

const nextStatus: Record<Status, Status> = {
  pendente: 'em_andamento',
  em_andamento: 'concluido',
  concluido: 'pendente',
};

export default function ActivityKanban({ 
  activities, 
  onStatusChange, 
  onDeleteActivity,
  selectedMonth,
  projectId,
  onActivityAdded 
}: ActivityKanbanProps) {
  const [newActivity, setNewActivity] = useState('');
  const [enabled, setEnabled] = useState(false);
  
  const filteredActivities = activities.filter(activity => 
    isSameMonth(parseISO(activity.date), selectedMonth)
  );

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/daily-activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newActivity,
          status: 'pendente',
          date: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar atividade');
      }

      setNewActivity('');
      onActivityAdded();
      toast.success('Atividade adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar atividade:', error);
      toast.error('Erro ao adicionar atividade');
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as Status;
    const destinationStatus = result.destination.droppableId as Status;
    const activityId = result.draggableId;

    if (sourceStatus !== destinationStatus) {
      onStatusChange(activityId, destinationStatus);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <input
          type="text"
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newActivity.trim()) {
              handleAddActivity();
            }
          }}
          placeholder="Adicionar nova atividade..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleAddActivity}
          disabled={!newActivity.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(statusTitles).map(([status, title]) => (
            <div 
              key={status} 
              className={`p-4 rounded-lg border ${statusColors[status as keyof typeof statusColors].border} ${statusColors[status as keyof typeof statusColors].bg}`}
            >
              <h3 className="text-lg font-semibold mb-4">
                {title}
                <span className="ml-2 text-sm text-gray-500">
                  ({filteredActivities.filter(a => a.status === status).length})
                </span>
              </h3>
              <StrictModeDroppable droppableId={status}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg p-2' : ''
                    }`}
                  >
                    {filteredActivities
                      .filter(activity => activity.status === status)
                      .map((activity, index) => (
                        <Draggable 
                          key={activity.id} 
                          draggableId={activity.id} 
                          index={index}
                        >
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                              }}
                              className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500 ring-opacity-50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between group">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {format(parseISO(activity.date), "dd 'de' MMMM", { locale: ptBR })}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${statusColors[activity.status].button}`} />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                                        onDeleteActivity(activity.id);
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-full"
                                    title="Excluir atividade"
                                  >
                                    <svg 
                                      className="w-4 h-4 text-red-500" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                    {filteredActivities.filter(a => a.status === status).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhuma atividade neste status
                      </p>
                    )}
                  </div>
                )}
              </StrictModeDroppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 