import { useMemo } from 'react';
import { Search, LayoutGrid, List, Menu, Sun, Moon, Download } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useProjectStore } from '../store/projectStore';
import { searchProjects } from '../lib/search';
import { exportToCsv } from '../lib/export';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    projects
  } = useProjectStore();

  // Calculate match count using fuzzy search
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects.length;
    }
    const results = searchProjects(searchQuery, projects);
    return results.length;
  }, [searchQuery, projects]);

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left section: Menu button and Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-secondary rounded-md transition-colors md:hidden"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <h1 className="text-lg font-semibold hidden sm:block">Ableton Project Manager</h1>
          <h1 className="text-lg font-semibold sm:hidden">APM</h1>
        </div>
      </div>

      {/* Center section: Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-16 py-2 bg-secondary border border-border rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {/* Match count badge */}
          {searchQuery.trim() && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>
      </div>

      {/* Right section: Export, Theme toggle and View toggle */}
      <div className="flex items-center gap-2">
        {/* Export button */}
        <button
          onClick={() => exportToCsv(projects)}
          className="p-2 hover:bg-secondary rounded-md transition-colors"
          aria-label="Export projects to CSV"
          title="Export to CSV"
          disabled={projects.length === 0}
        >
          <Download className={`w-4 h-4 transition-colors ${
            projects.length === 0
              ? 'text-muted-foreground/50'
              : 'text-muted-foreground hover:text-foreground'
          }`} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-secondary rounded-md transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </button>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-secondary rounded-md p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'table'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            }`}
            aria-label="Table view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
