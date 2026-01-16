---
id: cli-todo-app-4457
title: CLI Todo App
status: approved
created: 2026-01-15
session: autopilot-20260115-163856-4457
---

# CLI Todo App

A command-line todo application with local JSON storage and colored terminal output.

## Overview

A fast, simple CLI tool for managing todo items from the terminal. Data persists locally in JSON format, making it portable and easy to backup. Colored output improves readability and status visibility.

## Goals

1. **Simple CLI interface** - Intuitive commands for CRUD operations
2. **Local persistence** - JSON file storage in user's home directory
3. **Colored output** - Visual differentiation of todo states
4. **Cross-platform** - Works on macOS, Linux, and Windows

## Core Features

### Commands

| Command | Description |
|---------|-------------|
| `todo add <text>` | Add a new todo item |
| `todo list` | List all todos (default command) |
| `todo done <id>` | Mark todo as completed |
| `todo remove <id>` | Delete a todo item |
| `todo clear` | Remove all completed todos |

### Todo Item Schema

```typescript
interface Todo {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;  // ISO 8601
  completedAt?: string;  // ISO 8601
}
```

### Data Storage

- **Location**: `~/.todo/todos.json`
- **Format**: JSON array of Todo objects
- **Auto-create**: Directory and file created on first use

### Color Scheme

| State | Color | Example |
|-------|-------|---------|
| Pending | Yellow | `[ ] Buy groceries` |
| Completed | Green + strikethrough | `[✓] Buy groceries` |
| ID numbers | Cyan | `#1` |
| Timestamps | Dim/Gray | `(2 days ago)` |
| Errors | Red | `Error: Todo not found` |
| Success | Green | `Added: "Buy groceries"` |

## Technical Architecture

### Stack

- **Language**: TypeScript
- **Runtime**: Node.js (>=18)
- **Build**: esbuild (fast bundling)
- **Dependencies**:
  - `chalk` - Terminal colors
  - `commander` - CLI parsing

### Project Structure

```
cli-todo-app/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts        # CLI entry point
│   ├── commands/       # Command implementations
│   │   ├── add.ts
│   │   ├── list.ts
│   │   ├── done.ts
│   │   ├── remove.ts
│   │   └── clear.ts
│   ├── storage.ts      # JSON file operations
│   ├── types.ts        # TypeScript interfaces
│   └── utils/
│       ├── colors.ts   # Chalk helpers
│       └── time.ts     # Relative time formatting
├── dist/               # Compiled output
└── bin/
    └── todo            # Executable entry
```

### Build Output

Single executable file via esbuild:
- `dist/todo.js` - Bundled Node.js script
- Shebang: `#!/usr/bin/env node`

## User Flows

### Flow 1: Add Todo
```
$ todo add "Buy groceries"
✓ Added: "Buy groceries" (#1)
```

### Flow 2: List Todos
```
$ todo list
Todo List (2 items)

  #1 [ ] Buy groceries              (just now)
  #2 [✓] Fix the bug                (completed 2h ago)
```

### Flow 3: Complete Todo
```
$ todo done 1
✓ Completed: "Buy groceries"
```

### Flow 4: Error Handling
```
$ todo done 999
✗ Error: Todo #999 not found
```

## Non-Goals (Out of Scope)

- Due dates / reminders
- Priority levels
- Tags / categories
- Cloud sync
- Multiple lists
- Undo functionality

## Success Criteria

1. All 5 commands work correctly
2. Data persists across sessions
3. Colored output displays properly in terminal
4. Handles edge cases (empty list, invalid IDs)
5. Clean error messages
