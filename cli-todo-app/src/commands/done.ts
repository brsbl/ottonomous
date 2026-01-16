import { loadTodos, saveTodos } from '../storage.js';
import { formatError } from '../utils/colors.js';

/**
 * Mark a todo as completed by its ID
 * @param id - The ID of the todo to mark as done
 */
export async function doneTodo(id: number): Promise<void> {
  const todos = await loadTodos();

  // Find the todo by id
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    console.log(formatError(`Error: Todo #${id} not found`));
    return;
  }

  // Mark as done and set completedAt timestamp
  todo.done = true;
  todo.completedAt = new Date().toISOString();

  // Save the updated todos
  await saveTodos(todos);

  console.log(`\u2713 Completed: "${todo.text}"`);
}
