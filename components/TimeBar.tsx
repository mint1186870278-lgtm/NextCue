"use client";

import { useEffect, useState } from "react";

import { Clock } from "lucide-react";

export default function TimeBar() {
  const [currentHour, setCurrentHour] = useState<number | null>(null);

  useEffect(() => {
    setCurrentHour(new Date().getHours());
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const totalBlocks = 16;
  const startHour = 8;
  
  // Default to 0 or handle null to render a skeleton or generic state
  const safeCurrentHour = currentHour ?? startHour; 
  const currentBlockIndex = safeCurrentHour - startHour;
  const remainingHours = Math.max(0, startHour + totalBlocks - safeCurrentHour);

  if (currentHour === null) {
      return <div className="timeline-card" style={{ height: '100px', background: '#FFF' }}></div>; // Skeleton
  }

  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <span className="timeline-label">
            <Clock size={14} style={{ marginRight: 4 }} /> 今日时间轴
        </span>
        <span className="timeline-value">可用 {remainingHours}h</span>
      </div>

      <div className="timeline-bar">
        {Array.from({ length: totalBlocks }).map((_, i) => {
          let statusClass = "future";
          if (i < currentBlockIndex) statusClass = "past";
          else if (i === currentBlockIndex) statusClass = "current";

          return (
            <div
              key={i}
              className={`time-capsule ${statusClass}`}
              title={i === currentBlockIndex ? `Current Time: ${safeCurrentHour}:00` : ""}
            />
          );
        })}
      </div>

      <div className="timeline-footer">
        <span>8:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
}
