"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Send, Sparkles, Paperclip, X, FileText as FileIcon, ImageIcon, Sun, Moon, Sunset, Clock } from "lucide-react";
import { Message, Todo } from "@/lib/types";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import DOMPurify from "isomorphic-dompurify";

ChartJS.register(ArcElement, Tooltip, Legend);

// Chat 使用同源代理避免 CORS
const CHAT_API = "/api/chat/completions";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://adhdcoach-backend.onrender.com";

// 提取 AI 返回的实际文本内容，处理各种可能的格式
function extractTextContent(content: any): string {
  if (!content) return '';

  // 如果已经是字符串
  if (typeof content === 'string') {
    // 尝试解析 JSON 数组格式，如：[{"type": "text", "content": "..."}]
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 从数组中提取 content 字段
        for (let i = parsed.length - 1; i >= 0; i--) {
          if (parsed[i] && parsed[i].content) {
            return parsed[i].content;
          }
        }
      }
      // 如果解析成功但不是数组，直接返回
      if (typeof parsed === 'string') return parsed;
      // 如果解析后是对象但有 content 字段
      if (parsed && parsed.content) return parsed.content;
    } catch {
      // 解析失败，返回原始字符串
      return content;
    }
  }

  // 如果是对象且有 content 字段
  if (typeof content === 'object' && content.content) {
    return content.content;
  }

  // 如果是数组，尝试提取
  if (Array.isArray(content) && content.length > 0) {
    for (let i = content.length - 1; i >= 0; i--) {
      if (content[i] && content[i].content) {
        return content[i].content;
      }
    }
  }

  return String(content);
}

// 去除 Markdown 格式，让文本更易读
function stripMarkdown(text: string): string {
  if (!text) return text;

  // 首先提取实际文本内容，以防传入的是对象或数组
  const extracted = extractTextContent(text);
  if (extracted !== text) return stripMarkdown(extracted);

  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // **粗体** -> 粗体
    .replace(/\*([^*]+)\*/g, '$1')      // *斜体* -> 斜体
    .replace(/`([^`]+)`/g, '$1')        // `代码` -> 代码
    .replace(/```[\s\S]*?```/g, '')      // 代码块 -> 移除
    .replace(/^#{1,6}\s+/gm, '')        // # 标题 -> 移除
    .replace(/^[\s]*[-*+][\s]+/gm, '')  // 列表项 -> 移除
    .replace(/^\s*\d+\.\s+/gm, '')      // 数字列表 -> 移除
    .replace(/\n{3,}/g, '\n\n')         // 多个换行 -> 两个
    .trim();
}

async function callChatAPI(message: string, userId?: string, context?: any, history?: any[], token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(CHAT_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      user_id: userId || "anonymous",
      history: history || [],
      context: context || {
        chatMode: "general",
        localTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      }
    })
  });
  return response.json();
}

async function syncTasksToBackend(userId: string, date: string, tasks: any[], token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/chat/sync_tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_id: userId, date, tasks })
  });
  return response.json();
}

interface ChatPanelProps {
  onAddTodo: (todo: Todo) => void;
  onAddTodos: (todos: Todo[]) => void;
  todos: Todo[];
  userId?: string;
  isSignedIn?: boolean;  // Authentication status
  initialMessage?: string;
  onClearInitialMessage?: () => void;
  initialMessages?: Message[];  // For loading conversation history
}

export default function ChatPanel({ onAddTodo, onAddTodos, todos, userId, isSignedIn, initialMessage, onClearInitialMessage, initialMessages }: ChatPanelProps) {
  const { getToken } = useAuth();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (initialMessage) {
        if (initialMessage.includes("【复盘分析请求】")) {
             const userMsg: Message = {
                id: Date.now(),
                text: "📊 我已生成复盘报告，请帮我分析。",
                sender: "user"
             };
             setMessages(prev => [...prev, userMsg]);
             setIsThinking(true);
             // Call real API (no mock) - pass empty history for initial message
             callChatAPI(initialMessage, userId, undefined, []).then((response) => {
                setIsThinking(false);
                if (response.success && response.data) {
                  setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: stripMarkdown(response.data.summary || response.data.reply || "收到您的复盘请求。"),
                    sender: "bot"
                  }]);
                } else {
                  setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: `接口返回异常：${(response as any)?.message || "请检查后端服务"}`,
                    sender: "bot"
                  }]);
                }
             }).catch((error) => {
                console.error("Review API failed:", error);
                setIsThinking(false);
                setMessages(prev => [...prev, {
                  id: Date.now() + 1,
                  text: "AI 接口连接失败，请检查后端服务。",
                  sender: "bot"
                }]);
             });
        } else {
             setInput(initialMessage);
        }
        if (onClearInitialMessage) onClearInitialMessage();
    }
  }, [initialMessage, onClearInitialMessage, userId]);

  // Initialize messages from history when component mounts
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `👋 欢迎！我是你的 Focus AI —— 一个融合 CBT 认知疗法与 ADHD 教练经验的专属伙伴，专门帮你把压力拆解成小步骤，转化为清晰可行的动力。

我会把你模糊的焦虑或拖延，变成几分钟内能完成的微小任务，并同步到右侧时间轴，让你一眼看清"下一步该做什么"。

💡 你可以这样开始：
🧩 点「梳理任务」→ 把乱糟糟的想法整理成待办清单
💬 点「安慰一下」→ 我需要情绪支持时，给我一句温柔的话
📊 点「上周复盘」→ 回顾过去一周，看看哪些做得好、哪里可以调整

你不需要想太多——现在就可以随便点一个按钮，我们立刻迈出第一步！✨

（或者直接对我说："我今天好累…"、"我不知道从哪开始…" 我也随时在听）`,
      sender: "bot",
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatStage, setChatStage] = useState<'idle' | 'waiting_for_task_details' | 'waiting_for_time_slot' | 'waiting_for_file_clarification' | 'waiting_for_review_followup'>('idle');
  const [pendingTaskTitle, setPendingTaskTitle] = useState("");
  const [pendingFileName, setPendingFileName] = useState("");

  // AI 规划的任务选择 - 表格形式
  const [pendingTasks, setPendingTasks] = useState<{
    title: string;
    duration: string;      // "15m" | "30m" | "60m" | ">60m"
    importance: string;     // "routine" | "normal" | "high"
    period: string;        // "morning" | "afternoon" | "evening" | "anytime"
    selected: boolean;
    subtasks?: Array<{ name: string }>;
  }[]>([]);

  // Duration options
  const DURATION_OPTIONS = [
    { value: "15m", label: "15分钟" },
    { value: "30m", label: "30分钟" },
    { value: "60m", label: "60分钟" },
    { value: ">60m", label: ">60分钟" },
  ];

  // Importance options
  const IMPORTANCE_OPTIONS = [
    { value: "routine", label: "日常" },
    { value: "normal", label: "一般" },
    { value: "high", label: "重要" },
  ];

  // Period options
  const PERIOD_OPTIONS = [
    { value: "morning", label: "上午" },
    { value: "afternoon", label: "下午" },
    { value: "evening", label: "晚上" },
    { value: "anytime", label: "随时" },
  ];

  // Get display label for duration
  const getDurationLabel = (value: string) => DURATION_OPTIONS.find(o => o.value === value)?.label || value;

  // Get display label for importance
  const getImportanceLabel = (value: string) => IMPORTANCE_OPTIONS.find(o => o.value === value)?.label || value;

  // Get display label for period
  const getPeriodLabel = (value: string) => PERIOD_OPTIONS.find(o => o.value === value)?.label || value;

  const [selectedFile, setSelectedFile] = useState<{ name: string; type: 'image' | 'file' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const isImage = file.type.startsWith('image/');
        setSelectedFile({
            name: file.name,
            type: isImage ? 'image' : 'file'
        });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    const userMsg: Message = {
      id: Date.now() + Math.random(),
      text: input,
      sender: "user",
      attachment: selectedFile ? { ...selectedFile } : undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    const hasAttachment = !!selectedFile;

    setInput("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input

    setIsThinking(true);

    // Build conversation history for context
    const history = messages
      .filter(m => m.sender === 'user' || m.sender === 'bot')
      .map(m => ({
        role: m.sender === 'bot' ? 'assistant' : m.sender,
        content: m.text
      }));

    // Call backend API with context
    try {
      // Get Clerk token for authentication
      const token = isSignedIn ? await getToken() : undefined;

      const context = {
        chatMode: "general", // Will be detected by backend
        localTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        currentTasks: todos.map(t => ({
          name: t.title,
          status: t.status,
          category: t.category
        }))
      };
      const response = await callChatAPI(currentInput, userId, context, history, token || undefined);
      setIsThinking(false);

      if (response?.success && response?.data) {
        const data = response.data;

        // Handle task_plan response type separately - contains both summary and tasks
        if (data.responseType === "task_plan" && data.tasks && data.tasks.length > 0) {
          // Extract summary as text content
          let textContent = data.summary || "我为您规划了今天的任务";

          const botMsg: Message = {
            id: Date.now() + 1,
            text: stripMarkdown(textContent),
            sender: "bot"
          };
          setMessages(prev => [...prev, botMsg]);

          // Map tasks for selection UI
          const tasksWithSelection = data.tasks.map((t: any) => ({
            title: t.name || t.title || '',
            duration: t.planned_duration || t.duration || '30m',
            importance: t.importance || 'normal',
            period: t.category || t.suggested_period || 'anytime',
            note: t.note,
            subtasks: t.subtasks || [],
            selected: true
          }));
          setPendingTasks(tasksWithSelection);

          setMessages(prev => [...prev, {
            id: Date.now() + 2,
            text: `我为您规划了 ${tasksWithSelection.length} 个任务，请选择您想要保留的：`,
            sender: "bot"
          }]);
        }
        // Handle text response type
        else {
          // Extract text content with multiple fallback layers
          let textContent = "";

          // Priority 1: responseType === "text" with content
          if (data.responseType === "text" && data.content) {
            textContent = data.content;
          }
          // Priority 2: Has content field directly
          else if (data.content) {
            textContent = data.content;
          }
          // Priority 3: Has summary field
          else if (data.summary) {
            textContent = data.summary;
          }

          // Final fallback
          if (!textContent || textContent.trim() === "") {
            textContent = "收到您的消息了！";
          }

          // Detect if content looks like raw JSON (starts with [ or {)
          const looksLikeJSON = /^\s*[\[{]/.test(textContent);
          if (looksLikeJSON) {
            // Try to extract text from JSON
            const extracted = extractTextContent(textContent);
            if (extracted && extracted !== textContent) {
              textContent = extracted;
            } else {
              textContent = "我已收到您的请求，正在处理中...";
            }
          }

          const botMsg: Message = {
            id: Date.now() + 1,
            text: stripMarkdown(textContent),
            sender: "bot"
          };
          setMessages(prev => [...prev, botMsg]);

          // Handle task generation separately (for other response types)
          if (data.tasks && data.tasks.length > 0) {
            const tasksWithSelection = data.tasks.map((t: any) => ({
              title: t.name || t.title || '',
              duration: t.planned_duration || t.duration || '30m',
              importance: t.importance || 'normal',
              period: t.category || t.suggested_period || 'anytime',
              note: t.note,
              selected: true
            }));
            setPendingTasks(tasksWithSelection);

            setMessages(prev => [...prev, {
              id: Date.now() + 2,
              text: `我为您规划了 ${tasksWithSelection.length} 个任务，请选择您想要保留的：`,
              sender: "bot"
            }]);
          }
        }
      } else {
        // API returned but no success - show error (no mock fallback)
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: `接口返回异常：${(response as any)?.message || "请检查后端服务"}`,
          sender: "bot"
        }]);
      }
    } catch (error) {
      console.error("API call failed:", error);
      // No mock fallback - show connection error for backend verification
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "AI 接口连接失败，请检查后端服务是否正常。",
        sender: "bot"
      }]);
    }
  };

  const processMessage = (text: string, hasAttachment: boolean = false) => {
    
    // 1. Handling File + "Sort Tasks" (or just file initially for sorting)
    // TODO: [Backend Integration] Implement file upload and parsing logic here
    if (hasAttachment && (text.includes("日程") || text.includes("梳理") || chatStage === 'idle')) {
         if (selectedFile) setPendingFileName(selectedFile.name);
         setTimeout(() => {
            setIsThinking(false);
            setChatStage('waiting_for_file_clarification');
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: `收到您的文件${selectedFile?.name ? ` ${selectedFile.name}` : ''}。正在解析... \n\n解析发现文件中包含多个待办事项。您想先规划哪个部分？另外，您希望安排在什么时间段（上午/下午/晚上）执行？`,
                sender: 'bot'
            }]);
         }, 1000);
         return;
    }

    // 2. Task Sorting Flow (Initial - No File)
    if (text === "帮我理清思路，创建日程" || (chatStage === 'idle' && text.includes("日程"))) {
      setTimeout(() => {
        setIsThinking(false);
        setChatStage('waiting_for_task_details');
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: "好的，请告诉我您具体想梳理哪些任务？或者上传相关的图片/文件，我来帮您规划。",
            sender: "bot",
          },
        ]);
      }, 500);
    } 
    // 3. User provided Task Details -> Ask for Time Slot
    else if (chatStage === 'waiting_for_task_details') {
        setPendingTaskTitle(text); // Save the task title for later
        setTimeout(() => {
            setIsThinking(false);
            setChatStage('waiting_for_time_slot');
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    text: "收到。这项任务您打算安排在哪个时间段完成呢？（建议：上午适合专注，下午适合协作）",
                    sender: "bot"
                }
            ]);
        }, 1000);
    }
    // 4. User provided Time Slot OR File Clarification -> Generate Plan
    else if (chatStage === 'waiting_for_time_slot' || chatStage === 'waiting_for_file_clarification') {
        setTimeout(() => {
            setIsThinking(false);
            setChatStage('idle');
            
            const replyText = "没问题，根据您的要求，我为您规划了以下日程。您觉得这样规划可以吗？";
            
            // Determine time category based on user input
            let category: 'morning' | 'afternoon' | 'evening' | 'anytime' = 'anytime';
            if (text.includes('上午') || text.includes('早')) category = 'morning';
            else if (text.includes('下午')) category = 'afternoon';
            else if (text.includes('晚上') || text.includes('晚')) category = 'evening';

            // Determine task title
            let taskTitle = "文件待办事项";
            if (chatStage === 'waiting_for_time_slot' && pendingTaskTitle) {
                taskTitle = pendingTaskTitle;
            } else if (chatStage === 'waiting_for_file_clarification') {
                // Mocking AI synthesized title from file content (instead of using filename directly)
                taskTitle = "智能解析待办清单"; 
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    text: replyText,
                    sender: "bot"
                },
                {
                  id: Date.now() + 1,
                  text: "",
                  sender: "bot",
                  type: "task-bubble",
                  task: {
                    id: 0,
                    title: taskTitle, 
                    duration: "45m", // Total duration
                    status: "pending",
                    importance: "high",
                    category: category,
                    subtasks: [
                        { id: 1, title: "快速浏览全文，标记关键信息", completed: false },
                        { id: 2, title: "提取核心待办事项与截止日期", completed: false },
                        { id: 3, title: "整理为清单并分配优先级", completed: false }
                    ]
                  }, 
                }
            ]);
            setPendingTaskTitle(""); // Reset
        }, 1500);
    }
    // 3. Emotional Support
    else if (text === "好烦，今天啥也没干，安慰我一下。") {
      setTimeout(() => {
        setIsThinking(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: "先抱抱你，这种“卡住了”的感觉真的很辛苦。别掉进大脑的陷阱：当你觉得“今天啥也没干”时，其实你已经在脑内和焦虑抗争了一整天，这本身就极其消耗能量。放下对“翻盘”的执着：过去的小时已经过去了，现在的你不需要补救一整天的进度，只需要给当下按下一个“微型重启键”。你的价值不等于产出：即便大脑今天不在状态，你依然是那个优秀的自己。我们先从这两件 30 秒能完成的小事开始，找回一点掌控感：",
            sender: "bot",
          },
        ]);

        setTimeout(() => {
           setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              text: "",
              sender: "bot",
              type: "task-bubble",
              task: {
                  id: Date.now(),
                  title: "放下手机并深呼吸三次",
                  duration: "～30s",
                  status: "pending"
              }
            }
           ]);
        }, 1500);
      }, 500);
    } 
    // 4. Review Request Handling
    else if (text.includes("复盘分析请求") || text === "分析我最近一周的时间使用情况，并给出改进建议。") {
        setTimeout(() => {
            setIsThinking(false);
            setChatStage('waiting_for_review_followup');
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    text: "收到您的复盘数据。嘿，咱们一起来看看上周的成果...\n\n核心洞察：\n1. 高效爆发：周二和周四上午是你最专注的时段，完成了大部分高难度工作。\n2. 启动阻力：周一和周三下午出现了较长的“等待模式”，可能是任务拆解不够细致导致的。\n3. 留白时间：周末的休息时间很充足，这很好，有助于恢复精力。\n\n下周改进建议：\n1. 微调周一：尝试在周一早晨只安排 3 个简单的“热身任务”，降低启动门槛。\n2. 利用黄金时段：将最困难的创造性工作固定在上午 9-11 点进行。\n\n您想针对哪一点深入聊聊吗？",
                    sender: "bot"
                }
            ]);
            // Optional: Show chart if it's the weekly review
            if (text.includes("最近一周")) {
                setTimeout(() => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now() + 1,
                            text: "",
                            sender: "bot",
                            type: "chart-bubble"
                        }
                    ]);
                }, 500);
            }
        }, 1000);
    } 
    // 5. Review Follow-up
    else if (chatStage === 'waiting_for_review_followup') {
        setTimeout(() => {
            setIsThinking(false);
            setChatStage('idle');
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    text: "明白。关于这一点，通常是因为任务启动时的心理摩擦力过大。试着把任务拆解得更小，或者用“5分钟原则”骗过大脑的杏仁核，往往能收到奇效。我们可以一起制定一个明天的微行动计划吗？",
                    sender: "bot"
                }
            ]);
        }, 1000);
    }
    // 6. Default Fallback
    else {
      setTimeout(() => {
        setIsThinking(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: "我在听，请继续说。",
            sender: "bot",
          },
        ]);
      }, 500);
    }
  };

  const handleHeaderClick = () => {
    // Mock data injection disabled - use real backend API only
  };

  return (
    <aside className="panel-left">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
          marginTop: "0px",
          cursor: "pointer",
          minWidth: 0,
          flexShrink: 0,
        }}
        onClick={handleHeaderClick}
      >
        <img src="/logo2.png" alt="Focus AI" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }} />
        <h2 style={{ fontSize: "clamp(20px, 6vw, 32px)", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--color-text-main)", lineHeight: 1, margin: 0, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>NextCue 教练</h2>
      </header>

      <div className="chat-history" id="chat-history">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender} ${msg.type === 'task-bubble' || msg.type === 'chart-bubble' ? 'bg-transparent p-0' : ''}`}>
            {msg.attachment && (
                <div style={{ 
                    marginBottom: 8, 
                    padding: 8, 
                    background: 'rgba(0,0,0,0.05)', 
                    borderRadius: 8, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    maxWidth: 200
                }}>
                    {msg.attachment.type === 'image' ? <ImageIcon size={16} /> : <FileIcon size={16} />}
                    <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.attachment.name}</span>
                </div>
            )}
            {msg.type === "task-bubble" && msg.task ? (
                msg.task.title === "项目策划书" ? (
                    // Hardcoded Project Proposal Table
                     <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "16px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 600, letterSpacing: "0.5px" }}>任务名称</th>
                                    <th style={{ textAlign: "right", padding: "8px 0", fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 600, letterSpacing: "0.5px" }}>时长</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <td style={{ padding: "12px 0", fontSize: "14px", fontWeight: 500, color: "var(--color-text-main)" }}>梳理大纲</td>
                                    <td style={{ padding: "12px 0", fontSize: "12px", color: "var(--color-text-secondary)", textAlign: "right" }}>~30m</td>
                                </tr>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <td style={{ padding: "12px 0", fontSize: "14px", fontWeight: 500, color: "var(--color-text-main)" }}>起草核心章节</td>
                                    <td style={{ padding: "12px 0", fontSize: "12px", color: "var(--color-text-secondary)", textAlign: "right" }}>30-60m</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "12px 0", fontSize: "14px", fontWeight: 500, color: "var(--color-text-main)" }}>回顾与格式调整</td>
                                    <td style={{ padding: "12px 0", fontSize: "12px", color: "var(--color-text-secondary)", textAlign: "right" }}>&gt;60m</td>
                                </tr>
                            </tbody>
                        </table>
                        <button 
                            onClick={() => {
                                // Create a single task with subtasks
                                onAddTodo({
                                    id: Date.now() + Math.random(),
                                    title: "项目策划书",
                                    duration: ">60m",
                                    status: "pending",
                                    importance: "high",
                                    category: "anytime",
                                    subtasks: [
                                        { id: 1, title: "梳理大纲", completed: false },
                                        { id: 2, title: "起草核心章节", completed: false },
                                        { id: 3, title: "回顾与格式调整", completed: false }
                                    ]
                                });
                            }}
                            style={{ width: "100%", backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", border: "none", padding: "10px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background-color 0.2s" }}>
                            确认并生成日程
                        </button>
                    </div>
                ) : (
                    // Single Task Bubble
                    <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "16px" }}>
                        {msg.task.subtasks && msg.task.subtasks.length > 0 && (
                            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text-main)" }}>{msg.task.title}</span>
                                {msg.task.category && (
                                    <span style={{ 
                                        fontSize: 10, 
                                        padding: '2px 6px', 
                                        borderRadius: 4, 
                                        background: 'var(--color-bg-surface-hover)', 
                                        color: 'var(--color-text-secondary)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3
                                    }}>
                                        {msg.task.category === 'morning' && <><Sun size={10} /> 上午</>}
                                        {msg.task.category === 'afternoon' && <><Sunset size={10} /> 下午</>}
                                        {msg.task.category === 'evening' && <><Moon size={10} /> 晚上</>}
                                        {msg.task.category === 'anytime' && <><Clock size={10} /> 随时</>}
                                    </span>
                                )}
                            </div>
                        )}
                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 600, letterSpacing: "0.5px" }}>任务名称</th>
                                    <th style={{ textAlign: "right", padding: "8px 0", fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 600, letterSpacing: "0.5px" }}>时长</th>
                                </tr>
                            </thead>
                            <tbody>
                                {msg.task.subtasks && msg.task.subtasks.length > 0 ? (
                                    msg.task.subtasks.map((sub, idx) => (
                                        <tr key={sub.id} style={{ borderBottom: idx < (msg.task?.subtasks?.length || 0) - 1 ? "1px solid var(--color-bg-surface-hover)" : "none" }}>
                                            <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 400, color: "var(--color-text-main)" }}>
                                                {sub.title}
                                            </td>
                                            <td style={{ padding: "10px 0", fontSize: "12px", color: "var(--color-text-secondary)", textAlign: "right" }}>
                                                {idx === 0 ? "10m" : idx === 1 ? "20m" : "15m"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td style={{ padding: "12px 0", fontSize: "14px", fontWeight: 500, color: "var(--color-text-main)" }}>
                                            {msg.task.title}
                                            {msg.task.category && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                    <span style={{ 
                                                        fontSize: 10, 
                                                        padding: '2px 6px', 
                                                        borderRadius: 4, 
                                                        background: 'var(--color-bg-surface-hover)', 
                                                        color: 'var(--color-text-secondary)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 3
                                                    }}>
                                                        {msg.task.category === 'morning' && <><Sun size={10} /> 上午</>}
                                                        {msg.task.category === 'afternoon' && <><Sunset size={10} /> 下午</>}
                                                        {msg.task.category === 'evening' && <><Moon size={10} /> 晚上</>}
                                                        {msg.task.category === 'anytime' && <><Clock size={10} /> 随时</>}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: "12px 0", fontSize: "12px", color: "var(--color-text-secondary)", textAlign: "right", verticalAlign: 'top' }}>{msg.task.duration}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <button 
                            onClick={() => msg.task && onAddTodo({ ...msg.task, id: Date.now() + Math.random(), category: msg.task.category || 'anytime' })}
                            style={{ width: "100%", backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)", border: "none", padding: "10px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background-color 0.2s" }}>
                            确认并生成日程
                        </button>
                    </div>
                )
            ) : msg.type === "chart-bubble" ? (
                <div style={{ background: "var(--color-bg-surface)", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-border)", maxWidth: "100%" }}>
                    <h4 style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)" }}>上周时间分布</h4>
                    <div style={{ position: "relative", height: "200px", width: "100%" }}>
                        <Doughnut 
                            data={{
                                labels: ['高效执行期', '日常杂务', '启动阻力/等待', '留白/未知'],
                                datasets: [{
                                    data: [30, 25, 20, 25],
                                    backgroundColor: ['#4A8C6F', '#F5A623', '#E87461', '#E4E4E7'],
                                    borderWidth: 0,
                                    hoverOffset: 10
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                cutout: '60%',
                                plugins: { legend: { display: false } }
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text.replace(/\n/g, "<br/>")) }} />
            )}
          </div>
        ))}
        {isThinking && (
          <div className="message bot">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* Task Selection UI */}
        {pendingTasks.length > 0 && (
          <div className="task-selection">
            <div className="task-selection-header">
              <span>选择要保留的任务</span>
              <button
                className="select-all-btn"
                onClick={() => setPendingTasks(prev => prev.map(t => ({ ...t, selected: !prev.every(p => p.selected) })))}
              >
                {pendingTasks.every(t => t.selected) ? "取消全选" : "全选"}
              </button>
            </div>
            {/* Table Header */}
            <div className="task-table-header">
              <div className="task-col-checkbox"></div>
              <div className="task-col-title">任务</div>
              <div className="task-col-duration">时长</div>
              <div className="task-col-importance">重要性</div>
              <div className="task-col-period">时间段</div>
            </div>
            <div className="task-selection-list">
              {pendingTasks.map((task, index) => (
                <div
                  key={index}
                  className={`task-table-row ${task.selected ? 'selected' : ''}`}
                >
                  {/* Checkbox */}
                  <div
                    className="task-col-checkbox"
                    onClick={() => {
                      setPendingTasks(prev => prev.map((t, i) =>
                        i === index ? { ...t, selected: !t.selected } : t
                      ));
                    }}
                  >
                    <div className={`task-checkbox ${task.selected ? 'checked' : ''}`}>
                      {task.selected && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                    </div>
                  </div>

                  {/* Task Title */}
                  <div className="task-col-title">
                    {task.title}
                  </div>

                  {/* Duration Options */}
                  <div className="task-col-duration">
                    <div className="option-buttons">
                      {DURATION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={`option-btn ${task.duration === opt.value ? 'active' : ''}`}
                          onClick={() => {
                            setPendingTasks(prev => prev.map((t, i) =>
                              i === index ? { ...t, duration: opt.value } : t
                            ));
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Importance Options - 颜色与任务页对齐：日常#5BB5E0 一般#F5A623 重要#E87461 */}
                  <div className="task-col-importance">
                    <div className="option-buttons">
                      {IMPORTANCE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={`option-btn ${task.importance === opt.value ? `active importance-${opt.value}` : ''}`}
                          onClick={() => {
                            setPendingTasks(prev => prev.map((t, i) =>
                              i === index ? { ...t, importance: opt.value } : t
                            ));
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Period Options */}
                  <div className="task-col-period">
                    <div className="option-buttons">
                      {PERIOD_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={`option-btn ${task.period === opt.value ? 'active' : ''}`}
                          onClick={() => {
                            setPendingTasks(prev => prev.map((t, i) =>
                              i === index ? { ...t, period: opt.value } : t
                            ));
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="task-selection-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setPendingTasks([]);
                  setMessages(prev => [...prev, {
                    id: Date.now() + 100,
                    text: "已取消任务选择。有什么其他我可以帮您的吗？",
                    sender: "bot"
                  }]);
                }}
              >
                取消
              </button>
              <button
                className="add-selected-btn"
                onClick={async () => {
                  const selectedTasks = pendingTasks.filter(t => t.selected);
                  if (selectedTasks.length === 0) {
                    setPendingTasks([]);
                    return;
                  }

                  // Convert to Todo format
                  const todos = selectedTasks.map((t, i) => ({
                    id: Date.now() + i,
                    title: t.title,
                    duration: t.duration,
                    plannedDuration: t.duration,
                    status: 'pending' as const,
                    importance: t.importance as 'high' | 'normal',
                    category: t.period as 'anytime' | 'morning' | 'afternoon' | 'evening',
                    subtasks: []
                  }));

                  onAddTodos(todos);

                  // Sync to backend
                  const today = new Date().toISOString().split('T')[0];
                  const backendTasks = selectedTasks.map(t => ({
                    title: t.title,
                    importance: t.importance,
                    planned_duration: t.duration,
                    suggested_period: t.period,
                    subtasks: []
                  }));

                  if (isSignedIn && userId) {
                    const syncToken = await getToken();
                    syncTasksToBackend(userId, today, backendTasks, syncToken || undefined);
                  }

                  setPendingTasks([]);
                  setMessages(prev => [...prev, {
                    id: Date.now() + 100,
                    text: `已添加 ${selectedTasks.length} 个任务到您的待办列表`,
                    sender: "bot"
                  }]);
                }}
              >
                确定同步 {pendingTasks.filter(t => t.selected).length} 个任务
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
        }

        .typing-indicator span {
          display: inline-block;
          width: 6px;
          height: 6px;
          background-color: var(--color-text-muted);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 40% { 
            transform: scale(1);
          }
        }

        .file-preview-bar {
            padding: 0 16px 8px;
            display: flex;
        }
        .file-preview-item {
            display: flex;
            align-items: center;
            gap: 6px;
            background: var(--color-bg-surface-hover);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            color: var(--color-text-main);
            border: 1px solid var(--color-border);
        }
        .btn-remove-file {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            padding: 2px;
            color: var(--color-text-muted);
        }
        .btn-remove-file:hover {
            color: var(--color-error);
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          background-color: var(--color-bg-surface);
          border: 1px solid var(--color-border);
          border-radius: 24px;
          padding: 4px 4px 4px 12px;
          gap: 8px;
        }

        .chat-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          padding: 8px;
          color: var(--color-text-main);
          margin-left: 4px;
        }

        .btn-attach {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: transparent;
            color: var(--color-text-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .btn-attach:hover {
            background-color: var(--color-bg-highlight);
            color: var(--color-text-main);
        }

        .btn-send {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-left: 4px;
        }

        .btn-send:hover {
          background-color: var(--color-primary-hover);
        }

        .task-selection {
          background: var(--color-bg-surface);
          border-radius: 16px;
          padding: 16px;
          margin: 8px 0;
        }

        .task-selection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-main);
        }

        .select-all-btn {
          background: none;
          border: none;
          color: var(--color-primary);
          font-size: 12px;
          cursor: pointer;
        }

        .task-selection-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid var(--color-border);
          border-radius: 12px;
          overflow: hidden;
        }

        /* Table Header */
        .task-table-header {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          background: var(--color-bg-highlight);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          border-bottom: 1px solid var(--color-border);
        }

        .task-col-checkbox {
          width: 40px;
          flex-shrink: 0;
        }

        .task-col-title {
          flex: 1;
          min-width: 120px;
        }

        .task-col-duration,
        .task-col-importance,
        .task-col-period {
          width: 200px;
          min-width: 180px;
          flex-shrink: 0;
          padding: 0 8px;
          display: flex;
          align-items: center;
        }

        /* Table Row */
        .task-table-row {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          background: white;
          border-bottom: 1px solid var(--color-border);
          transition: all 0.2s;
        }

        .task-table-row:last-child {
          border-bottom: none;
        }

        .task-table-row.selected {
          background: rgba(255, 167, 0, 0.05);
        }

        .task-table-row:hover {
          background: var(--color-bg-highlight);
        }

        .task-col-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .task-col-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-main);
        }

        /* Option Buttons */
        .option-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .option-btn {
          font-size: 11px;
          padding: 4px 8px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: white;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .option-btn:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .option-btn.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        /* 重要性列：与任务页颜色体系对齐 */
        .task-col-importance .option-btn.active.importance-routine {
          background: #5BB5E0;
          border-color: #5BB5E0;
          color: white;
        }
        .task-col-importance .option-btn.active.importance-normal {
          background: #F5A623;
          border-color: #F5A623;
          color: white;
        }
        .task-col-importance .option-btn.active.importance-high {
          background: #E87461;
          border-color: #E87461;
          color: white;
        }

        /* Checkbox */
        .task-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .task-checkbox:hover {
          border-color: var(--color-primary);
        }

        .task-checkbox.checked {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }
        }

        .task-selection-buttons {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .cancel-btn {
          flex: 1;
          padding: 12px;
          background: transparent;
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .cancel-btn:hover {
          background: var(--color-bg-surface-hover);
        }

        .add-selected-btn {
          flex: 2;
          padding: 12px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .add-selected-btn:hover {
          background: var(--color-primary-hover);
        }
      `}</style>

      <div className="input-area">
        {selectedFile && (
            <div className="file-preview-bar">
                <div className="file-preview-item">
                    {selectedFile.type === 'image' ? <ImageIcon size={14} /> : <FileIcon size={14} />}
                    <span className="filename">{selectedFile.name}</span>
                    <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="btn-remove-file">
                        <X size={12} />
                    </button>
                </div>
            </div>
        )}
        <div className="quick-actions">
          <button className="chip" onClick={() => setInput("帮我理清思路，创建日程")}>梳理任务</button>
          <button className="chip" onClick={() => setInput("好烦，今天啥也没干，安慰我一下。")}>安慰一下</button>
          <button className="chip" onClick={() => setInput("分析我最近一周的时间使用情况，并给出改进建议。")}>上周复盘</button>
        </div>
        <div className="input-wrapper">
          <input 
             type="file" 
             ref={fileInputRef} 
             style={{ display: 'none' }} 
             onChange={handleFileSelect} 
          />
          <button className="btn-attach" onClick={() => fileInputRef.current?.click()}>
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            className="chat-input"
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button className="btn-send" onClick={handleSend}>
            <Send size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
