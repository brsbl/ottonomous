---
id: kanban-board-b6c649f1
title: Kanban Board Web App
status: approved
created: 2026-01-16
---

# Kanban Board Web App

## Overview

A lightweight, performant kanban board web application designed for speed and keyboard efficiency. Built to address common pain points with existing tools: slow performance, cluttered UI, and lack of native WIP limits.

## Goals

1. **Lightning Fast**: Handle 1000+ cards without performance degradation
2. **Keyboard-First**: Full board management via keyboard shortcuts
3. **Clean & Focused**: Minimal UI, no distractions, board-centric design
4. **Native WIP Limits**: Built-in work-in-progress limits per column
5. **Smooth Interactions**: Butter-smooth drag-and-drop with instant feedback

## Technical Architecture

### Stack
- **Frontend**: React 18+ with TypeScript
- **State Management**: Zustand (lightweight, performant)
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit/core (modern, accessible, performant)
- **Persistence**: LocalStorage (MVP), future: backend API
- **Build Tool**: Vite

### Data Flow
```
User Action → Zustand Store → React Components → LocalStorage
                    ↓
              Optimistic Updates (instant UI feedback)
```

## Data Model

### Board
```typescript
interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}
```

### Column
```typescript
interface Column {
  id: string;
  title: string;
  wipLimit?: number;  // null = unlimited
  color?: string;     // column header accent color
  cardIds: string[];  // ordered list of card IDs
}
```

### Card
```typescript
interface Card {
  id: string;
  title: string;
  description?: string;
  labels: Label[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Label
```typescript
interface Label {
  id: string;
  name: string;
  color: string;
}
```

## Features

### Tier 1: Core (Must Have)

1. **Board Display**: Responsive board layout with horizontal scrolling columns
2. **Column Management**: Add, rename, delete, and reorder columns
3. **Card CRUD**: Create, read, update, delete cards with title and description
4. **Drag & Drop Cards**: Move cards between columns and reorder within columns
5. **Drag & Drop Columns**: Reorder columns via drag and drop
6. **Local Persistence**: Save board state to LocalStorage, restore on page load
7. **Card Modal**: Full-screen modal for viewing/editing card details

### Tier 2: Expected (Should Have)

8. **WIP Limits**: Set per-column work-in-progress limits with visual indicators
9. **Card Labels**: Add colored labels to cards for categorization
10. **Card Priority**: Set priority levels (low, medium, high, urgent) with visual indicators
11. **Search & Filter**: Search cards by title, filter by label or priority
12. **Keyboard Navigation**: Navigate board, select cards, and perform actions via keyboard
13. **Keyboard Shortcuts**: Quick actions (n=new card, e=edit, d=delete, etc.)
14. **Due Dates**: Set and display due dates on cards with overdue highlighting
15. **Undo/Redo**: Undo and redo recent actions

### Tier 3: Delightful (Nice to Have)

16. **Dark Mode**: Toggle between light and dark themes
17. **Board Templates**: Quick-start templates (Agile, Personal, etc.)
18. **Card Quick Edit**: Inline title editing without opening modal
19. **Column Collapse**: Collapse columns to save space
20. **Export/Import**: Export board as JSON, import from JSON
21. **Smooth Animations**: Subtle animations for all interactions
22. **Empty State Guidance**: Helpful onboarding for empty boards

## User Flows

### Flow 1: Create and Organize Cards
1. User lands on board (default columns: To Do, In Progress, Done)
2. User clicks "+" or presses "n" to add new card
3. User enters card title, optionally adds description
4. User drags card from "To Do" to "In Progress"
5. User adds labels and sets priority via card modal
6. User drags card to "Done" when complete

### Flow 2: Manage Columns with WIP Limits
1. User clicks "Add Column" to create new column
2. User renames column by clicking on title
3. User sets WIP limit of 3 via column menu
4. User tries to add 4th card - warning indicator appears
5. User reorders columns via drag and drop
6. User deletes unused column

### Flow 3: Keyboard Power User
1. User presses "?" to see keyboard shortcuts
2. User navigates columns with left/right arrows
3. User navigates cards with up/down arrows
4. User presses "n" to create new card in current column
5. User presses "e" to edit selected card
6. User presses "m" to move card to next column
7. User presses Ctrl+Z to undo last action

## API/Interface Design

### Zustand Store Actions
```typescript
interface BoardStore {
  // Board
  board: Board;
  setBoard: (board: Board) => void;

  // Columns
  addColumn: (title: string) => void;
  updateColumn: (id: string, updates: Partial<Column>) => void;
  deleteColumn: (id: string) => void;
  moveColumn: (fromIndex: number, toIndex: number) => void;

  // Cards
  cards: Record<string, Card>;
  addCard: (columnId: string, card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string, toIndex: number) => void;

  // Labels
  labels: Label[];
  addLabel: (label: Omit<Label, 'id'>) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}
```

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `n` | New card in current column |
| `e` | Edit selected card |
| `d` | Delete selected card (with confirm) |
| `Enter` | Open card modal |
| `Escape` | Close modal / deselect |
| `←` `→` | Navigate columns |
| `↑` `↓` | Navigate cards |
| `m` | Move card to next column |
| `M` (Shift+m) | Move card to previous column |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `?` | Show keyboard shortcuts |
| `/` | Focus search |

## Future Considerations

- **Multi-board Support**: Multiple boards with board switcher
- **Real-time Collaboration**: WebSocket-based live updates
- **User Authentication**: User accounts and sharing
- **Backend API**: Server-side persistence with REST/GraphQL
- **Mobile Responsiveness**: Touch-optimized mobile view
- **Card Comments**: Discussion threads on cards
- **Activity Log**: Track all changes to board
- **Swimlanes**: Horizontal grouping for cards
- **Custom Fields**: User-defined card fields
