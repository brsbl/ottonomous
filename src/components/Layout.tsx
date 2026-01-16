import { useState, ReactNode } from 'react';
import { Menu, X, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps {
  sidebar?: ReactNode;
  editor?: ReactNode;
  preview?: ReactNode;
}

export function Layout({ sidebar, editor, preview }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>

          <h1 className="text-xl font-semibold">Second Brain</h1>
        </div>

        {/* Preview toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={() => setPreviewOpen(!previewOpen)}
          aria-label={previewOpen ? 'Hide preview' : 'Show preview'}
        >
          {previewOpen ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRight className="h-5 w-5" />
          )}
        </Button>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Left Sidebar - Navigation */}
        <aside
          className={`
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            ${sidebarOpen ? 'md:w-60' : 'md:w-0 md:overflow-hidden'}
            fixed md:relative
            inset-y-0 left-0 top-14 md:top-0
            w-60
            bg-background
            border-r border-border
            z-50 md:z-0
            transition-all duration-300 ease-in-out
            overflow-y-auto
            shrink-0
          `}
        >
          {sidebar || (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">Navigation</p>
            </div>
          )}
        </aside>

        {/* Center - Editor */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {editor || (
            <div className="p-4 h-full flex items-center justify-center">
              <p className="text-muted-foreground">Editor area</p>
            </div>
          )}
        </main>

        {/* Right - Preview */}
        <aside
          className={`
            ${previewOpen ? 'w-[400px]' : 'w-0 overflow-hidden'}
            hidden md:block
            bg-muted/30
            border-l border-border
            transition-all duration-300 ease-in-out
            overflow-y-auto
            shrink-0
          `}
        >
          {preview || (
            <div className="p-4 h-full flex items-center justify-center">
              <p className="text-muted-foreground">Preview area</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default Layout;
