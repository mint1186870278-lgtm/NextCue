"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import ChatPanel from "@/components/ChatPanel";
import Dashboard from "@/components/Dashboard";
import BottomNav from "@/components/BottomNav";
import ReviewPanel from "@/components/ReviewPanel";
import TaskModal from "@/components/TaskModal";
import { Todo, Message } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://adhdcoach-backend.onrender.com";

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'focus' | 'review'>('focus');
  const [isCelebrationActive, setIsCelebrationActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Modal State
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubtask, setActiveSubtask] = useState<{ todoId: number, subtaskId: number } | null>(null);
  const [initialChatMessage, setInitialChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  // Fetch tasks from API when user is logged in, else load from localStorage
  useEffect(() => {
    if (!isUserLoaded) return;
    if (user) {
      const fetchTasks = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/tasks/?user_id=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.tasks && Array.isArray(data.tasks)) {
              const mappedTodos: Todo[] = data.tasks.map((task: any) => {
                const rawStatus = String(task.status || "pending").toLowerCase();
                const status: Todo["status"] =
                  rawStatus === "done" || rawStatus === "complete" ? "completed"
                  : rawStatus === "active" || rawStatus === "paused" || rawStatus === "completed" ? rawStatus
                  : "pending";
                const rawCat = String(task.suggested_period || "anytime").toLowerCase();
                const category = ["morning", "afternoon", "evening"].includes(rawCat) ? rawCat : "anytime";
                return {
                id: task.id || task._id,
                title: task.name,
                duration: task.estimated_time || "25m",
                status,
                importance: task.importance,
                category,
                completedAt: task.completed_at,
                startedAt: task.started_at,
                actualDuration: task.actual_duration,
                subtasks: task.steps?.map((s: any, i: number) => ({
                  id: s.id ?? i,
                  title: s.name || s.title || "",
                  completed: s.completed ?? false,
                  status: s.status,
                  remainingTime: s.remaining_time,
                })),
              };
              });
              setTodos(mappedTodos);
            }
          }
        } catch (error) {
          console.error("Failed to fetch tasks:", error);
          const savedTodos = localStorage.getItem("adhd-coach-todos");
          if (savedTodos) {
            const parsed: Todo[] = JSON.parse(savedTodos);
            // 统一 status/category 格式，避免数量显示异常
            const normalized: Todo[] = parsed.map(t => {
              const s = String(t.status || "pending").toLowerCase();
              const status: Todo["status"] =
                s === "done" || s === "complete" ? "completed"
                : s === "active" || s === "paused" || s === "completed"
                  ? (s as Todo["status"])
                : "pending";
              const c = String(t.category || "anytime").toLowerCase();
              const category: Todo["category"] =
                c === "morning" || c === "afternoon" || c === "evening"
                  ? (c as "morning" | "afternoon" | "evening")
                : "anytime";
              return { ...t, status, category };
            });
            setTodos(normalized);
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchTasks();
    } else {
      // 开始尝试（未登录）：清除并重置，每次进入都是空白，便于竞赛展示
      if (typeof window !== "undefined") {
        localStorage.removeItem("adhd-coach-todos");
      }
      setTodos([]);
    }
  }, [user, isUserLoaded]);

  // Fetch conversation history when user is logged in (跨页面记忆)
  // Temporarily disabled - uncomment if you want to load history
  /*
  useEffect(() => {
    if (!isUserLoaded || !user) return;

    const fetchConversationHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/api/chat/conversations/${user.id}`);
        if (response.ok) {
          const conversations = await response.json();
          if (conversations && conversations.length > 0) {
            const latestConv = conversations[conversations.length - 1];
            const messages = latestConv.messages || [];
            const formattedMessages: Message[] = messages.map((m: any, idx: number) => ({
              id: idx,
              text: m.content,
              sender: m.role === 'assistant' ? 'bot' : 'user'
            }));
            if (formattedMessages.length > 0) {
              setChatHistory(formattedMessages);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversation history:", error);
      }
    };

    fetchConversationHistory();
  }, [user, isUserLoaded]);
  */

  // Save todos to localStorage as backup（仅登录用户）
  useEffect(() => {
    if (user && todos.length > 0) {
      localStorage.setItem("adhd-coach-todos", JSON.stringify(todos));
    }
  }, [user, todos]);

  const handleAddTodo = async (todo: Todo) => {
    const todoWithId: Todo = {
        ...todo,
        id: todo.id || Date.now() + Math.random(),
        category: todo.category || 'anytime',
        source: 'manual',  // 标记为手动添加
        breakdownStatus: 'none'  // 手动任务没有预拆分
    };

    setTodos((prev) => {
      const exists = prev.find((t) => t.id === todoWithId.id);
      if (exists) {
        return prev.map((t) => (t.id === todoWithId.id ? todoWithId : t));
      }
      return [...prev, todoWithId];
    });

    if (user) {
      try {
        await fetch(`${API_URL}/api/tasks/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            name: todoWithId.title,
            importance: todoWithId.importance || "general",
            estimated_time: todoWithId.duration || "medium",
            steps: todoWithId.subtasks?.map(s => ({ id: s.id, name: s.title, completed: s.completed })) ?? [],
            suggested_period: todoWithId.category || "anytime",
            date: new Date().toISOString().split('T')[0],
            source: "manual",
            breakdown_status: "none",
          }),
        });
      } catch (error) {
        console.error("Error creating task:", error);
      }
    }
    
    if (!todos.find((t) => t.id === todoWithId.id)) triggerCelebration();
    if (window.innerWidth <= 768 && !todos.find((t) => t.id === todoWithId.id)) {
        setTimeout(() => setActiveTab('focus'), 1000);
    }
  };

  const handleAddTodos = async (newTodos: Todo[]) => {
    // 标记为AI聊天同步的任务
    const todosWithSource = newTodos.map(todo => ({
      ...todo,
      source: 'ai_chat' as const,
      breakdownStatus: todo.subtasks && todo.subtasks.length > 0 ? 'completed' as const : 'none' as const
    }));
    setTodos((prev) => [...prev, ...todosWithSource]);
    triggerCelebration();
    if (user && newTodos.length > 0) {
      try {
        const tasks = newTodos.map(todo => ({
          user_id: user.id,
          name: todo.title,
          importance: todo.importance || "general",
          estimated_time: todo.duration || "medium",
          steps: todo.subtasks?.map(s => ({ id: s.id, name: s.title, completed: s.completed })) ?? [],
          suggested_period: todo.category || "anytime",
          date: new Date().toISOString().split('T')[0],
          source: "ai_chat",
          breakdown_status: todo.subtasks && todo.subtasks.length > 0 ? "completed" : "none",
        }));
        await fetch(`${API_URL}/api/tasks/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks }),
        });
      } catch (error) {
        console.error("Error creating tasks:", error);
      }
    }
    if (window.innerWidth <= 768) {
        setTimeout(() => setActiveTab('focus'), 1000);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (user) {
      try {
        await fetch(`${API_URL}/api/tasks/${id}`, { method: 'DELETE' });
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const handleToggleTodoStatus = async (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    let newStatus = todo.status;
    let startedAt: number | undefined;

    if (todo.status === "pending") {
        setSelectedTodo(todo);
        setIsModalOpen(true);
        setActiveSubtask(null);
        newStatus = "active";
        startedAt = todo.startedAt || Date.now();
        setTodos((prev) => prev.map((t) => {
            if (t.id === id) return { ...t, status: "active", startedAt };
            if (t.status === "active") return { ...t, status: "paused" };
            return t;
        }));
    } else if (todo.status === "active" || todo.status === "paused") {
        setSelectedTodo(todo);
        setIsModalOpen(true);
        setActiveSubtask(null);
    } else {
        newStatus = "pending";
        setTodos((prev) => prev.map((t) =>
            t.id === id ? { ...t, status: "pending" } : t
        ));
    }

    if (user && (newStatus === "active" || newStatus === "pending")) {
      try {
        await fetch(`${API_URL}/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, started_at: startedAt }),
        });
      } catch (error) {
        console.error("Error updating task:", error);
      }
    }
  };

  const handleSubtaskToggle = (todoId: number, subtaskId: number) => {
      setTodos((prev) => prev.map((t) => {
          if (t.id === todoId) {
              return {
                  ...t,
                  subtasks: t.subtasks?.map((s) => 
                      s.id === subtaskId ? { ...s, completed: !s.completed } : s
                  )
              };
          }
          return t;
      }));
  };

  const handleSubtaskStart = (todoId: number, subtaskId: number) => {
      const todo = todos.find((t) => t.id === todoId);
      if (!todo || !todo.subtasks) return;
      
      const subtask = todo.subtasks.find((s) => s.id === subtaskId);
      if (!subtask) return;

      // Create a temporary "Todo" object for the modal
      const tempTodo: Todo = {
          id: typeof subtask.id === 'number' ? subtask.id : subtaskId,
          title: subtask.title,
          duration: "25m", // Default duration for subtask
          status: "active",
          importance: todo.importance, // Inherit importance
          remainingTime: subtask.remainingTime, // Pass remaining time if paused
          startedAt: Date.now() // Subtask start time, simpler to just use now for temp modal
      };

      // Also update main todo startedAt if not set
      setTodos((prev) => prev.map((t) => 
        t.id === todoId ? { ...t, startedAt: t.startedAt || Date.now() } : t
      ));

      setSelectedTodo(tempTodo);
      setActiveSubtask({ todoId, subtaskId });
      setIsModalOpen(true);
  };

  const handlePauseTodo = (id: number, remainingTime: number) => {
      if (activeSubtask) {
          // Pause the subtask
          setTodos((prev) => prev.map((t) => {
              if (t.id === activeSubtask.todoId) {
                  return {
                      ...t,
                      subtasks: t.subtasks?.map((s) => 
                          s.id === activeSubtask.subtaskId ? { ...s, status: "paused", remainingTime: remainingTime } : s
                      )
                  };
              }
              return t;
          }));
          setActiveSubtask(null);
      } else {
          // Pause the main todo
          setTodos((prev) => prev.map((t) =>
              t.id === id ? { ...t, status: "paused", remainingTime: remainingTime } : t
          ));
      }
  };

  const handleCompleteFromModal = async (id: number, elapsedSeconds?: number) => {
      const now = Date.now();
      if (activeSubtask) {
          setTodos((prev) => prev.map((t) => {
              if (t.id === activeSubtask.todoId) {
                  return {
                      ...t,
                      subtasks: t.subtasks?.map((s) => 
                          s.id === activeSubtask.subtaskId ? { ...s, completed: true } : s
                      )
                  };
              }
              return t;
          }));
          setActiveSubtask(null);
      } else {
          setTodos((prev) => prev.map((t) =>
              t.id === id ? { 
                  ...t, 
                  status: "completed",
                  completedAt: now,
                  actualDuration: elapsedSeconds
              } : t
          ));
          if (user) {
            try {
              await fetch(`${API_URL}/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: "completed",
                  completed_at: now,
                  actual_duration: elapsedSeconds,
                }),
              });
            } catch (error) {
              console.error("Error completing task:", error);
            }
          }
      }
      triggerCelebration();
  };

  const triggerCelebration = () => {
    setIsCelebrationActive(true);
    setTimeout(() => setIsCelebrationActive(false), 2500);
  };

  return (
    <>
        <div className="app-container">
          {user && isLoading && (
            <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-orange-500 text-white px-4 py-2 rounded-full text-sm">
              Loading tasks...
            </div>
          )}

      {/* Mobile View: Render only active tab. Desktop: wrap for hover overlay */}
      <div
        className={`section-wrapper section-chat ${activeTab === 'chat' ? 'active' : ''}`}
      >
        <div className={`mobile-view ${activeTab === 'chat' ? 'active' : ''}`}>
          <ChatPanel 
              onAddTodo={handleAddTodo} 
              onAddTodos={handleAddTodos}
              todos={todos} 
              userId={user?.id}
              isSignedIn={!!user}
              initialMessage={initialChatMessage}
              onClearInitialMessage={() => setInitialChatMessage("")}
              initialMessages={chatHistory}
          />
        </div>
      </div>
      
      <div
        className={`section-wrapper section-focus ${activeTab === 'focus' ? 'active' : ''}`}
      >
        <div className={`mobile-view ${activeTab === 'focus' ? 'active' : ''}`}>
          <Dashboard 
              todos={todos} 
              onDeleteTodo={handleDeleteTodo} 
              onToggleTodoStatus={handleToggleTodoStatus}
              onAddTodo={handleAddTodo}
              onSubtaskToggle={handleSubtaskToggle}
              onSubtaskStart={handleSubtaskStart}
          />
        </div>
      </div>

      <div
        className={`section-wrapper section-review ${activeTab === 'review' ? 'active' : ''}`}
      >
        <div className={`mobile-view ${activeTab === 'review' ? 'active' : ''}`}>
          <ReviewPanel
              todos={todos}
              userId={user?.id}
              userFullName={user?.fullName}
              userFirstName={user?.firstName}
              userLastName={user?.lastName}
              userEmail={user?.primaryEmailAddress?.emailAddress}
              onNavigateToChat={(msg) => {
                  setInitialChatMessage(msg);
                  setActiveTab('chat');
              }}
          />
        </div>
      </div>

      {/* Desktop View: Always show both (handled by CSS media queries) */}
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Celebration Overlay */}
      <div className={`celebration-overlay ${isCelebrationActive ? "active" : ""}`}>
        <div className="celebration-content">
          <div className="firework-center">
             {isCelebrationActive && Array.from({ length: 60 }).map((_, i) => (
                <ConfettiParticle key={i} />
             ))}
          </div>
        </div>
      </div>

      {/* Task Execution Modal */}
      <TaskModal
        isOpen={isModalOpen}
        todo={selectedTodo ? (todos.find(t => t.id === selectedTodo.id) || selectedTodo) : null}
        onClose={() => { setIsModalOpen(false); setActiveSubtask(null); }}
        onComplete={handleCompleteFromModal}
        onPause={handlePauseTodo}
        onSubtaskToggle={handleSubtaskToggle}
        onUpdateTodo={(updatedTodo) => {
          setTodos(prev => prev.map(t =>
            t.id === updatedTodo.id ? { ...t, ...updatedTodo } : t
          ));
        }}
        userId={user?.id}
      />
    </div>
    </>
  );
}

function ConfettiParticle() {
    const colors = ['#FF6B00', '#10B981', '#3B82F6', '#F43F5E', '#F59E0B'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * 360;
    const velocity = 50 + Math.random() * 200;
    const size = 5 + Math.random() * 10;
    const rad = angle * Math.PI / 180;
    const tx = Math.cos(rad) * velocity;
    const ty = Math.sin(rad) * velocity;
    const rot = Math.random() * 720;

    const style = {
        backgroundColor: color,
        width: `${size}px`,
        height: `${size * 0.4}px`,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        '--tx': `${tx}px`,
        '--ty': `${ty}px`,
        '--rot': `${rot}deg`,
    } as React.CSSProperties;

    return (
        <div 
            className="confetti animate-confetti" 
            style={style}
        />
    );
}
