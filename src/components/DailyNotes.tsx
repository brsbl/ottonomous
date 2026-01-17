/**
 * DailyNotes component for the Personal Knowledge Base application.
 * Provides a "Today" button and calendar navigation for daily notes.
 */

import { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
} from 'lucide-react';
import { Button } from './ui/button';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import { cn } from '@/lib/utils';

/**
 * Format a date as YYYY-MM-DD string.
 */
function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get the days in a month as a 2D array (weeks x days).
 */
function getCalendarDays(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(year, month, day));

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add empty cells for days after the last day of the month
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

/**
 * DailyNotes component with Today button and calendar navigation.
 */
export function DailyNotes() {
  const {
    notes,
    activeNoteId,
    createDailyNote,
    getDailyNote,
    setActiveNote,
  } = useKnowledgeBase();

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Get calendar days for the current view month
  const calendarWeeks = useMemo(
    () => getCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  // Get all daily note dates for quick lookup
  const dailyNoteDates = useMemo(() => {
    const dates = new Set<string>();
    notes.forEach((note) => {
      if (note.isDaily && note.dailyDate) {
        dates.add(note.dailyDate);
      }
    });
    return dates;
  }, [notes]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  /**
   * Handle clicking the Today button.
   */
  const handleTodayClick = async () => {
    const note = await createDailyNote();
    setActiveNote(note.id);
    // Also navigate calendar to today's month
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  /**
   * Handle clicking a calendar day.
   */
  const handleDayClick = async (date: Date) => {
    const existingNote = getDailyNote(date);
    if (existingNote) {
      setActiveNote(existingNote.id);
    } else {
      const note = await createDailyNote(date);
      setActiveNote(note.id);
    }
  };

  /**
   * Navigate to previous month.
   */
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  /**
   * Navigate to next month.
   */
  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  /**
   * Check if a date is today.
   */
  const isToday = (date: Date): boolean => {
    return formatDateString(date) === formatDateString(today);
  };

  /**
   * Check if a date has a daily note.
   */
  const hasDailyNote = (date: Date): boolean => {
    return dailyNoteDates.has(formatDateString(date));
  };

  /**
   * Check if a date's note is currently active.
   */
  const isActive = (date: Date): boolean => {
    const note = getDailyNote(date);
    return note?.id === activeNoteId;
  };

  return (
    <div className="p-3 border-b border-border">
      {/* Today button */}
      <Button
        onClick={handleTodayClick}
        className="w-full justify-start gap-2 mb-3"
        variant="outline"
        size="sm"
      >
        <Sun className="h-4 w-4" />
        Today
      </Button>

      {/* Calendar header */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-xs text-center text-muted-foreground font-medium py-1"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarWeeks.map((week, weekIndex) =>
          week.map((date, dayIndex) => (
            <button
              key={`${weekIndex}-${dayIndex}`}
              disabled={!date}
              onClick={() => date && handleDayClick(date)}
              className={cn(
                'text-xs text-center py-1.5 rounded-md transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'disabled:opacity-0 disabled:cursor-default',
                date && isToday(date) && 'font-bold text-primary',
                date && hasDailyNote(date) && 'bg-primary/10',
                date && isActive(date) && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {date?.getDate()}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default DailyNotes;
