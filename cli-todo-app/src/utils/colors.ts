/**
 * Color utilities for terminal output using chalk
 */

import chalk from 'chalk';
import type { Todo } from '../types.js';
import { relativeTime } from './time.js';

/**
 * Format an ID number in cyan with # prefix
 * @param id - The todo ID number
 * @returns Formatted string like "#1" in cyan
 */
export function formatId(id: number): string {
  return chalk.cyan(`#${id}`);
}

/**
 * Format a success message with green checkmark prefix
 * @param msg - The success message
 * @returns Formatted string with green checkmark
 */
export function formatSuccess(msg: string): string {
  return chalk.green('\u2713') + ' ' + msg;
}

/**
 * Format an error message with red X prefix
 * @param msg - The error message
 * @returns Formatted string with red X
 */
export function formatError(msg: string): string {
  return chalk.red('\u2717') + ' ' + msg;
}

/**
 * Format a complete todo line with status, text, and relative time
 * - Pending: yellow "[ ]" + text + dim timestamp
 * - Completed: green "[checkmark]" + strikethrough text + dim "completed X ago"
 * @param todo - The todo item to format
 * @returns Formatted todo line string
 */
export function formatTodo(todo: Todo): string {
  const id = formatId(todo.id);

  if (todo.done) {
    const checkbox = chalk.green('[\u2713]');
    const text = chalk.strikethrough(todo.text);
    const time = todo.completedAt
      ? chalk.dim(`(completed ${relativeTime(todo.completedAt)})`)
      : chalk.dim('(completed)');
    return `  ${id} ${checkbox} ${text} ${time}`;
  } else {
    const checkbox = chalk.yellow('[ ]');
    const time = chalk.dim(`(${relativeTime(todo.createdAt)})`);
    return `  ${id} ${checkbox} ${todo.text} ${time}`;
  }
}
