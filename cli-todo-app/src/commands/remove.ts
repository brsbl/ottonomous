import { loadTodos, saveTodos } from '../storage.js';
import { formatError } from '../utils/colors.js';

/**
 * Remove a todo by its ID
 * @param id - The ID of the todo to remove
 */
export async function removeTodo(id: number): Promise<void> {
  const todos = await loadTodos();

  // Find the index of the todo with the given id
  const index = todos.findIndex(todo => todo.id === id);

  if (index === -1) {
    console.log(formatError(`Error: Todo #${id} not found`));
    return;
  }

  // Get the todo text before removing
  const todoText = todos[index].text;

  // Remove the todo from the array
  todos.splice(index, 1);

  // Save the updated list
  await saveTodos(todos);

  console.log(`\u2713 Removed: "${todoText}"`);
}
