import { loadTodos, saveTodos } from '../storage.js';
import { formatSuccess, formatId } from '../utils/colors.js';
import type { Todo } from '../types.js';

/**
 * Add a new todo item
 * @param text - The text description of the todo
 */
export async function addTodo(text: string): Promise<void> {
  // Load existing todos
  const todos = await loadTodos();

  // Generate new ID (max existing ID + 1, or 1 if empty)
  const newId = todos.length > 0
    ? Math.max(...todos.map(todo => todo.id)) + 1
    : 1;

  // Create new todo object
  const newTodo: Todo = {
    id: newId,
    text: text,
    done: false,
    createdAt: new Date().toISOString()
  };

  // Add to todos array and save
  todos.push(newTodo);
  await saveTodos(todos);

  // Print success message
  console.log(formatSuccess(`Added: "${text}" (${formatId(newId)})`));
}
