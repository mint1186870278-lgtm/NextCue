"use client";

import { useState, useMemo, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { User, Zap, Award, CircleDot, Calendar, Table, FileText, MessageSquare, Bell, LogOut } from "lucide-react";
import { Todo } from "@/lib/types";

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://adhdcoach-backend.onrender.com";

interface ReviewPanelProps {
  todos?: Todo[];
  userId?: string;
  userFullName?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  userEmail?: string | null;
  onNavigateToChat?: (message: string) => void;
}

// Mock user profile when API unavailable or not logged in
const MOCK_USER_PROFILE = {
  name: "小绿",
  type: "探索者",
  peakHours: "10:00 - 14:00",
  streak: 3
};

const EMPTY_USER_PROFILE = {
  name: "-",
  type: "-",
  peakHours: "-",
  streak: 0
};

// 默认展示数据（未登录或 API 失败时使用，避免全零导致图表不渲染）
const DEFAULT_CHART_DATA = {
  labels: ['高效执行期', '日常杂务', '启动阻力/等待', '留白/未知'],
  datasets: [{
    data: [30, 25, 20, 25],
    backgroundColor: ['#4A8C6F', '#F5A623', '#E87461', '#E4E4E7'],
    borderWidth: 0,
    hoverOffset: 10
  }]
};

export default function ReviewPanel({
  todos = [],
  userId,
  userFullName,
  userFirstName,
  userLastName,
  userEmail,
  onNavigateToChat
}: ReviewPanelProps) {
  const { signOut } = useClerk();
  // State for API data; use Clerk user info when available, then mock profile
  const [userProfile, setUserProfile] = useState<{
    name: string;
    type: string;
    peakHours: string;
    streak: number;
  }>({
    name: userFullName || userFirstName || userLastName || "User",
    type: "探索者",
    peakHours: "10:00 - 14:00",
    streak: 0
  });
  const [chartData, setChartData] = useState(DEFAULT_CHART_DATA);
  const [focusScore, setFocusScore] = useState<number | null>(85); // 专注分，登录后从 API 计算
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch user profile from API (use Clerk info as fallback)
  useEffect(() => {
    // Build display name from Clerk user info
    const clerkName = userFullName || userFirstName || userLastName || null;

    if (!userId) {
      // Not logged in, use default
      setUserProfile({
        name: clerkName || "User",
        type: "探索者",
        peakHours: "10:00 - 14:00",
        streak: 0
      });
      return;
    }

    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await fetch(`${API_URL}/api/users/profile?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.name) {
            // Use API data if available
            setUserProfile({
              name: data.name,
              type: data.user_type || "探索者",
              peakHours: data.peak_hours || "10:00 - 14:00",
              streak: data.streak || 0
            });
          } else {
            // No API data, use Clerk user info
            setUserProfile({
              name: clerkName || "User",
              type: "探索者",
              peakHours: "10:00 - 14:00",
              streak: 0
            });
          }
        } else {
          // API failed, use Clerk user info
          setUserProfile({
            name: clerkName || "User",
            type: "探索者",
            peakHours: "10:00 - 14:00",
            streak: 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // Use Clerk user info as fallback
        setUserProfile({
          name: clerkName || "User",
          type: "探索者",
          peakHours: "10:00 - 14:00",
          streak: 0
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [userId, userFullName, userFirstName, userLastName]);

  // Fetch weekly stats from API（登录用户接真实数据）
  useEffect(() => {
    if (!userId) {
      setChartData(DEFAULT_CHART_DATA);
      setFocusScore(85);
      return;
    }

    const fetchWeeklyStats = async () => {
      setIsLoadingStats(true);
      try {
        const response = await fetch(`${API_URL}/api/reports/weekly?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.stats) {
            const num = (v: unknown) => (v != null && !isNaN(Number(v)) ? Number(v) : null);
            const ft = num(data.stats.focus_time) ?? 30;
            const rt = num(data.stats.routine_tasks) ?? 25;
            const sb = num(data.stats.starting_barrier) ?? 20;
            const uk = num(data.stats.unkown) ?? 25;
            const arr = [ft, rt, sb, uk];
            const sum = arr.reduce((a, b) => a + b, 0);
            setChartData({
              labels: ['高效执行期', '日常杂务', '启动阻力/等待', '留白/未知'],
              datasets: [{
                data: sum > 0 ? arr : [30, 25, 20, 25],
                backgroundColor: ['#4A8C6F', '#F5A623', '#E87461', '#E4E4E7'],
                borderWidth: 0,
                hoverOffset: 10
              }]
            });
            // 专注分：基于高效占比计算，范围约 0-100
            const score = data.stats.focus_score ?? Math.round(ft * 2.5 + 25);
            setFocusScore(Math.min(100, Math.max(0, score)));
          } else {
            setChartData(DEFAULT_CHART_DATA);
            setFocusScore(85);
          }
        } else {
          setChartData(DEFAULT_CHART_DATA);
          setFocusScore(85);
        }
      } catch (error) {
        console.error("Failed to fetch weekly stats:", error);
        setChartData(DEFAULT_CHART_DATA);
        setFocusScore(85);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchWeeklyStats();
  }, [userId]);

  const [dateRangeStr, setDateRangeStr] = useState("");

  useEffect(() => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);

    const monday = new Date(today);
    monday.setDate(diff);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (date: Date) => `${date.getMonth() + 1}月${date.getDate()}日`;
    setDateRangeStr(`${formatDate(monday)} - ${formatDate(sunday)}`);
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    layout: {
        padding: 10 // Add padding to prevent clipping
    },
    plugins: {
      legend: { display: false }
    }
  };

  // --- New Review Functionality (Added below) ---
  
  // Weekly push settings (persisted in localStorage)
  const PUSH_STORAGE_KEY = 'review-weekly-push';
  const loadPushSettings = () => {
    if (typeof window === 'undefined') return { enabled: true, day: 0 };
    try {
      const raw = localStorage.getItem(PUSH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { enabled: parsed.enabled !== false, day: Math.min(6, Math.max(0, Number(parsed.day) || 0)) };
      }
    } catch (_) {}
    return { enabled: true, day: 0 };
  };
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushDay, setPushDay] = useState(0);
  useEffect(() => {
    const s = loadPushSettings();
    setPushEnabled(s.enabled);
    setPushDay(s.day);
  }, []);
  const savePushSettings = (enabled: boolean, day: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PUSH_STORAGE_KEY, JSON.stringify({ enabled, day }));
  };
  const PUSH_DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  
  // Default to today; when push day matches, auto-load last week
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  
  useEffect(() => {
    if (!pushEnabled) return;
    const now = new Date();
    if (now.getDay() === pushDay) {
      const daysToLastMonday = now.getDay() === 0 ? 7 : now.getDay() + 6;
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - daysToLastMonday);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      const fmt = (d: Date) => d.toISOString().split('T')[0];
      setStartDate(fmt(lastMonday));
      setEndDate(fmt(lastSunday));
    }
  }, [pushEnabled, pushDay]);

  const filteredTodos = useMemo(() => {
    return todos.filter(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      // Convert completedAt timestamp to YYYY-MM-DD in local time
      const dateObj = new Date(t.completedAt);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const completedDate = `${year}-${month}-${day}`;
      
      return completedDate >= startDate && completedDate <= endDate;
    }).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [todos, startDate, endDate]);

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "--:--";
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds?: number, durationStr?: string) => {
    if (seconds !== undefined && seconds !== null) {
      if (seconds < 60) return "< 1分钟";
      const mins = Math.floor(seconds / 60);
      return `${mins}分钟`;
    }
    return durationStr || "未知";
  };

  const generateReport = () => {
    if (filteredTodos.length === 0) return (
        <div className="empty-report">
            <p>该时间段还没有完成的任务哦，快去专注一会吧！</p>
        </div>
    );
    
    const count = filteredTodos.length;
    const totalDuration = filteredTodos.reduce((acc, t) => acc + (t.actualDuration || 0), 0);
    const totalMins = Math.floor(totalDuration / 60);
    
    const highlights = filteredTodos
        .filter(t => t.importance === 'high')
        .map(t => t.title)
        .slice(0, 3) // Top 3
        .join("、");
    
    return (
        <div className="report-content">
            <div className="report-item">
                <span className="bullet">●</span>
                <p><strong>今日高光：</strong> 共完成了 {count} 个任务，专注投入 {totalMins} 分钟。{highlights ? `重点攻克了：${highlights}。` : ""}</p>
            </div>
            <div className="report-item">
                <span className="bullet">●</span>
                <p><strong>状态分析：</strong> {totalMins > 60 ? "今天的专注力爆棚，执行效率很高！" : "保持了基本的执行节奏，循序渐进也是一种进步。"}</p>
            </div>
            <div className="report-item">
                <span className="bullet">●</span>
                <p><strong>明日建议：</strong> {count > 5 ? "今天任务较多，明天可以适当安排轻松一点的任务调节节奏。" : "明天可以尝试挑战一个稍微困难一点的任务。"}</p>
            </div>
        </div>
    );
  };

  const handleChatClick = () => {
    if (onNavigateToChat) {
        const dateRangeText = startDate === endDate ? startDate : `${startDate} 至 ${endDate}`;
        const taskListStr = filteredTodos.map(t => `- ${t.title} (耗时: ${formatDuration(t.actualDuration, t.duration)})`).join('\n');
        
        const reportText = `【复盘分析请求】\n日期范围：${dateRangeText}\n\n我完成了以下任务：\n${taskListStr}\n\n请根据我的完成情况，帮我生成一份简短的复盘报告，并给出针对性的改进建议。`;
        onNavigateToChat(reportText);
    }
  };

  return (
    <div className="review-panel">
      <header className="section-header" style={{ 
          marginBottom: '24px', 
          marginTop: '0px',
          fontSize: '32px',
          fontWeight: 700,
          color: 'var(--color-text-main)',
          lineHeight: 1.2
      }}>
        复盘中心
      </header>

      {/* 1. User Profile Card */}
      <div className="card profile-card">
        <div className="profile-header">
          <div className="avatar-large">
            <User size={32} color="#FFF" />
          </div>
          <div className="profile-info">
            <h3>{userProfile.name}</h3>
            <span className="badge">{userProfile.type}</span>
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-item">
            <Zap size={16} className="stat-icon" />
            <div className="stat-text">
              <label>高效时段</label>
              <span>{userProfile.peakHours}</span>
            </div>
          </div>
          <div className="stat-item">
            <Award size={16} className="stat-icon" />
            <div className="stat-text">
              <label>连续打卡</label>
              <span>{`${userProfile.streak} 天`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Weekly Chart (Restored) */}
      <div className="card chart-card">
        <div className="card-header">
            <h4><CircleDot size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />本周时间分布</h4>
            <span className="date-range">{dateRangeStr}</span>
        </div>
        <div className="chart-container">
            <div className="chart-wrapper" style={{ width: 120, height: 120 }}>
                <Doughnut data={chartData} options={chartOptions} />
                <div className="chart-center-text">
                    <span className="score">{focusScore ?? 85}</span>
                    <span className="label">专注分</span>
                </div>
            </div>
            <div className="legend">
                {(() => {
                  const d = chartData?.datasets?.[0]?.data ?? [30, 25, 20, 25];
                  const total = d.reduce((a: number, b: number) => a + b, 0);
                  const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0;
                  return [
                    { color: '#4A8C6F', label: '高效', val: d[0] ?? 30 },
                    { color: '#F5A623', label: '杂务', val: d[1] ?? 25 },
                    { color: '#E87461', label: '阻力', val: d[2] ?? 20 },
                    { color: '#E4E4E7', label: '留白', val: d[3] ?? 25 },
                  ].map((item, i) => (
                    <div key={i} className="legend-item">
                      <span className="dot" style={{ background: item.color }} />
                      <span>{item.label} ({pct(item.val)}%)</span>
                    </div>
                  ));
                })()}
            </div>
        </div>
      </div>

      {/* --- AI Insight & Review Section (New) --- */}
      
      {/* 3. AI Insights (Report) with Weekly Push + Custom Date Range */}
      <div className="card report-card">
        <div className="card-header card-header-no-border">
            <h4><FileText size={18} className="icon-mr" /> AI 洞察</h4>
        </div>

        {/* 每周推送设置 */}
        <div className="weekly-push-settings">
          <div className="push-row">
            <div className="push-label">
              <Bell size={16} className="icon-mr" />
              <span>每周自动推送</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => {
                  const v = e.target.checked;
                  setPushEnabled(v);
                  savePushSettings(v, pushDay);
                }}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {pushEnabled && (
            <div className="push-day-row">
              <span className="push-day-label">推送日</span>
              <select
                className="push-day-select"
                value={pushDay}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPushDay(v);
                  savePushSettings(pushEnabled, v);
                }}
              >
                {PUSH_DAY_LABELS.map((label, i) => (
                  <option key={i} value={i}>{label}</option>
                ))}
              </select>
              <span className="push-day-hint">每周此日推送上周报告</span>
            </div>
          )}
        </div>

        {/* 分隔：自定义时间段 */}
        <div className="report-divider">
          <span>选择时间段查看报告</span>
        </div>
        
        <div className="date-inputs-embedded">
            <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input-mini"
            />
            <span className="separator">-</span>
            <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input-mini"
            />
        </div>

        <div className="report-body">
            {generateReport()}
        </div>
        <button className="btn-chat-ai" onClick={handleChatClick}>
            <MessageSquare size={18} /> 基于此报告与AI对话
        </button>
      </div>

      {/* 4. Task Table (Still using the shared date range) */}
      <div className="card table-card">
        <div className="card-header">
            <h4><Table size={18} className="icon-mr" /> 待办完成记录</h4>
        </div>
        <div className="table-wrapper">
            <table className="task-table">
                <thead>
                    <tr>
                        <th style={{ width: '40%' }}>待办名</th>
                        <th style={{ width: '35%' }}>执行时间段</th>
                        <th style={{ width: '25%' }}>执行时长</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTodos.length > 0 ? filteredTodos.map(todo => (
                        <tr key={todo.id}>
                            <td className="task-name">{todo.title}</td>
                            <td className="time-period">
                                {formatTime(todo.startedAt)} - {formatTime(todo.completedAt)}
                            </td>
                            <td className="duration">
                                {formatDuration(todo.actualDuration, todo.duration)}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={3} className="empty-cell">暂无记录</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {userId && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button
            type="button"
            title="退出登录"
            onClick={() => signOut?.({ redirectUrl: "/try" })}
            style={{
              padding: 4,
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <LogOut size={12} /> 退出登录
          </button>
        </div>
      )}

      <style jsx>{`
        .review-panel {
            padding: 24px;
            padding-bottom: 40px;
            height: 100%;
            overflow-y: auto;
            background-color: transparent;
            /* Hide scrollbar */
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        @media (max-width: 768px) {
            .review-panel {
                padding-bottom: max(40px, calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 80px));
            }
        }

        .card:last-of-type {
            margin-bottom: 0;
        }
        .review-panel::-webkit-scrollbar {
            display: none;
        }
        
        .card {
            background: #FFFFFF;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: var(--shadow-sm);
        }

        .card-header {
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--color-bg-surface-hover);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-header-no-border {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 12px;
        }

        .card-header h4 {
            font-size: 16px;
            font-weight: 600;
            color: var(--color-text-main);
            display: flex;
            align-items: center;
        }
        
        /* Restored Profile Styles */
        .profile-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
        }
        .avatar-large {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: var(--color-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(255, 107, 0, 0.2);
        }
        .profile-info h3 {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            background: var(--color-bg-surface);
            border-radius: 4px;
            font-size: 12px;
            color: var(--color-text-secondary);
            font-weight: 500;
        }
        .stats-row {
            display: flex;
            gap: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--color-border);
        }
        .stat-item {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .stat-item:first-child .stat-icon {
            color: var(--color-orange);
        }
        .stat-item:last-child .stat-icon {
            color: var(--color-mint);
        }
        .stat-text {
            display: flex;
            flex-direction: column;
        }
        .stat-text label {
            font-size: 10px;
            color: var(--color-text-secondary);
        }
        .stat-text span {
            font-size: 13px;
            font-weight: 600;
        }

        /* Restored Chart Styles */
        .date-range {
            font-size: 12px;
            color: var(--color-text-muted);
        }
        .chart-container {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .chart-wrapper {
            position: relative;
            width: 120px;
            height: 120px;
            flex-shrink: 0;
        }
        .chart-center-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .score {
            font-size: 24px;
            font-weight: 700;
            line-height: 1;
            color: var(--color-text-main);
        }
        .label {
            font-size: 10px;
            color: var(--color-text-muted);
        }
        .legend {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: var(--color-text-secondary);
        }
        .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 2px;
            flex-shrink: 0;
        }

        /* Helper for icons */
        :global(.icon-mr) {
            margin-right: 8px;
            color: var(--color-primary);
        }

        .weekly-push-settings {
            background: var(--color-bg-surface-hover);
            border-radius: var(--radius-md);
            padding: 14px 16px;
            margin-bottom: 16px;
        }
        .push-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .push-label {
            display: flex;
            align-items: center;
            font-size: 14px;
            font-weight: 500;
            color: var(--color-text-main);
        }
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
        }
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            border-radius: 24px;
            transition: 0.3s;
        }
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            border-radius: 50%;
            transition: 0.3s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .toggle-switch input:checked + .toggle-slider {
            background-color: var(--color-primary);
        }
        .toggle-switch input:checked + .toggle-slider:before {
            transform: translateX(20px);
        }
        .push-day-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--color-border);
        }
        .push-day-label {
            font-size: 13px;
            color: var(--color-text-secondary);
        }
        .push-day-select {
            padding: 6px 10px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: 13px;
            color: var(--color-text-main);
            background: #fff;
            font-family: inherit;
        }
        .push-day-hint {
            font-size: 12px;
            color: var(--color-text-muted);
        }
        .report-divider {
            font-size: 12px;
            color: var(--color-text-muted);
            margin-bottom: 12px;
        }

        .date-inputs-embedded {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 8px;
            margin-bottom: 16px;
        }

        .date-input-mini {
            padding: 6px 10px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: 13px;
            color: var(--color-text-main);
            background: var(--color-bg-surface);
            font-family: inherit;
            width: 140px;
        }

        .separator {
            color: var(--color-text-muted);
            font-size: 14px;
        }

        /* Table */
        .table-wrapper {
            overflow-x: auto;
        }

        .task-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        .task-table th {
            text-align: left;
            padding: 8px 4px;
            color: var(--color-text-secondary);
            font-weight: 500;
            border-bottom: 1px solid var(--color-border);
        }

        .task-table td {
            padding: 12px 4px;
            border-bottom: 1px solid var(--color-bg-surface-hover);
            color: var(--color-text-main);
            vertical-align: middle;
        }

        .task-table tr:last-child td {
            border-bottom: none;
        }

        .task-name {
            font-weight: 500;
        }
        
        .time-period, .duration {
            color: var(--color-text-secondary);
            font-variant-numeric: tabular-nums;
        }

        .empty-cell {
            text-align: center;
            color: #CCCCCC; /* Lighter gray */
            padding: 24px !important;
        }

        /* Report */
        .report-body {
            background: var(--color-bg-surface-hover);
            padding: 16px;
            border-radius: var(--radius-md);
            margin-bottom: 16px;
        }

        .report-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .report-item:last-child {
            margin-bottom: 0;
        }

        .bullet {
            color: var(--color-primary);
            margin-right: 8px;
            font-size: 12px;
            line-height: 1.6;
        }

        .empty-report {
            text-align: center;
            color: var(--color-text-muted);
            font-size: 14px;
        }

        .btn-chat-ai {
            width: 100%;
            height: 56px; /* Matched to AddTodoModal button height */
            background: var(--color-primary);
            color: #FFFFFF;
            border: none;
            border-radius: 28px; /* Matched to AddTodoModal button radius (pill shape) */
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: var(--shadow-sm);
            margin-top: 16px; /* Added margin for spacing */
        }

        .btn-chat-ai:hover {
            background: var(--color-primary-hover);
            transform: translateY(-1px);
        }

        .btn-chat-ai:active {
            transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
