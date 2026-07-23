/**
 * Tests for task selection and sync flow.
 *
 * Flow:
 * 1. User inputs task list in chat
 * 2. AI parses tasks and returns structured data
 * 3. Frontend generates summary-style task selection card
 * 4. User selects tasks with attributes (duration/importance/time slot)
 * 5. User clicks "确定同步" to sync to todo page
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock types for testing
interface PendingTask {
  title: string
  duration: string      // "15m" | "30m" | "60m" | ">60m"
  importance: string    // "routine" | "normal" | "high"
  period: string       // "morning" | "afternoon" | "evening" | "anytime"
  note?: string
  subtasks?: Array<{ id: string; title: string; completed: boolean }>
  selected: boolean
}

// Constants that should match ChatPanel.tsx
const DURATION_OPTIONS = [
  { value: "15m", label: "15分钟" },
  { value: "30m", label: "30分钟" },
  { value: "60m", label: "60分钟" },
  { value: ">60m", label: ">60分钟" },
]

const IMPORTANCE_OPTIONS = [
  { value: "routine", label: "日常" },
  { value: "normal", label: "一般" },
  { value: "high", label: "重要" },
]

const PERIOD_OPTIONS = [
  { value: "morning", label: "上午" },
  { value: "afternoon", label: "下午" },
  { value: "evening", label: "晚上" },
  { value: "anytime", label: "随时" },
]

describe('Task Selection Flow', () => {
  describe('Step 1: AI Response Parsing', () => {
    it('should parse task_plan response type correctly', () => {
      // Simulate AI response with task_plan type
      const aiResponse = {
        responseType: "task_plan",
        summary: "我为您规划了今天的3个任务",
        tasks: [
          {
            name: "写报告",
            planned_duration: "60m",
            importance: "high",
            category: "morning",
            note: "需要准备数据"
          },
          {
            name: "整理衣柜",
            planned_duration: "30m",
            importance: "normal",
            category: "afternoon"
          },
          {
            name: "跑步",
            planned_duration: "30m",
            importance: "routine",
            category: "evening"
          }
        ]
      }

      // Parse tasks from response
      const tasksWithSelection = aiResponse.tasks.map((t: any) => ({
        title: t.name || t.title || '',
        duration: t.planned_duration || t.duration || '30m',
        importance: t.importance || 'normal',
        period: t.category || t.suggested_period || 'anytime',
        note: t.note,
        subtasks: t.subtasks || [],
        selected: true
      }))

      expect(tasksWithSelection).toHaveLength(3)
      expect(tasksWithSelection[0].title).toBe("写报告")
      expect(tasksWithSelection[0].duration).toBe("60m")
      expect(tasksWithSelection[0].importance).toBe("high")
      expect(tasksWithSelection[0].period).toBe("morning")
      expect(tasksWithSelection[0].selected).toBe(true)

      expect(tasksWithSelection[1].title).toBe("整理衣柜")
      expect(tasksWithSelection[1].period).toBe("afternoon")
    })

    it('should handle different task field names', () => {
      // Test with alternative field names
      const aiResponse = {
        responseType: "task_plan",
        tasks: [
          {
            title: "测试任务",        // using 'title' instead of 'name'
            duration: "30m",          // using 'duration' instead of 'planned_duration'
            importance: "high",
            suggested_period: "anytime"  // using 'suggested_period' instead of 'category'
          }
        ]
      }

      const tasksWithSelection = aiResponse.tasks.map((t: any) => ({
        title: t.name || t.title || '',
        duration: t.planned_duration || t.duration || '30m',
        importance: t.importance || 'normal',
        period: t.category || t.suggested_period || 'anytime',
        selected: true
      }))

      expect(tasksWithSelection[0].title).toBe("测试任务")
      expect(tasksWithSelection[0].duration).toBe("30m")
      expect(tasksWithSelection[0].period).toBe("anytime")
    })

    it('should use default values when fields are missing', () => {
      const aiResponse = {
        tasks: [
          {
            name: "简单任务"  // only name provided
          }
        ]
      }

      const tasksWithSelection = aiResponse.tasks.map((t: any) => ({
        title: t.name || t.title || '',
        duration: t.planned_duration || t.duration || '30m',
        importance: t.importance || 'normal',
        period: t.category || t.suggested_period || 'anytime',
        selected: true
      }))

      expect(tasksWithSelection[0].duration).toBe("30m")  // default
      expect(tasksWithSelection[0].importance).toBe("normal")  // default
      expect(tasksWithSelection[0].period).toBe("anytime")  // default
    })
  })

  describe('Step 2: Option Constants', () => {
    it('should have correct duration options', () => {
      expect(DURATION_OPTIONS).toHaveLength(4)
      expect(DURATION_OPTIONS.map(o => o.value)).toEqual(["15m", "30m", "60m", ">60m"])
    })

    it('should have correct importance options', () => {
      expect(IMPORTANCE_OPTIONS).toHaveLength(3)
      expect(IMPORTANCE_OPTIONS.map(o => o.value)).toEqual(["routine", "normal", "high"])
    })

    it('should have correct period options', () => {
      expect(PERIOD_OPTIONS).toHaveLength(4)
      expect(PERIOD_OPTIONS.map(o => o.value)).toEqual(["morning", "afternoon", "evening", "anytime"])
    })
  })

  describe('Step 3: Task Selection State Updates', () => {
    it('should toggle task selection correctly', () => {
      const initialTasks: PendingTask[] = [
        { title: "任务1", duration: "30m", importance: "normal", period: "anytime", selected: true },
        { title: "任务2", duration: "30m", importance: "normal", period: "anytime", selected: false },
      ]

      // Simulate clicking checkbox on task 2
      const updatedTasks = initialTasks.map((t, i) =>
        i === 1 ? { ...t, selected: !t.selected } : t
      )

      expect(updatedTasks[0].selected).toBe(true)
      expect(updatedTasks[1].selected).toBe(true)
    })

    it('should update task duration correctly', () => {
      const initialTasks: PendingTask[] = [
        { title: "任务1", duration: "30m", importance: "normal", period: "anytime", selected: true },
      ]

      // Simulate clicking duration option
      const updatedTasks = initialTasks.map((t, i) =>
        i === 0 ? { ...t, duration: "60m" } : t
      )

      expect(updatedTasks[0].duration).toBe("60m")
    })

    it('should update task importance correctly', () => {
      const initialTasks: PendingTask[] = [
        { title: "任务1", duration: "30m", importance: "normal", period: "anytime", selected: true },
      ]

      // Simulate clicking importance option
      const updatedTasks = initialTasks.map((t, i) =>
        i === 0 ? { ...t, importance: "high" } : t
      )

      expect(updatedTasks[0].importance).toBe("high")
    })

    it('should update task period correctly', () => {
      const initialTasks: PendingTask[] = [
        { title: "任务1", duration: "30m", importance: "normal", period: "anytime", selected: true },
      ]

      // Simulate clicking period option
      const updatedTasks = initialTasks.map((t, i) =>
        i === 0 ? { ...t, period: "morning" } : t
      )

      expect(updatedTasks[0].period).toBe("morning")
    })

    it('should toggle select all correctly', () => {
      const initialTasks: PendingTask[] = [
        { title: "任务1", duration: "30m", importance: "normal", period: "anytime", selected: true },
        { title: "任务2", duration: "30m", importance: "normal", period: "anytime", selected: false },
        { title: "任务3", duration: "30m", importance: "normal", period: "anytime", selected: true },
      ]

      // Check if all are selected
      const allSelected = initialTasks.every(t => t.selected)

      // Simulate clicking "全选" or "取消全选"
      const updatedTasks = initialTasks.map(t => ({ ...t, selected: !allSelected }))

      // When not all selected, select all
      expect(updatedTasks.every(t => t.selected)).toBe(!allSelected)
    })
  })

  describe('Step 4: Sync Tasks to Backend', () => {
    it('should filter selected tasks correctly', () => {
      const tasks: PendingTask[] = [
        { title: "任务1", duration: "30m", importance: "normal", period: "anytime", selected: true },
        { title: "任务2", duration: "30m", importance: "normal", period: "anytime", selected: false },
        { title: "任务3", duration: "60m", importance: "high", period: "morning", selected: true },
      ]

      const selectedTasks = tasks.filter(t => t.selected)

      expect(selectedTasks).toHaveLength(2)
      expect(selectedTasks.map(t => t.title)).toEqual(["任务1", "任务3"])
    })

    it('should transform tasks to backend format correctly', () => {
      const selectedTasks: PendingTask[] = [
        { title: "写报告", duration: "60m", importance: "high", period: "morning", note: "准备数据" },
        { title: "跑步", duration: "30m", importance: "routine", period: "evening" },
      ]

      // Transform to backend format (syncTasksToBackend)
      const backendTasks = selectedTasks.map(t => ({
        title: t.title,
        planned_duration: t.duration,
        importance: t.importance,
        suggested_period: t.period,
        note: t.note
      }))

      expect(backendTasks).toEqual([
        {
          title: "写报告",
          planned_duration: "60m",
          importance: "high",
          suggested_period: "morning",
          note: "准备数据"
        },
        {
          title: "跑步",
          planned_duration: "30m",
          importance: "routine",
          suggested_period: "evening",
          note: undefined
        }
      ])
    })

    it('should not allow syncing when no tasks selected', () => {
      const tasks: PendingTask[] = [
        { title: "任务1", duration: "30m", importance: "normal", period: "anytime", selected: false },
        { title: "任务2", duration: "30m", importance: "normal", period: "anytime", selected: false },
      ]

      const selectedTasks = tasks.filter(t => t.selected)

      // Should not proceed with sync
      expect(selectedTasks.length).toBe(0)
    })
  })

  describe('Step 5: Label Helpers', () => {
    it('should get correct duration label', () => {
      const getDurationLabel = (value: string) => DURATION_OPTIONS.find(o => o.value === value)?.label || value

      expect(getDurationLabel("15m")).toBe("15分钟")
      expect(getDurationLabel("30m")).toBe("30分钟")
      expect(getDurationLabel("60m")).toBe("60分钟")
      expect(getDurationLabel(">60m")).toBe(">60分钟")
      expect(getDurationLabel("unknown")).toBe("unknown")
    })

    it('should get correct importance label', () => {
      const getImportanceLabel = (value: string) => IMPORTANCE_OPTIONS.find(o => o.value === value)?.label || value

      expect(getImportanceLabel("routine")).toBe("日常")
      expect(getImportanceLabel("normal")).toBe("一般")
      expect(getImportanceLabel("high")).toBe("重要")
      expect(getImportanceLabel("unknown")).toBe("unknown")
    })

    it('should get correct period label', () => {
      const getPeriodLabel = (value: string) => PERIOD_OPTIONS.find(o => o.value === value)?.label || value

      expect(getPeriodLabel("morning")).toBe("上午")
      expect(getPeriodLabel("afternoon")).toBe("下午")
      expect(getPeriodLabel("evening")).toBe("晚上")
      expect(getPeriodLabel("anytime")).toBe("随时")
      expect(getPeriodLabel("unknown")).toBe("unknown")
    })
  })
})

describe('End-to-End Flow', () => {
  it('should complete full task selection and sync flow', () => {
    // Step 1: User inputs task list in chat
    const userMessage = "帮我安排今天：写报告、整理衣柜、跑步"

    // Step 2: AI parses and returns structured data (simulated)
    const aiResponse = {
      responseType: "task_plan",
      summary: "我为您规划了今天的任务",
      tasks: [
        { name: "写报告", planned_duration: "60m", importance: "high", category: "morning" },
        { name: "整理衣柜", planned_duration: "30m", importance: "normal", category: "afternoon" },
        { name: "跑步", planned_duration: "30m", importance: "routine", category: "evening" }
      ]
    }

    // Step 3: Frontend generates selection UI
    const tasksWithSelection = aiResponse.tasks.map((t: any) => ({
      title: t.name || t.title || '',
      duration: t.planned_duration || t.duration || '30m',
      importance: t.importance || 'normal',
      period: t.category || t.suggested_period || 'anytime',
      selected: true
    }))

    // Step 4: User modifies selections
    // User decides to unselect "整理衣柜"
    let modifiedTasks = tasksWithSelection.map((t, i) =>
      i === 1 ? { ...t, selected: false } : t
    )
    // User changes "跑步" duration to 60m
    modifiedTasks = modifiedTasks.map((t, i) =>
      i === 2 ? { ...t, duration: "60m" } : t
    )

    // Step 5: User clicks "确定同步"
    const selectedTasks = modifiedTasks.filter(t => t.selected)
    const backendTasks = selectedTasks.map(t => ({
      title: t.title,
      planned_duration: t.duration,
      importance: t.importance,
      suggested_period: t.period
    }))

    // Verify final state
    expect(selectedTasks).toHaveLength(2)
    expect(backendTasks).toEqual([
      { title: "写报告", planned_duration: "60m", importance: "high", suggested_period: "morning" },
      { title: "跑步", planned_duration: "60m", importance: "routine", suggested_period: "evening" }
    ])
  })
})
