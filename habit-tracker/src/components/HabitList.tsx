import React from 'react';
import HabitCard from './HabitCard';
import { useHabits } from '../hooks/useHabits';
import type { Habit } from '../types';

interface HabitListProps {
  onEditHabit: (habit: Habit) => void;
}

const HabitList: React.FC<HabitListProps> = ({ onEditHabit }) => {
  const { habits, deleteHabit } = useHabits();

  const handleEdit = (habit: Habit) => {
    onEditHabit(habit);
  };

  const handleDelete = (id: string) => {
    deleteHabit(id);
  };

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <p className="text-gray-500 text-lg text-center">
          No habits yet. Add your first habit to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default HabitList;
