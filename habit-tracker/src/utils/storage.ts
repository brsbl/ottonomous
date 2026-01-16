import type { Habit } from '../types';

const STORAGE_KEY = 'habit-tracker-habits';

export function saveHabits(habits: Habit[]): void {
  try {
    const json = JSON.stringify(habits);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save habits to localStorage:', error);
  }
}

export function loadHabits(): Habit[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
      return [];
    }
    const habits = JSON.parse(json);
    if (!Array.isArray(habits)) {
      return [];
    }
    return habits;
  } catch (error) {
    console.error('Failed to load habits from localStorage:', error);
    return [];
  }
}

export function clearHabits(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear habits from localStorage:', error);
  }
}
