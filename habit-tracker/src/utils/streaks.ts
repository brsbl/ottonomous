/**
 * Streak calculation utilities for the habit tracker app.
 */

import type { Habit } from '../types';
import { getDateString, parseDate } from './dates';

/**
 * Calculate current streak (consecutive days completed ending today or yesterday)
 * @param habit - The habit to calculate streak for
 * @returns Number of consecutive completed days
 */
export function calculateStreak(habit: Habit): number {
  if (habit.completions.length === 0) {
    return 0;
  }

  // Sort completions in descending order (most recent first)
  const sortedCompletions = [...habit.completions].sort((a, b) => b.localeCompare(a));

  const today = new Date();
  const todayString = getDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = getDateString(yesterday);

  // Check if the most recent completion is today or yesterday
  const mostRecent = sortedCompletions[0];
  if (mostRecent !== todayString && mostRecent !== yesterdayString) {
    // Streak is broken - most recent completion is older than yesterday
    return 0;
  }

  // Count consecutive days starting from the most recent completion
  let streak = 1;
  let currentDate = parseDate(mostRecent);

  for (let i = 1; i < sortedCompletions.length; i++) {
    // Calculate expected previous day
    const expectedPrevious = new Date(currentDate);
    expectedPrevious.setDate(expectedPrevious.getDate() - 1);
    const expectedPreviousString = getDateString(expectedPrevious);

    if (sortedCompletions[i] === expectedPreviousString) {
      streak++;
      currentDate = expectedPrevious;
    } else {
      // Gap found, streak ends here
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak ever achieved
 * @param habit - The habit to calculate longest streak for
 * @returns Maximum number of consecutive completed days
 */
export function calculateLongestStreak(habit: Habit): number {
  if (habit.completions.length === 0) {
    return 0;
  }

  if (habit.completions.length === 1) {
    return 1;
  }

  // Sort completions in ascending order (oldest first)
  const sortedCompletions = [...habit.completions].sort((a, b) => a.localeCompare(b));

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedCompletions.length; i++) {
    const prevDate = parseDate(sortedCompletions[i - 1]);
    const currDate = parseDate(sortedCompletions[i]);

    // Calculate expected next day
    const expectedNext = new Date(prevDate);
    expectedNext.setDate(expectedNext.getDate() + 1);

    if (getDateString(currDate) === getDateString(expectedNext)) {
      // Consecutive day found
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      // Gap found, reset current streak
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Check if streak is currently active (completed today)
 * @param habit - The habit to check
 * @returns True if the habit was completed today
 */
export function isStreakActive(habit: Habit): boolean {
  if (habit.completions.length === 0) {
    return false;
  }

  const todayString = getDateString(new Date());
  return habit.completions.includes(todayString);
}
