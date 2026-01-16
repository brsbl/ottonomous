import { useState, useEffect, useCallback } from 'react';
import type { Habit } from '../types';

interface HabitFormProps {
  habit?: Habit; // undefined for create, defined for edit
  onSave: (name: string, description?: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function HabitForm({ habit, onSave, onCancel, isOpen }: HabitFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isEditMode = !!habit;

  // Pre-fill fields when editing existing habit
  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [habit, isOpen]);

  // Handle Escape key to close the form
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onCancel();
    }
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Don't render anything when isOpen is false
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim() || undefined);
      // Clear fields after save
      setName('');
      setDescription('');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close only if clicking on the overlay background itself
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-form-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 id="habit-form-title" className="text-xl font-semibold text-gray-800 mb-4">
            {isEditMode ? 'Edit Habit' : 'Add Habit'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="habit-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="habit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter habit name"
                required
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="habit-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="habit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Enter optional description"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!name.trim()}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
