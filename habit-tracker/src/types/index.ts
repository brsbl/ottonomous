export interface Habit {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO date
  completions: string[]; // Array of ISO date strings for completed days
}

export interface AppState {
  habits: Habit[];
  selectedDate: string; // ISO date for current view
}

export type HabitAction =
  | { type: 'ADD_HABIT'; payload: Omit<Habit, 'id' | 'completions'> }
  | { type: 'UPDATE_HABIT'; payload: { id: string; updates: Partial<Habit> } }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'TOGGLE_COMPLETION'; payload: { habitId: string; date: string } }
  | { type: 'LOAD_HABITS'; payload: Habit[] };
