import { Todo, Subtask } from "@/lib/types";
import { Play, Pause, Check, Trash2, ChevronDown, ChevronRight, Clock, Sun, Moon, Sunset, CheckCircle, Plus, Pencil } from "lucide-react";
import { useState } from "react";

interface TodoListProps {
  todos: Todo[];
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
  onSubtaskToggle: (todoId: number, subtaskId: number) => void;
  onSubtaskStart: (todoId: number, subtaskId: number) => void;
  onAddClick?: (category?: TimeBlock) => void;
  onEdit: (todo: Todo) => void;
}

type TimeBlock = 'anytime' | 'morning' | 'afternoon' | 'evening';

export default function TodoList({ todos, onDelete, onToggleStatus, onSubtaskToggle, onSubtaskStart, onAddClick, onEdit }: TodoListProps) {
  const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => 
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  };

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => 
      prev.includes(groupKey) ? prev.filter(k => k !== groupKey) : [...prev, groupKey]
    );
  };

  if (todos.length === 0) {
    return (
      <div className="empty-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center", minHeight: "240px", color: "var(--color-text-secondary)", animation: "fadeIn 0.5s ease" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "var(--color-primary)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: "rotate(180deg)" }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--color-text-main)" }}>启动困难？</h3>
        <p style={{ fontSize: 14, maxWidth: 240, lineHeight: 1.5 }}>快和 Focus AI 教练聊一聊吧！</p>
      </div>
    );
  }

  const getDurationCategory = (durationStr: string) => {
    const str = durationStr.trim();
    if (str.includes('>60') || str.includes('90')) return 'long';
    if (str.includes('30-60') || str.includes('45')) return 'medium';
    if (str.includes('60')) return 'long';   // 60m 最高
    if (str.includes('30')) return 'medium'; // 30m 中等
    return 'short';                          // 15m 及更短 最小
  };

  const groups = [
    { key: 'anytime', label: '随时', icon: Clock, color: '#9CA3AF' },
    { key: 'morning', label: '上午', icon: Sun, color: '#F59E0B' }, // 8:00 - 12:00
    { key: 'afternoon', label: '下午', icon: Sun, color: '#EF4444' }, // 12:00 - 18:00
    { key: 'evening', label: '晚间', icon: Moon, color: '#6366F1' }, // 18:00 - 24:00
    { key: 'completed', label: '已完成', icon: CheckCircle, color: '#10B981' }
  ];

  // 统一 status/category 格式，兼容 API 或 localStorage 返回的变体（如 done/complete、大小写等）
  const norm = (t: Todo) => {
    const s = String(t.status || 'pending').toLowerCase();
    const status = (s === 'done' || s === 'complete' || s === 'completed') ? 'completed' : s;
    const c = String(t.category || 'anytime').toLowerCase();
    const category = ['morning', 'afternoon', 'evening'].includes(c) ? c : 'anytime';
    return { status, category };
  };

  const groupedTodos = {
    anytime: todos.filter(t => { const { status, category } = norm(t); return category === 'anytime' && status !== 'completed'; }),
    morning: todos.filter(t => { const { status, category } = norm(t); return category === 'morning' && status !== 'completed'; }),
    afternoon: todos.filter(t => { const { status, category } = norm(t); return category === 'afternoon' && status !== 'completed'; }),
    evening: todos.filter(t => { const { status, category } = norm(t); return category === 'evening' && status !== 'completed'; }),
    completed: todos.filter(t => { const { status } = norm(t); return status === 'completed'; })
  };

  return (
    <div className="todo-list">
      {groups.map(group => {
        const groupTodos = groupedTodos[group.key as keyof typeof groupedTodos];
        if (group.key === 'completed' && groupTodos.length === 0) return null; // Hide completed section if empty
        // Optional: Hide other empty sections? The reference image shows empty sections with (0).
        // Let's keep them visible except completed maybe? 
        // User image shows empty sections. So I'll render all except maybe completed if empty.
        
        const isCollapsed = collapsedGroups.includes(group.key);

        return (
            <div key={group.key} className={`todo-group ${isCollapsed ? 'collapsed' : ''}`}>
                <div 
                    className="group-header" 
                    onClick={() => toggleGroup(group.key)}
                    style={{ '--group-color': group.color } as React.CSSProperties}
                >
                    <div className="group-title">
                        <group.icon size={16} className="group-icon" />
                        <span>{group.label}</span>
                        <span className="count">({groupTodos.length})</span>
                    </div>
                    {isCollapsed ? (
                        <ChevronRight size={16} className="collapse-icon" aria-label="展开" />
                    ) : (
                        <ChevronDown size={16} className="collapse-icon" aria-label="折叠" />
                    )}
                </div>

                {!isCollapsed && (
                    <div className="group-content">
                        {groupTodos.length === 0 && group.key !== 'completed' ? (
                            <div 
                                className="empty-group-placeholder"
                                onClick={() => onAddClick?.(group.key as TimeBlock)}
                                style={{ cursor: 'pointer' }}
                            >
                                {group.key === 'anytime' && "今天随时都行"}
                                {group.key === 'morning' && "你早上有什么待办？"}
                                {group.key === 'afternoon' && "今天有什么安排？"}
                                {group.key === 'evening' && "以你喜欢的方式结束一天"}
                                <button className="add-btn-mini">
                                    <Plus size={14} />
                                </button>
                            </div>
                        ) : (
                            groupTodos.map(todo => {
                                const heightClass = getDurationCategory(todo.duration);
                                const importanceClass = todo.importance ? `importance-${todo.importance}` : 'importance-normal';
                                const activeClass = (todo.status === 'active' || todo.status === 'paused') ? 'active' : '';
                                const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
                                const isExpanded = expandedTasks.includes(todo.id);
                                const completedSubtasks = todo.subtasks?.filter(s => s.completed).length || 0;
                                const totalSubtasks = todo.subtasks?.length || 0;
                                
                                const formatRemainingTime = (seconds?: number) => {
                                    if (!seconds) return null;
                                    const mins = Math.floor(seconds / 60);
                                    const secs = seconds % 60;
                                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                                };

                                return (
                                <div key={todo.id} className={`todo-card-wrapper ${hasSubtasks ? 'has-subtasks' : ''} ${isExpanded ? 'expanded' : ''} ${importanceClass} ${activeClass}`}>
                                    <div
                                        className={`todo-item ${todo.status} ${heightClass} ${importanceClass}`}
                                        onClick={(e) => {
                                            if (hasSubtasks) {
                                                toggleExpand(todo.id, e);
                                            }
                                        }}
                                    >
                                        <div className="todo-content">
                                            <div className="todo-main">
                                                <div className="todo-title">{todo.title}</div>
                                                {todo.note && (
                                                    <div className="todo-note">{todo.note}</div>
                                                )}
                                            </div>
                                            <div className="todo-meta">
                                                <span>{todo.status === 'paused' && todo.remainingTime ? `暂停中 ${formatRemainingTime(todo.remainingTime)}` : todo.duration}</span>
                                                {hasSubtasks && (
                                                    <span className="subtask-count">
                                                        {completedSubtasks}/{totalSubtasks}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        {hasSubtasks && (
                                            <button
                                                className="action-btn expand-btn"
                                                onClick={(e) => toggleExpand(todo.id, e)}
                                                style={{
                                                    border: "none",
                                                    width: "32px",
                                                    height: "32px",
                                                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                                                }}
                                            >
                                                <ChevronDown size={20} />
                                            </button>
                                        )}
                                        
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(todo);
                                            }}
                                            style={{ 
                                                opacity: 0,
                                                transition: "all 0.2s", 
                                                border: "none", 
                                                color: "var(--color-text-secondary)",
                                                width: "44px",
                                                height: "44px"
                                            }}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(todo.id);
                                            }}
                                            style={{ 
                                                opacity: 0, 
                                                transition: "all 0.2s", 
                                                border: "none", 
                                                color: "var(--color-text-secondary)",
                                                width: "44px",
                                                height: "44px"
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            className={`action-btn ${todo.status === 'active' ? 'play' : ''}`}
                                            onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleStatus(todo.id);
                                            }}
                                            style={{
                                                width: "44px",
                                                height: "44px",
                                                opacity: 1,
                                                visibility: 'visible'
                                            }}
                                        >
                                            {todo.status === 'completed' ? (
                                            <Check size={16} />
                                            ) : todo.status === 'active' ? (
                                            <Pause size={16} fill="currentColor" stroke="none" />
                                            ) : (
                                            <Play size={16} />
                                            )}
                                        </button>
                                        </div>
                                    </div>
                                    
                                    {/* Subtasks List */}
                                    {hasSubtasks && isExpanded && (
                                        <div className="subtasks-container">
                                            {todo.subtasks!.map(subtask => (
                                                <div 
                                                    key={subtask.id} 
                                                    className="subtask-row"
                                                    tabIndex={0}
                                                >
                                                    <div 
                                                        className={`subtask-circle ${subtask.completed ? 'completed' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSubtaskToggle(todo.id, Number(subtask.id));
                                                        }}
                                                    >
                                                        {subtask.completed && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                    <span className={`subtask-title ${subtask.completed ? 'completed' : ''}`}>
                                                        {subtask.title}
                                                        {subtask.status === 'paused' && subtask.remainingTime && (
                                                            <span style={{ fontSize: '11px', color: 'var(--color-primary)', marginLeft: '8px', fontWeight: 500 }}>
                                                                暂停中 {formatRemainingTime(subtask.remainingTime)}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <button
                                                        className="action-btn play-small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSubtaskStart(todo.id, Number(subtask.id));
                                                        }}
                                                    >
                                                        {subtask.status === 'active' ? (
                                                            <Pause size={14} fill="currentColor" stroke="none" />
                                                        ) : (
                                                            <Play size={14} />
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        );
      })}
      
      <style jsx>{`
        .todo-group {
            margin-bottom: var(--todo-group-gap);
            transition: margin-bottom 0.2s ease;
        }

        .todo-group.collapsed {
            margin-bottom: 4px;
        }

        .group-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 4px;
            margin-bottom: var(--todo-group-inner-gap);
            cursor: pointer;
            user-select: none;
        }

        .group-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-main);
            background-color: color-mix(in srgb, var(--group-color) 15%, transparent);
            padding: 6px 12px;
            border-radius: 16px;
        }

        .group-icon {
            color: var(--group-color);
        }

        .count {
            color: var(--color-text-secondary);
            font-size: 12px;
            font-weight: 500;
        }

        .collapse-icon {
            color: var(--color-text-muted);
            transition: transform 0.2s;
            flex-shrink: 0;
        }

        .group-content {
            display: flex;
            flex-direction: column;
            gap: var(--todo-group-inner-gap);
        }

        .empty-group-placeholder {
            border: 1px dashed var(--color-border);
            border-radius: 12px;
            padding: 16px;
            color: var(--color-text-muted);
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: #FAFAFA;
        }

        .add-btn-mini {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #EEE;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-text-secondary);
            cursor: pointer;
        }

        /* Wrapper Styling */
        .todo-card-wrapper {
            margin-bottom: 0;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            position: relative;
            background-color: #FFFFFF;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }

        .todo-card-wrapper::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 6px;
            z-index: 10;
            pointer-events: none;
            background-color: transparent;
            display: block !important;
        }

        .todo-card-wrapper.importance-high::before { background-color: #E87461 !important; }
        .todo-card-wrapper.importance-routine::before { background-color: #5BB5E0 !important; }
        .todo-card-wrapper.importance-normal::before { background-color: #F5A623 !important; }

        .todo-card-wrapper.expanded {
            box-shadow: var(--shadow-sm);
            border-color: var(--color-border);
        }

        .todo-item {
            display: flex;
            align-items: center;
            padding: var(--space-2);
            padding-left: 22px !important;
            background-color: #FFFFFF;
            border: none !important; 
            border-radius: 0 !important;
            transition: all var(--transition-normal);
            cursor: pointer;
            position: relative;
            z-index: 2;
            width: 100%;
        }

        .todo-card-wrapper.expanded .todo-item:hover {
            transform: none !important;
            box-shadow: none !important;
            background-color: transparent;
        }
        
        .todo-card-wrapper.expanded .todo-item {
            background-color: transparent;
            border-bottom: 1px solid var(--color-border) !important;
            border-radius: 0 !important;
        }

        .todo-item.short { min-height: 44px; padding-top: 8px; padding-bottom: 8px; }
        .todo-item.medium { min-height: 56px; padding-top: 12px; padding-bottom: 12px; }
        .todo-item.long { min-height: 76px; padding-top: 16px; padding-bottom: 16px; align-items: flex-start; }

        .todo-item.active {
            background-color: var(--color-bg-highlight) !important;
            color: var(--color-text-main) !important;
        }

        .todo-card-wrapper:hover {
            box-shadow: var(--shadow-hover);
        }

        .todo-card-wrapper:hover .delete-btn,
        .todo-card-wrapper:hover .edit-btn {
            visibility: visible;
            opacity: 1 !important;
            pointer-events: auto !important;
        }

        .edit-btn {
            visibility: hidden;
        }

        .delete-btn {
            visibility: hidden;
        }

        .edit-btn:hover {
            color: var(--color-primary) !important;
            background-color: var(--color-bg-surface-hover);
            border-radius: 50%;
        }

        .delete-btn:hover {
            color: var(--color-error) !important;
            background-color: var(--color-bg-surface-hover);
            border-radius: 50%;
        }

        .todo-main {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .todo-note {
            font-size: 12px;
            color: var(--color-text-secondary);
            margin-top: 2px;
        }

        .subtasks-container {
            background-color: transparent;
            margin: 0;
            padding: 0 12px 12px 12px;
            animation: slideDown 0.2s ease-out forwards;
            position: relative;
            z-index: 1;
        }

        .subtask-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            background-color: #F8F8F8;
            border-radius: 8px;
            margin-bottom: 8px;
            border: 1px solid transparent;
            transition: all 0.2s;
            position: relative;
            outline: none;
        }
        
        .subtask-row:last-child {
            margin-bottom: 0;
        }

        .subtask-row:hover,
        .subtask-row:focus {
            background-color: #F0F0F0;
        }

        .subtask-circle {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid var(--color-text-muted);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s;
            color: #FFF;
            cursor: pointer;
        }

        .subtask-circle:hover {
            border-color: var(--color-primary);
        }

        .subtask-circle.completed {
            background-color: var(--color-primary);
            border-color: var(--color-primary);
        }

        .subtask-title {
            font-size: 14px;
            color: var(--color-text-main);
            flex: 1;
        }
        
        .subtask-title.completed {
            color: var(--color-text-muted);
            text-decoration: line-through;
        }

        .play-small {
            width: 28px;
            height: 28px;
            padding: 0;
            border: 1px solid transparent;
            background: transparent;
            color: var(--color-text-muted);
            opacity: 0;
            transition: all 0.2s;
        }

        .subtask-row:hover .play-small,
        .subtask-row:focus .play-small {
            opacity: 1;
        }

        .play-small:hover {
            background-color: var(--color-bg-highlight);
            color: var(--color-primary-text);
            border-color: var(--color-primary-text);
        }

        .subtask-count {
            background-color: rgba(0,0,0,0.05);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            margin-left: 8px;
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}