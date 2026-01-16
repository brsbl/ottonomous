import { useHabitContext } from '../context/HabitContext';
import type { Habit } from '../types';

export function useHabits() {
  const { state, dispatch } = useHabitContext();

  const addHabit = (name: string, description?: string): void => {
    dispatch({
      type: 'ADD_HABIT',
      payload: {
        name,
        description,
        createdAt: new Date().toISOString().split('T')[0],
      },
    });
  };

  const updateHabit = (id: string, updates: Partial<Habit>): void => {
    dispatch({
      type: 'UPDATE_HABIT',
      payload: { id, updates },
    });
  };

  const deleteHabit = (id: string): void => {
    dispatch({
      type: 'DELETE_HABIT',
      payload: id,
    });
  };

  const toggleCompletion = (habitId: string, date: string): void => {
    dispatch({
      type: 'TOGGLE_COMPLETION',
      payload: { habitId, date },
    });
  };

  const getHabitById = (id: string): Habit | undefined => {
    return state.habits.find((habit) => habit.id === id);
  };

  const isCompletedOnDate = (habitId: string, date: string): boolean => {
    const habit = getHabitById(habitId);
    return habit ? habit.completions.includes(date) : false;
  };

  return {
    habits: state.habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    getHabitById,
    isCompletedOnDate,
  };
}
