export interface Subtask {
    id: string | number;
    title: string;
    completed: boolean;
    status?: 'pending' | 'active' | 'paused' | 'completed';
    remainingTime?: number;
    duration?: number; // seconds
}

export interface Todo {
    id: number;
    title: string;
    duration: string; // planned_duration: "15m" | "30m" | "60m"
    plannedDuration?: string; // 新增：15m/30m/60m
    status: 'pending' | 'active' | 'completed' | 'paused';
    importance?: 'high' | 'normal' | 'routine';
    subtasks?: Subtask[];
    remainingTime?: number; // in seconds
    note?: string;
    category?: 'anytime' | 'morning' | 'afternoon' | 'evening'; // suggested_period
    completedAt?: number; // Timestamp when completed
    startedAt?: number; // Timestamp when started (first time)
    actualDuration?: number; // In seconds
    breakdownStatus?: 'none' | 'pending' | 'completed';
    source?: 'manual' | 'ai_chat';
    completedSteps?: number;
    // 分批拆解相关字段
    totalBatches?: number;
    currentBatch?: number;
}

export interface Message {
    id: number;
    text: string;
    sender: 'bot' | 'user';
    type?: 'text' | 'task-bubble' | 'chart-bubble' | 'file' | 'image';
    task?: Todo;
    chartData?: any;
    attachment?: {
        name: string;
        url?: string;
        type: 'image' | 'file';
    };
}
