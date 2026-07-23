"use client";

import { useState, useEffect } from "react";
import { X, Clock, AlertCircle, AlignLeft, Sun, Moon, Sunrise } from "lucide-react";
import { Todo } from "@/lib/types";

interface AddTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (todo: Todo) => void;
  initialCategory?: 'anytime' | 'morning' | 'afternoon' | 'evening';
  todoToEdit?: Todo | null;
}

export default function AddTodoModal({ isOpen, onClose, onAdd, initialCategory, todoToEdit }: AddTodoModalProps) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("30m");
  const [importance, setImportance] = useState<'high' | 'normal' | 'routine'>('normal');
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<'anytime' | 'morning' | 'afternoon' | 'evening'>('anytime');

  useEffect(() => {
    if (isOpen) {
        if (todoToEdit) {
            setTitle(todoToEdit.title);
            setDuration(todoToEdit.duration);
            setImportance(todoToEdit.importance || 'normal');
            setNote(todoToEdit.note || "");
            setCategory(todoToEdit.category || 'anytime');
        } else {
            // Reset for new task
            setTitle("");
            setDuration("30m");
            setImportance("normal");
            setNote("");
            if (initialCategory) {
                setCategory(initialCategory);
            } else {
                setCategory('anytime');
            }
        }
    }
  }, [isOpen, initialCategory, todoToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTodo: Todo = {
      id: todoToEdit ? todoToEdit.id : Date.now(),
      title: title,
      duration: duration,
      status: todoToEdit ? todoToEdit.status : 'pending',
      importance: importance,
      note: note.trim() || undefined,
      category: category,
      subtasks: todoToEdit ? todoToEdit.subtasks : [],
      startedAt: todoToEdit?.startedAt,
      completedAt: todoToEdit?.completedAt,
      actualDuration: todoToEdit?.actualDuration
    };

    onAdd(newTodo);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDuration("30m");
    setImportance("normal");
    setNote("");
    setCategory("anytime");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="drag-handle"></div>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <h3 className="modal-title">{todoToEdit ? "编辑任务" : "新任务"}</h3>

        <form onSubmit={handleSubmit} className="add-form">
          <div className="form-group">
            <input
              type="text"
              className="title-input"
              placeholder="想做什么？"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <div className="input-with-icon">
                <AlignLeft size={16} className="input-icon" />
                <input 
                    type="text" 
                    className="note-input" 
                    placeholder="添加备注/描述..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>
          </div>

          <div className="options-grid">
             {/* Time Block Selection */}
             <div className="option-group">
              <label><Sun size={14} /> 时间段</label>
              <div className="chips">
                <button
                  type="button"
                  className={`chip-select ${category === 'anytime' ? 'selected' : ''}`}
                  onClick={() => setCategory('anytime')}
                >
                  随时
                </button>
                <button
                  type="button"
                  className={`chip-select ${category === 'morning' ? 'selected' : ''}`}
                  onClick={() => setCategory('morning')}
                >
                  上午
                </button>
                <button
                  type="button"
                  className={`chip-select ${category === 'afternoon' ? 'selected' : ''}`}
                  onClick={() => setCategory('afternoon')}
                >
                  下午
                </button>
                <button
                  type="button"
                  className={`chip-select ${category === 'evening' ? 'selected' : ''}`}
                  onClick={() => setCategory('evening')}
                >
                  晚间
                </button>
              </div>
            </div>

            {/* Duration Selection */}
            <div className="option-group">
              <label><Clock size={14} /> 时长</label>
              <div className="chips">
                {['15m', '30m', '60m', '>60m'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`chip-select ${duration === d ? 'selected' : ''}`}
                    onClick={() => setDuration(d)}
                    style={duration === d ? { backgroundColor: 'var(--color-text-main)', borderColor: 'var(--color-text-main)', color: '#FFFFFF' } : {}}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Importance Selection */}
            <div className="option-group">
              <label><AlertCircle size={14} /> 重要性</label>
              <div className="chips">
                <button
                  type="button"
                  className="chip-select"
                  onClick={() => setImportance('routine')}
                  style={{
                    backgroundColor: importance === 'routine' ? '#5BB5E0' : '#FFFFFF',
                    borderColor: importance === 'routine' ? '#5BB5E0' : 'rgba(0,0,0,0.1)',
                    color: importance === 'routine' ? '#FFFFFF' : '#4A5E4A',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    visibility: 'visible',
                    opacity: 1
                  }}
                >
                  日常
                </button>
                
                <button
                  type="button"
                  className="chip-select"
                  onClick={() => setImportance('normal')}
                  style={{
                    backgroundColor: importance === 'normal' ? '#F5A623' : '#FFFFFF',
                    borderColor: importance === 'normal' ? '#F5A623' : 'rgba(0,0,0,0.1)',
                    color: importance === 'normal' ? '#FFFFFF' : '#4A5E4A',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    visibility: 'visible',
                    opacity: 1
                  }}
                >
                  一般
                </button>

                <button
                  type="button"
                  className="chip-select"
                  onClick={() => setImportance('high')}
                  style={{
                    backgroundColor: importance === 'high' ? '#E87461' : '#FFFFFF',
                    borderColor: importance === 'high' ? '#E87461' : 'rgba(0,0,0,0.1)',
                    color: importance === 'high' ? '#FFFFFF' : '#4A5E4A',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    visibility: 'visible',
                    opacity: 1
                  }}
                >
                  重要
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={!title.trim()}>
            {todoToEdit ? "保存修改" : "添加任务"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: flex-end;
          animation: fadeIn 0.2s ease;
        }

        .modal-content {
          width: 100%;
          background: #FFFFFF;
          border-radius: 24px 24px 0 0;
          padding: 24px;
          /* 移动端浏览器底部 UI 占位：safe-area + 120px 预留地址栏/导航栏空间 */
          padding-bottom: max(120px, calc(env(safe-area-inset-bottom) + 120px));
          display: flex;
          flex-direction: column;
          position: relative;
          max-height: 85vh; /* 留出底部浏览器 UI 空间 */
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (min-width: 769px) {
          .modal-overlay {
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .modal-content {
            width: 100%;
            max-width: 420px;
            border-radius: 24px;
            padding: 24px 24px 28px;
            max-height: 90vh;
          }
          .add-form {
            gap: 20px;
          }
          .modal-title {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .options-grid {
            gap: 16px;
          }
        }

        .drag-handle {
            width: 40px;
            height: 4px;
            background-color: var(--color-border);
            border-radius: 2px;
            margin: 0 auto 24px auto;
        }
        @media (min-width: 769px) {
          .drag-handle {
            display: none;
          }
        }

        .close-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
        }

        .modal-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 24px;
            color: var(--color-text-main);
        }

        .add-form {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .title-input {
            width: 100%;
            font-size: 24px;
            font-weight: 600;
            border: none;
            border-bottom: 2px solid var(--color-border);
            padding: 8px 0;
            outline: none;
            background: transparent;
            color: var(--color-text-main);
        }
        
        .title-input:focus {
            border-color: var(--color-primary);
        }

        .title-input::placeholder {
            color: #D4D4D8;
        }

        .input-with-icon {
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid var(--color-border);
            padding: 8px 0;
        }

        .input-icon {
            color: var(--color-text-secondary);
        }

        .note-input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 14px;
            color: var(--color-text-main);
            background: transparent;
        }

        .note-input::placeholder {
            color: var(--color-text-muted);
        }

        .options-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .option-group label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
            color: var(--color-text-secondary);
            margin-bottom: 12px;
        }

        .chips {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .chip-select {
            padding: 8px 16px;
            border-radius: 20px;
            border: 1px solid var(--color-border);
            background: var(--color-bg-surface);
            color: var(--color-text-secondary);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .chip-select.selected {
            background: var(--color-text-main);
            color: #FFFFFF;
            border-color: var(--color-text-main);
        }

        .chip-select.importance-high.selected {
            background: var(--color-coral);
            border-color: var(--color-coral);
        }
        
        /* .chip-select.btn-mid-priority.selected removed */
        
        .chip-select.importance-routine.selected {
            background: var(--color-blue);
            border-color: var(--color-blue);
        }

        .btn-submit {
            width: 100%;
            height: 56px;
            border-radius: 28px;
            background: var(--color-primary);
            color: var(--color-primary-foreground);
            font-size: 16px;
            font-weight: 600;
            border: none;
            margin-top: 16px;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        @media (min-width: 769px) {
          .btn-submit {
            margin-top: 8px;
          }
        }

        .btn-submit:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
