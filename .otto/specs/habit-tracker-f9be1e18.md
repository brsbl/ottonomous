---
id: habit-tracker-f9be1e18
title: Habit Tracker Web App
type: web-app
status: approved
created: 2026-01-15T19:46:15Z
---

# Habit Tracker Web App

## Overview

A modern web application for tracking daily habits with visual feedback through streak counters and weekly heatmaps. Users can create habits, mark them complete each day, and see their consistency visualized over time.

## Goals

1. Enable users to create, edit, and delete habits
2. Allow daily check-ins for each habit
3. Display current streak for each habit
4. Show weekly heatmaps showing completion patterns
5. Persist data locally in browser storage
6. Provide a clean, responsive UI

## Core Features (MVP)

### 1. Habit Management
- Create new habits with name and optional description
- Edit existing habits
- Delete habits (with confirmation)
- View list of all habits

### 2. Daily Check-In
- Toggle habit completion for today
- View completion status for current day
- Navigate to view/edit past days (within current week)

### 3. Streak Visualization
- Calculate and display current streak (consecutive days completed)
- Show longest streak achieved
- Visual indicator for active vs broken streaks

### 4. Weekly Heatmap
- 7-day heatmap grid for each habit
- Color intensity based on completion (complete/incomplete)
- Week navigation (current week, previous weeks)

## Technical Architecture

### Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: React Context + useReducer
- **Storage**: localStorage
- **Date Handling**: Native Date API

### Project Structure
```
habit-tracker/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── index.ts
│   ├── context/
│   │   └── HabitContext.tsx
│   ├── hooks/
│   │   └── useHabits.ts
│   ├── components/
│   │   ├── HabitList.tsx
│   │   ├── HabitCard.tsx
│   │   ├── HabitForm.tsx
│   │   ├── StreakBadge.tsx
│   │   ├── WeeklyHeatmap.tsx
│   │   └── Header.tsx
│   └── utils/
│       ├── storage.ts
│       ├── dates.ts
│       └── streaks.ts
```

## Data Model

### Habit
```typescript
interface Habit {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO date
  completions: string[]; // Array of ISO date strings for completed days
}
```

### App State
```typescript
interface AppState {
  habits: Habit[];
  selectedDate: string; // ISO date for current view
}
```

## User Flows

### Flow 1: Create Habit
1. User clicks "Add Habit" button
2. Form appears with name and description fields
3. User fills in name (required) and optionally description
4. User clicks "Save"
5. New habit appears in list with 0-day streak

### Flow 2: Complete Daily Check-In
1. User views habit list showing today's status
2. User clicks checkbox/button next to habit
3. Habit marked as complete for today
4. Streak counter updates immediately
5. Heatmap cell for today fills in

### Flow 3: View Streak & Heatmap
1. User sees streak badge on each habit card
2. User views weekly heatmap below habit name
3. Colored cells indicate completed days
4. Empty cells indicate missed days

## UI Design

### Color Palette
- Primary: Blue (#3B82F6)
- Success/Complete: Green (#10B981)
- Incomplete: Gray (#E5E7EB)
- Background: White/Light Gray (#F9FAFB)
- Text: Dark Gray (#1F2937)

### Components
- **Header**: App title, current date display
- **HabitCard**: Name, description, streak badge, heatmap, completion toggle
- **HabitForm**: Modal/slide-over for adding/editing habits
- **StreakBadge**: Flame icon + streak count
- **WeeklyHeatmap**: 7-cell grid (Mon-Sun), colored by completion

## API/Interface Design

### Context Actions
```typescript
type HabitAction =
  | { type: 'ADD_HABIT'; payload: Omit<Habit, 'id' | 'completions'> }
  | { type: 'UPDATE_HABIT'; payload: { id: string; updates: Partial<Habit> } }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'TOGGLE_COMPLETION'; payload: { habitId: string; date: string } }
  | { type: 'LOAD_HABITS'; payload: Habit[] };
```

## Success Criteria

1. User can create at least 3 habits
2. User can complete habits and see streak update
3. Weekly heatmap accurately reflects completion history
4. Data persists across browser sessions
5. UI is responsive on mobile and desktop
6. All interactions feel smooth (<100ms feedback)
