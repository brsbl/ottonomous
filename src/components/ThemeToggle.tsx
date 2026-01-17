import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../lib/theme';

interface ThemeToggleProps {
  /** Display as icon-only button (default) or with text */
  variant?: 'icon' | 'full';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Theme toggle component that allows switching between light, dark, and system themes.
 */
export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  // Get the icon to display based on resolved theme
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  if (variant === 'full') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className}>
            <CurrentIcon className="h-4 w-4 mr-2" />
            {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className={theme === value ? 'bg-accent' : ''}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={theme === value ? 'bg-accent' : ''}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
