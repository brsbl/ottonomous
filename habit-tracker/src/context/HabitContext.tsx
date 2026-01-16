import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Habit, AppState, HabitAction } from '../types';
import { saveHabits, loadHabits } from '../utils/storage';

// Generate unique ID using crypto.randomUUID if available, fallback to Date-based ID
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Initial state
const initialState: AppState = {
  habits: [],
  selectedDate: new Date().toISOString().split('T')[0],
};

// Reducer function handling all HabitAction types
function habitReducer(state: AppState, action: HabitAction): AppState {
  switch (action.type) {
    case 'ADD_HABIT': {
      const newHabit: Habit = {
        id: generateId(),
        name: action.payload.name,
        description: action.payload.description,
        createdAt: action.payload.createdAt,
        completions: [],
      };
      return {
        ...state,
        habits: [...state.habits, newHabit],
      };
    }

    case 'UPDATE_HABIT': {
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.payload.id
            ? { ...habit, ...action.payload.updates }
            : habit
        ),
      };
    }

    case 'DELETE_HABIT': {
      return {
        ...state,
        habits: state.habits.filter((habit) => habit.id !== action.payload),
      };
    }

    case 'TOGGLE_COMPLETION': {
      const { habitId, date } = action.payload;
      return {
        ...state,
        habits: state.habits.map((habit) => {
          if (habit.id !== habitId) return habit;

          const hasCompletion = habit.completions.includes(date);
          const completions = hasCompletion
            ? habit.completions.filter((d) => d !== date)
            : [...habit.completions, date];

          return { ...habit, completions };
        }),
      };
    }

    case 'LOAD_HABITS': {
      return {
        ...state,
        habits: action.payload,
      };
    }

    default:
      return state;
  }
}

// Context type
interface HabitContextType {
  state: AppState;
  dispatch: React.Dispatch<HabitAction>;
}

// Create context
const HabitContext = createContext<HabitContextType | undefined>(undefined);

// Provider props
interface HabitProviderProps {
  children: ReactNode;
}

// HabitProvider component
export function HabitProvider({ children }: HabitProviderProps) {
  const [state, dispatch] = useReducer(habitReducer, initialState);

  // Load habits from localStorage on mount
  useEffect(() => {
    const habits = loadHabits();
    if (habits.length > 0) {
      dispatch({ type: 'LOAD_HABITS', payload: habits });
    }
  }, []);

  // Save habits to localStorage on state change
  useEffect(() => {
    saveHabits(state.habits);
  }, [state.habits]);

  return (
    <HabitContext.Provider value={{ state, dispatch }}>
      {children}
    </HabitContext.Provider>
  );
}

// Custom hook to use the HabitContext
export function useHabitContext(): HabitContextType {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabitContext must be used within a HabitProvider');
  }
  return context;
}

export { HabitContext };
