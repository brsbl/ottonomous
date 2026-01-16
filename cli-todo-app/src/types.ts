/**
 * Represents a single todo item
 */
export interface Todo {
  id: number;
  text: string;
  done: boolean;
  createdAt: string; // ISO 8601 format
  completedAt?: string; // ISO 8601 format, only set when done is true
}

/**
 * Represents the todo store structure
 */
export interface TodoStore {
  todos: Todo[];
}
