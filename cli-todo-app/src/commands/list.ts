/**
 * List command - Display all todos
 */

import { loadTodos } from '../storage.js';
import { formatTodo } from '../utils/colors.js';

/**
 * List all todos with formatted output
 * Shows empty state message if no todos exist
 */
export async function listTodos(): Promise<void> {
  const todos = await loadTodos();

  if (todos.length === 0) {
    console.log('No todos yet. Add one with: todo add "your task"');
    return;
  }

  console.log(`\nTodo List (${todos.length} items)\n`);

  for (const todo of todos) {
    console.log(formatTodo(todo));
  }

  console.log('');
}
