import { useState } from 'react';
import { Search, LayoutGrid, List, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');

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
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Right section: View toggle */}
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
    </header>
  );
}

export default Header;
