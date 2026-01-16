import React from 'react';
import { getWeekDays, getDateString, isToday } from '../utils/dates';

interface WeeklyHeatmapProps {
  completions: string[]; // Array of ISO date strings
  weekStart?: Date; // Optional, defaults to current week
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const WeeklyHeatmap: React.FC<WeeklyHeatmapProps> = ({
  completions,
  weekStart,
}) => {
  const weekDays = getWeekDays(weekStart);
  const completionSet = new Set(completions);

  return (
    <div className="flex gap-1">
      {weekDays.map((day, index) => {
        const dateString = getDateString(day);
        const isCompleted = completionSet.has(dateString);
        const isTodayCell = isToday(day);

        return (
          <div key={dateString} className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">
              {DAY_LABELS[index]}
            </span>
            <div
              className={`w-6 h-6 rounded-md ${
                isCompleted ? 'bg-green-500' : 'bg-gray-200'
              } ${isTodayCell ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
              style={{
                backgroundColor: isCompleted ? '#10B981' : '#E5E7EB',
              }}
              title={dateString}
            />
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyHeatmap;
