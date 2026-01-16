import React from 'react';

interface StreakBadgeProps {
  streak: number;
  isActive: boolean; // true if completed today
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, isActive }) => {
  const dayLabel = streak === 1 ? 'day' : 'days';

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
        isActive
          ? 'bg-orange-100 text-orange-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      <span
        className={`text-base ${
          isActive ? 'animate-pulse' : 'opacity-50'
        }`}
        aria-hidden="true"
      >
        🔥
      </span>
      <span className={isActive ? 'font-bold' : 'font-normal'}>
        {streak} {dayLabel}
      </span>
    </div>
  );
};

export default StreakBadge;
