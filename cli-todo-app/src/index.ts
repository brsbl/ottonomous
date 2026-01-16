import { Command } from 'commander';
import { addTodo } from './commands/add.js';
import { listTodos } from './commands/list.js';
import { doneTodo } from './commands/done.js';
import { removeTodo } from './commands/remove.js';
import { clearCompleted } from './commands/clear.js';

const program = new Command();

program
  .name('todo')
  .version('1.0.0')
  .description('A command-line todo application');

program
  .command('add <text>')
  .description('Add a new todo item')
  .action((text: string) => addTodo(text));

program
  .command('list')
  .description('List all todos')
  .action(() => listTodos());

program
  .command('done <id>')
  .description('Mark a todo as completed')
  .action((id: string) => {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      console.error('Error: ID must be a positive number');
      process.exit(1);
    }
    doneTodo(parsedId);
  });

program
  .command('remove <id>')
  .description('Remove a todo by ID')
  .action((id: string) => {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      console.error('Error: ID must be a positive number');
      process.exit(1);
    }
    removeTodo(parsedId);
  });

program
  .command('clear')
  .description('Clear all completed todos')
  .action(() => clearCompleted());

// Default to list if no command provided
if (process.argv.length === 2) {
  listTodos();
} else {
  program.parse();
}
