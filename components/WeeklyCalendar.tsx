"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function WeeklyCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Initialize with the Monday of the current week
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) - 6 (Sat)
    // Calculate difference to get to Monday. If Sunday (0), subtract 6. Else subtract day - 1.
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  
  const [weekDates, setWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(currentWeekStart);
      nextDay.setDate(currentWeekStart.getDate() + i);
      days.push(nextDay);
    }
    setWeekDays(days);
  }, [currentWeekStart]);

  const handlePrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const formatDate = (date: Date) => {
    return {
      day: date.getDate(),
      // "周一" -> "一"
      weekday: date.toLocaleDateString('zh-CN', { weekday: 'short' }).replace('周', ''),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      dayName: date.toLocaleDateString('zh-CN', { weekday: 'long' })
    };
  };

  const currentInfo = formatDate(selectedDate);
  // Use the month/year of the first day of the currently displayed week for the header
  const headerDateInfo = weekDates.length > 0 ? formatDate(weekDates[0]) : currentInfo;

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="current-weekday">{currentInfo.dayName}</h2>
        <div className="current-month">
            <button className="nav-btn" onClick={handlePrevWeek}>
                <ChevronLeft size={16} color="var(--color-text-secondary)" />
            </button>
            {headerDateInfo.year}年{headerDateInfo.month}月
            <button className="nav-btn" onClick={handleNextWeek}>
                <ChevronRight size={16} color="var(--color-text-secondary)" />
            </button>
        </div>
      </div>
      
      <div className="week-grid">
        {weekDates.map((date, index) => {
          const info = formatDate(date);
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div 
              key={index} 
              className={`day-item ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              <span className="weekday-label">{info.weekday}</span>
              <span className="day-number">{info.day}</span>
              {/* Show dot for today if not selected, to indicate 'today' */}
              {isToday && !isSelected && <span className="today-dot"></span>}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .calendar-container {
          padding: 0 4px 4px 4px;
          margin-bottom: 0;
        }
        
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 16px; /* Increased from 8px */
        }
        
        .current-weekday {
          font-size: 32px;
          font-weight: 700;
          color: var(--color-text-main);
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        
        .current-month {
          font-size: 14px;
          color: var(--color-text-secondary);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nav-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        }

        .nav-btn:hover {
            background-color: rgba(0,0,0,0.05);
        }
        
        .week-grid {
          display: flex;
          justify-content: space-between;
        }
        
        .day-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 68px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          background-color: transparent;
        }
        
        .day-item:active {
            transform: scale(0.95);
        }
        
        .day-item.selected {
          background-color: var(--color-primary); /* Brand Mint */
          color: var(--color-primary-foreground);
          box-shadow: 0 8px 16px rgba(93, 184, 150, 0.25); /* Mint shadow */
        }
        
        .weekday-label {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-bottom: 6px;
          font-weight: 500;
        }
        
        .day-item.selected .weekday-label {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .day-number {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text-main);
        }
        
        .day-item.selected .day-number {
          color: var(--color-primary-foreground);
        }

        .today-dot {
            position: absolute;
            bottom: 6px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
