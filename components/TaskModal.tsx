"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Play, CheckCircle, Clock, Flame, Lightbulb, Hourglass, Pause, Check, Sparkles } from "lucide-react";
import { Todo } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FOCUS_TIPS = [
  "只要开始做 2 分钟就好。",
  "深呼吸，屏蔽手机通知。",
  "完成比完美更重要。",
  "把大任务拆解成小步骤。",
  "相信自己，你可以做到的。",
  "保持专注，一次只做一件事。",
  "休息也是为了更好地出发。",
  "不要让焦虑阻碍你的行动。",
  "专注于当下的每一刻。",
  "每一个小小的进步都值得庆祝。"
];

interface TaskModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (id: number, elapsed?: number) => void;
  onPause: (id: number, remainingTime: number) => void;
  onSubtaskToggle: (todoId: number, subtaskId: number) => void;
  onUpdateTodo: (todo: Todo) => void; // 用于更新任务的 subtasks
  userId?: string;
}

export default function TaskModal({ todo, isOpen, onClose, onComplete, onPause, onSubtaskToggle, onUpdateTodo, userId }: TaskModalProps) {
  const { getToken } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [initialTime, setInitialTime] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  
  const [currentTips, setCurrentTips] = useState<string[]>([]);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 计算当前批次完成数量
  const completedInCurrentBatch = todo?.subtasks?.filter(s => s.completed).length || 0;
  const totalInCurrentBatch = todo?.subtasks?.length || 0;
  const hasMoreBatches = (todo?.totalBatches || 1) > (todo?.currentBatch || 1);
  const isCurrentBatchComplete = completedInCurrentBatch === totalInCurrentBatch && totalInCurrentBatch > 0;

  // 自动拆解任务（仅手动添加的任务需要）
  const autoBreakdownTask = async () => {
    // 只对手动添加的任务进行自动拆解
    // AI聊天同步的任务已有预拆分的subtasks，不需要再拆
    if (!todo || !userId) return;
    if (todo.subtasks && todo.subtasks.length > 0) return;  // 已有步骤不拆解
    if (todo.source === 'ai_chat') return;  // AI聊天任务不自动拆解

    setIsBreakingDown(true);
    setBreakdownError(null);
    try {
      const token = await getToken();
      console.log('[TaskModal] Starting breakdown for task:', todo.id, 'userId:', userId);

      // 解析任务时长
      let plannedDuration = '30m';
      if (todo.duration) {
        if (todo.duration.includes('15')) plannedDuration = '15m';
        else if (todo.duration.includes('60')) plannedDuration = '60m';
        else plannedDuration = '30m';
      }

      const response = await fetch(`${API_URL}/api/tasks/breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          task_id: String(todo.id),
          task_name: todo.title,
          user_id: userId,
          planned_duration: plannedDuration
        })
      });

      console.log('[TaskModal] Breakdown response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[TaskModal] Breakdown response data:', data);

        if (data.subtasks && data.subtasks.length > 0) {
          // 更新任务的 subtasks 和批次信息
          const updatedTodo: Todo = {
            ...todo,
            subtasks: data.subtasks.map((s: any, i: number) => ({
              id: s.id || String(i),
              title: s.title,
              completed: false,
              duration: s.duration
            })),
            breakdownStatus: 'completed',
            totalBatches: data.total_batches || 1,
            currentBatch: data.current_batch || 1
          };
          onUpdateTodo(updatedTodo);
        } else {
          console.warn('[TaskModal] No subtasks returned from API');
          setBreakdownError('AI 未能生成任务步骤，请稍后重试');
        }
      } else {
        const errorText = await response.text();
        let errorData: { detail?: string; error?: { message?: string } } = {};
        try {
          errorData = JSON.parse(errorText) as { detail?: string; error?: { message?: string } };
        } catch {}
        console.error('[TaskModal] Breakdown failed:', response.status, errorData);
        setBreakdownError(errorData.detail || errorData.error?.message || `请求失败 (${response.status}): ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error('[TaskModal] Failed to breakdown task:', error);
      setBreakdownError('网络错误，请检查网络连接');
    } finally {
      setIsBreakingDown(false);
    }
  };

  useEffect(() => {
    if (isOpen && todo) {
      if (todo.remainingTime !== undefined) {
        setTimeLeft(todo.remainingTime);
        setInitialTime(todo.remainingTime);
      } else {
        // Parse duration to seconds (rough estimate)
        let minutes = 30;
        if (todo.duration.includes("60")) minutes = 60;
        if (todo.duration.includes("15")) minutes = 15;
        setTimeLeft(minutes * 60);
        setInitialTime(minutes * 60);
      }
      setIsActive(false);

      // Randomly select 2 unique tips
      const shuffled = [...FOCUS_TIPS].sort(() => 0.5 - Math.random());
      setCurrentTips(shuffled.slice(0, 2));

      // 自动拆解：仅对手动添加且没有预拆分步骤的任务进行拆解
      // AI聊天同步的任务已有subtasks，不需要拆解
      if (userId && (!todo.subtasks || todo.subtasks.length === 0) && todo.source !== 'ai_chat') {
        autoBreakdownTask();
      }
    }
    // Intentionally omit autoBreakdownTask: it is recreated each render; adding it
    // would re-trigger network breakdown when the modal is already open.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preserve open/todo/userId-only trigger
  }, [isOpen, todo, userId]);

  const handleAddTime = () => {
      setTimeLeft(prev => prev + 60); // Add 1 minute
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (isOpen && todo) {
        setStartTime(Date.now());
        // ... rest of logic
    }
  }, [isOpen, todo]);

  const handleComplete = () => {
    if (todo) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onComplete(todo.id, elapsed);
      onClose();
    }
  };

  const handlePause = () => {
    if (todo) {
        onPause(todo.id, timeLeft);
        setIsActive(false); // Just pause the timer, don't close modal
    }
  };

  const handleClose = () => {
    if (isActive && todo) {
      onPause(todo.id, timeLeft);
    }
    onClose();
  };

  if (!isOpen || !todo) return null;

  return (
    <div className="full-screen-page">
      <div className="page-header">
        <button className="close-btn" onClick={handleClose}>
          <X size={24} />
        </button>
      </div>

      <div className="page-content">
        <div className="timer-section">
          <div className="timer-circle">
            <Hourglass size={64} strokeWidth={1} className="timer-icon" />
          </div>
          
          <div className="time-display">
            <span className="time-text">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="task-info">
          <h2 className="task-title">{todo.title}</h2>
          <div className="task-meta">
            <Clock size={16} />
            <span>预计 {todo.duration}</span>
            {todo.importance === 'high' && <span style={{ color: 'var(--color-coral)', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={16} /> 重要</span>}
          </div>
        </div>

        {isBreakingDown ? (
            <div className="breakdown-loading">
                <Sparkles size={24} className="sparkle-icon" />
                <span>AI 正在为您拆解任务...</span>
            </div>
        ) : breakdownError ? (
            <div className="breakdown-error">
                <p style={{ color: 'var(--color-coral)', textAlign: 'center' }}>{breakdownError}</p>
                <button
                    onClick={() => {
                        setBreakdownError(null);
                        autoBreakdownTask();
                    }}
                    style={{
                        display: 'block',
                        margin: '12px auto 0',
                        padding: '8px 16px',
                        background: 'var(--color-coral)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    重试
                </button>
            </div>
        ) : todo.subtasks && todo.subtasks.length > 0 ? (
            <div className="modal-subtasks-list">
                {todo.subtasks.map(subtask => (
                    <div
                        key={subtask.id}
                        className={`modal-subtask-item ${subtask.completed ? 'completed' : ''}`}
                        onClick={() => onSubtaskToggle(todo.id, Number(subtask.id))}
                    >
                        <div className={`modal-checkbox ${subtask.completed ? 'checked' : ''}`}>
                             {subtask.completed && <Check size={12} strokeWidth={3} color="#FFF" />}
                        </div>
                        <span className="modal-subtask-text">{subtask.title}</span>
                        {subtask.duration && (
                            <span className="subtask-duration">{Math.round((subtask.duration || 0) / 60)}分钟</span>
                        )}
                    </div>
                ))}

                {/* 批次进度和加载更多按钮 */}
                {todo.subtasks && todo.subtasks.length > 0 && (
                    <div className="batch-progress">
                        <span className="batch-info">
                            {completedInCurrentBatch}/{totalInCurrentBatch} 完成
                            {todo.totalBatches && todo.totalBatches > 1 && ` · 第${todo.currentBatch}批/共${todo.totalBatches}批`}
                        </span>
                        {isCurrentBatchComplete && hasMoreBatches && (
                            <button
                                className="load-more-btn"
                                onClick={() => {
                                    // TODO: 调用API加载下一批步骤
                                    alert('加载下一批步骤功能开发中');
                                }}
                                disabled={isLoadingMore}
                            >
                                {isLoadingMore ? '加载中...' : '加载下一批'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        ) : (
            <div className="tips-section">
                <h4><Lightbulb size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom', color: 'var(--color-orange)' }} /> ADHD 专注锦囊</h4>
                {currentTips.map((tip, index) => (
                    <p key={index}>{tip}</p>
                ))}
            </div>
        )}
      </div>

      <div className="page-footer">
        <div className="controls-row">
            <button className="control-btn-text" onClick={handleAddTime}>
                +1 分钟
            </button>
            <button 
                className="control-btn-primary" 
                onClick={isActive ? handlePause : () => setIsActive(true)}
            >
                {isActive ? (
                    <Pause size={24} fill="currentColor" />
                ) : (
                    <Play size={24} fill="currentColor" />
                )}
            </button>
        </div>
        <div className="action-buttons">
          <button className="btn-success" onClick={handleComplete}>
            <CheckCircle size={20} /> 完成任务
          </button>
        </div>
      </div>

      <style jsx>{`
        .full-screen-page {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100dvh; /* Use dynamic viewport height */
          background: var(--color-bg-canvas);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .page-header {
            padding: 16px 24px;
            padding-top: max(16px, env(safe-area-inset-top));
            display: flex;
            justify-content: flex-end; /* Close button on right, or left if preferred */
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 8px;
          margin-right: -8px; /* Align visually */
        }

        .page-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-evenly; /* Evenly space content */
            padding: 24px; /* Matched with footer padding */
            overflow: hidden; /* Prevent scrolling */
        }

        .page-footer {
            padding: 0 32px max(48px, calc(env(safe-area-inset-bottom) + 80px));
            width: 100%;
        }

        .timer-section {
          margin-bottom: 0; /* Remove fixed margin */
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px; /* Reduced gap */
        }

        .timer-circle {
          width: 160px; /* Smaller timer for one-screen fit */
          height: 160px;
          border-radius: 50%;
          background: var(--color-bg-highlight); 
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary-hover); 
          margin-bottom: 0;
          box-shadow: none;
          border: none;
        }

        .time-text {
          font-size: 56px; /* Slightly smaller font */
          font-weight: 400; 
          font-variant-numeric: tabular-nums;
          color: var(--color-text-main);
          line-height: 1;
          letter-spacing: -2px;
        }

        .task-info {
          text-align: center;
          margin-bottom: 0; /* Remove fixed margin */
          flex-shrink: 0;
        }

        .modal-subtasks-list {
            width: 100%;
            max-height: 160px;
            overflow-y: auto;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 12px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .modal-subtask-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            background: #FFFFFF;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        }

        .modal-subtask-item:active {
            transform: scale(0.98);
        }

        .modal-subtask-item.completed {
            opacity: 0.6;
            background: #F4F4F5;
        }

        .modal-checkbox {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid var(--color-text-muted);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .modal-checkbox.checked {
            background-color: var(--color-primary);
            border-color: var(--color-primary);
        }

        .modal-subtask-text {
            font-size: 14px;
            color: var(--color-text-main);
            font-weight: 500;
            flex: 1;
        }

        .subtask-duration {
            font-size: 12px;
            color: var(--color-text-muted);
            background: var(--color-bg-highlight);
            padding: 2px 8px;
            border-radius: 8px;
        }

        .batch-progress {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px dashed var(--color-border);
        }

        .batch-info {
            font-size: 13px;
            color: var(--color-text-muted);
        }

        .load-more-btn {
            background: var(--color-primary);
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .load-more-btn:hover {
            transform: scale(1.05);
        }

        .load-more-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .modal-subtask-item.completed .modal-subtask-text {
            text-decoration: line-through;
            color: var(--color-text-muted);
        }

        .breakdown-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 24px;
            color: var(--color-primary);
        }

        .breakdown-error {
            padding: 24px;
            text-align: center;
        }

        .sparkle-icon {
            animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
        }

        .controls-row {
            display: flex;
            align-items: center;
            justify-content: center; 
            gap: 16px;
            margin-bottom: 12px; /* Reduced spacing to bring rows closer */
            width: 100%;
            padding: 0; 
        }

        .control-btn-text {
            flex: 1; /* Equal width */
            height: 56px; /* Consistent height */
            background: transparent;
            border: 1px solid var(--color-border);
            font-size: 16px; 
            font-weight: 600;
            color: var(--color-text-main);
            cursor: pointer;
            padding: 0;
            border-radius: 28px; 
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .control-btn-primary {
            flex: 1; /* Equal width */
            height: 56px; /* Consistent height */
            border-radius: 28px;
            background-color: transparent;
            color: var(--color-text-main);
            border: 1px solid var(--color-border);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            width: auto; 
        }

        .control-btn-primary:hover {
            background-color: var(--color-bg-surface-hover);
            border-color: var(--color-text-muted);
        }

        .btn-success {
          width: 100%;
          height: 56px;
          border-radius: 28px;
          background: var(--color-primary); /* Solid brand color */
          color: #FFFFFF; /* White text */
          border: none;
          box-shadow: 0 4px 12px rgba(93, 184, 150, 0.4);
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
