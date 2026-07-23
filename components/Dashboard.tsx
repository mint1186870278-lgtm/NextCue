import { useState, useEffect } from "react";
import { Target } from "lucide-react";
import TimeBar from "./TimeBar";
import TodoList from "./TodoList";
import AddTodoModal from "./AddTodoModal";
import WeeklyCalendar from "./WeeklyCalendar";
import { Todo } from "@/lib/types";
import { Plus } from "lucide-react";

interface DashboardProps {
  todos: Todo[];
  onDeleteTodo: (id: number) => void;
  onToggleTodoStatus: (id: number) => void;
  onAddTodo: (todo: Todo) => void;
  onSubtaskToggle: (todoId: number, subtaskId: number) => void;
  onSubtaskStart: (todoId: number, subtaskId: number) => void;
}

export default function Dashboard({ todos, onDeleteTodo, onToggleTodoStatus, onAddTodo, onSubtaskToggle, onSubtaskStart }: DashboardProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<'anytime' | 'morning' | 'afternoon' | 'evening' | undefined>(undefined);

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const handleAddClick = (category?: 'anytime' | 'morning' | 'afternoon' | 'evening') => {
      setInitialCategory(category);
      setIsAddModalOpen(true);
  };

  const handleEditTodo = (todo: Todo) => {
      setEditingTodo(todo);
      setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsAddModalOpen(false);
      setInitialCategory(undefined);
      setEditingTodo(null);
  };


  return (
    <main className="panel-right">
      {/* Weekly Calendar */}
      <section className="module" style={{ marginBottom: '0px' }}>
        <WeeklyCalendar />
      </section>

      {/* Time Visualization */}
      <section className="module">
        <TimeBar />
      </section>

      {/* Todo List */}
      <section className="module todo-section-mobile" style={{ position: 'relative', height: '100%' }}>
        <div className="section-header-small" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginBottom: '12px',
            fontSize: '18px', /* Increased size slightly */
            fontWeight: 700, /* Bold like header */
            color: 'var(--color-text-main)', /* Match header color */
            letterSpacing: '-0.5px'
        }}>
            <Target size={18} /> 今日待办
        </div>
        <TodoList 
            todos={todos} 
            onDelete={onDeleteTodo} 
            onToggleStatus={onToggleTodoStatus} 
            onSubtaskToggle={onSubtaskToggle}
            onSubtaskStart={onSubtaskStart}
            onAddClick={handleAddClick}
            onEdit={handleEditTodo}
        />

        {/* Floating Action Button for Adding Tasks */}
        <button 
            className="fab-add"
            onClick={() => handleAddClick()}
        >
            <Plus size={36} color="currentColor" />
        </button>
      </section>

      <AddTodoModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseModal} 
        onAdd={onAddTodo} 
        initialCategory={initialCategory}
        todoToEdit={editingTodo}
      />

      <style jsx>{`
        .fab-add {
            position: fixed;
            bottom: calc(80px + env(safe-area-inset-bottom));
            right: 24px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: var(--color-text-main);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            z-index: 100;
            transition: transform 0.2s;
            color: #FFFFFF;
        }
        .fab-add:active {
            transform: scale(0.95);
        }
        @media (min-width: 769px) {
            .fab-add {
                right: calc(30% + 24px);
                left: auto;
                transform: none;
                bottom: 24px;
            }
            .fab-add:active {
                transform: scale(0.95);
            }
        }
      `}</style>
    </main>
  );
}
