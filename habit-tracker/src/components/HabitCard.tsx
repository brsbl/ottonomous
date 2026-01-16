import React, { useState } from 'react';
import StreakBadge from './StreakBadge';
import WeeklyHeatmap from './WeeklyHeatmap';
import ConfirmDialog from './ConfirmDialog';
import { useHabits } from '../hooks/useHabits';
import { calculateStreak, isStreakActive } from '../utils/streaks';
import { getDateString } from '../utils/dates';
import type { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onEdit, onDelete }) => {
  const { toggleCompletion } = useHabits();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const todayString = getDateString(new Date());
  const isCompletedToday = habit.completions.includes(todayString);
  const streak = calculateStreak(habit);
  const streakActive = isStreakActive(habit);

  const handleToggle = () => {
    toggleCompletion(habit.id, todayString);
  };

  const handleEdit = () => {
    onEdit(habit);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(habit.id);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Header with name and actions */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{habit.name}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Edit habit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onClick={handleDeleteClick}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Delete habit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {habit.description && (
        <p className="text-gray-600 text-sm mb-3">{habit.description}</p>
      )}

      {/* Streak Badge */}
      <div className="mb-3">
        <StreakBadge streak={streak} isActive={streakActive} />
      </div>

      {/* Weekly Heatmap */}
      <div className="mb-4">
        <WeeklyHeatmap completions={habit.completions} />
      </div>

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          isCompletedToday
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {isCompletedToday ? 'Completed Today' : 'Mark as Complete'}
      </button>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Habit"
        message={`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default HabitCard;
