import { useState } from 'react';
import { HabitProvider } from './context/HabitContext';
import { useHabits } from './hooks/useHabits';
import Header from './components/Header';
import HabitList from './components/HabitList';
import { HabitForm } from './components/HabitForm';
import type { Habit } from './types';

function AppContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();

  const { addHabit, updateHabit } = useHabits();

  const handleOpenForm = () => {
    setEditingHabit(undefined);
    setIsFormOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingHabit(undefined);
  };

  const handleSave = (name: string, description?: string) => {
    if (editingHabit) {
      // Update existing habit
      updateHabit(editingHabit.id, { name, description });
    } else {
      // Add new habit
      addHabit(name, description);
    }
    handleCloseForm();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Add Habit Button */}
        <div className="mb-6">
          <button
            onClick={handleOpenForm}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Habit
          </button>
        </div>

        {/* Habit List */}
        <HabitList onEditHabit={handleEditHabit} />
      </main>

      {/* Habit Form Modal */}
      <HabitForm
        habit={editingHabit}
        onSave={handleSave}
        onCancel={handleCloseForm}
        isOpen={isFormOpen}
      />
    </div>
  );
}

function App() {
  return (
    <HabitProvider>
      <AppContent />
    </HabitProvider>
  );
}

export default App;
