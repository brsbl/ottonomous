import { loadTodos, saveTodos } from '../storage.js';

/**
 * Clear all completed todos from the list
 * Removes todos where done=true and reports the count removed
 */
export async function clearCompleted(): Promise<void> {
  const todos = await loadTodos();

  // Filter to keep only incomplete todos
  const remainingTodos = todos.filter(todo => !todo.done);

  // Calculate how many were removed
  const removedCount = todos.length - remainingTodos.length;

  if (removedCount === 0) {
    console.log('No completed todos to clear');
    return;
  }

  // Save the filtered list
  await saveTodos(remainingTodos);

  console.log(`✓ Cleared ${removedCount} completed todo(s)`);
}
