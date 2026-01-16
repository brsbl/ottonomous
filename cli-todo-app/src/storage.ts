import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Todo } from './types.js';

/**
 * Get the path to the todo storage file
 * @returns The absolute path to ~/.todo/todos.json
 */
export function getStoragePath(): string {
  return path.join(os.homedir(), '.todo', 'todos.json');
}

/**
 * Load todos from the storage file
 * @returns Array of todos, empty array if file doesn't exist
 */
export async function loadTodos(): Promise<Todo[]> {
  const storagePath = getStoragePath();

  try {
    const data = await fs.readFile(storagePath, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Return empty array if file doesn't exist or is invalid
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    // For parse errors or other issues, return empty array
    return [];
  }
}

/**
 * Save todos to the storage file
 * Creates the directory if it doesn't exist
 * @param todos Array of todos to save
 */
export async function saveTodos(todos: Todo[]): Promise<void> {
  const storagePath = getStoragePath();
  const storageDir = path.dirname(storagePath);

  // Create directory if it doesn't exist
  await fs.mkdir(storageDir, { recursive: true });

  // Write todos to file with pretty formatting
  await fs.writeFile(storagePath, JSON.stringify(todos, null, 2), 'utf-8');
}
