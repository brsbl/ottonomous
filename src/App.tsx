import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ProjectTable } from './components/ProjectTable';
import { ProjectGrid } from './components/ProjectGrid';
import { FilterPanel } from './components/FilterPanel';
import { Dashboard } from './components/Dashboard';
import { EmptyState } from './components/EmptyState';
import { ScanProgress } from './components/ScanProgress';
import { ProjectDetail } from './components/ProjectDetail';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { useProjectStore } from './store/projectStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { db } from './lib/db';
import {
  requestFolderAccess,
  scanDirectory,
  FolderScanError,
  type ScanProgress as ScanProgressType,
} from './lib/folderScanner';
import { parseAlsFile } from './lib/alsParser';
import type { Project, Folder } from './types';

/** Tab navigation options */
type Tab = 'library' | 'dashboard';

/**
 * BulkActions component - shown when items are selected
 */
function BulkActions({
  selectedCount,
  onClearSelection,
  onFavoriteAll,
  onUnfavoriteAll,
}: {
  selectedCount: number;
  onClearSelection: () => void;
  onFavoriteAll: () => void;
  onUnfavoriteAll: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 z-40">
      <span className="text-sm text-muted-foreground">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onFavoriteAll}
          className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
        >
          Favorite All
        </button>
        <button
          onClick={onUnfavoriteAll}
          className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
        >
          Unfavorite All
        </button>
        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/**
 * Main App component - wires together all components
 */
function App() {
  // Store state
  const {
    projects,
    folders,
    selectedProjectIds,
    viewMode,
    setProjects,
    addFolder,
    toggleFavorite,
    clearSelection,
  } = useProjectStore();

  // Local UI state
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgressType>({
    filesFound: 0,
    directoriesScanned: 0,
    currentDirectory: '',
  });
  const [scanFolderName, setScanFolderName] = useState('');
  const [scanComplete, setScanComplete] = useState(false);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Use keyboard shortcuts hook
  const { showShortcutsHelp, setShowShortcutsHelp } = useKeyboardShortcuts({
    onCloseModal: () => {
      if (selectedProjectForDetail) {
        setSelectedProjectForDetail(null);
      }
    },
    onShowHelp: () => setShowShortcutsHelp(true),
  });

  // Load data from IndexedDB on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [storedProjects, storedFolders] = await Promise.all([
          db.projects.toArray(),
          db.folders.toArray(),
        ]);

        setProjects(storedProjects);
        storedFolders.forEach((folder) => {
          // Add folders that aren't already in store
          if (!folders.some((f) => f.id === folder.id)) {
            addFolder(folder);
          }
        });
      } catch (error) {
        console.error('Failed to load data from IndexedDB:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [setProjects, addFolder, folders]);

  // Handle adding a folder
  const handleAddFolder = useCallback(async () => {
    try {
      // Request folder access
      const dirHandle = await requestFolderAccess();

      // Set up scanning state
      setIsScanning(true);
      setScanFolderName(dirHandle.name);
      setScanComplete(false);
      setScanProgress({
        filesFound: 0,
        directoriesScanned: 0,
        currentDirectory: dirHandle.name,
      });

      // Scan the directory
      const scannedFiles = await scanDirectory(dirHandle, (progress) => {
        setScanProgress({ ...progress });
      });

      // Create folder entry
      const folder: Folder = {
        id: crypto.randomUUID(),
        path: dirHandle.name, // Note: Full path not available in browser
        name: dirHandle.name,
        projectCount: scannedFiles.length,
        lastScanned: new Date(),
        watching: false,
      };

      // Parse each .als file and create project entries
      const newProjects: Project[] = [];

      for (const file of scannedFiles) {
        try {
          const fileData = await file.handle.getFile();
          const arrayBuffer = await fileData.arrayBuffer();
          const metadata = parseAlsFile(arrayBuffer);

          const project: Project = {
            id: crypto.randomUUID(),
            path: file.path,
            name: file.name.replace(/\.als$/i, ''),
            bpm: metadata.bpm,
            key: null,
            duration: null,
            trackCount: metadata.trackCount,
            audioTrackCount: metadata.audioTrackCount,
            midiTrackCount: metadata.midiTrackCount,
            returnTrackCount: metadata.returnTrackCount,
            plugins: metadata.plugins,
            abletonDevices: metadata.abletonDevices,
            samples: [],
            fileSize: fileData.size,
            createdAt: new Date(fileData.lastModified),
            modifiedAt: new Date(fileData.lastModified),
            abletonVersion: metadata.abletonVersion,
            tags: [],
            notes: '',
            rating: null,
            favorite: false,
            lastOpenedAt: null,
            analyzed: metadata.parseErrors.length === 0,
            analysisError: metadata.parseErrors.length > 0 ? metadata.parseErrors.join('; ') : null,
          };

          newProjects.push(project);
        } catch (error) {
          console.error(`Failed to parse file: ${file.path}`, error);
        }
      }

      // Save to IndexedDB
      await db.folders.add(folder);
      await db.projects.bulkAdd(newProjects);

      // Update store
      addFolder(folder);
      setProjects([...projects, ...newProjects]);

      // Mark scan as complete
      setScanComplete(true);
    } catch (error) {
      if (error instanceof FolderScanError) {
        if (error.code === 'ABORTED') {
          // User cancelled - just close scanning modal
          setIsScanning(false);
          return;
        }
        console.error('Folder scan error:', error.message);
      } else {
        console.error('Unexpected error during folder scan:', error);
      }
      setIsScanning(false);
    }
  }, [projects, setProjects, addFolder]);

  // Handle closing scan progress modal
  const handleCloseScanProgress = useCallback(() => {
    setIsScanning(false);
    setScanComplete(false);
  }, []);

  // Handle closing project detail
  const handleCloseProjectDetail = useCallback(() => {
    setSelectedProjectForDetail(null);
  }, []);

  // Handle bulk favorite all
  const handleFavoriteAll = useCallback(() => {
    selectedProjectIds.forEach((id) => {
      const project = projects.find((p) => p.id === id);
      if (project && !project.favorite) {
        toggleFavorite(id);
      }
    });
  }, [selectedProjectIds, projects, toggleFavorite]);

  // Handle bulk unfavorite all
  const handleUnfavoriteAll = useCallback(() => {
    selectedProjectIds.forEach((id) => {
      const project = projects.find((p) => p.id === id);
      if (project && project.favorite) {
        toggleFavorite(id);
      }
    });
  }, [selectedProjectIds, projects, toggleFavorite]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Determine if we should show empty state
  const showEmptyState = folders.length === 0 && projects.length === 0;

  return (
    <Layout>
      {/* Scan progress modal */}
      {isScanning && (
        <ScanProgress
          progress={scanProgress}
          folderName={scanFolderName}
          onCancel={handleCloseScanProgress}
          isComplete={scanComplete}
        />
      )}

      {/* Project detail modal */}
      {selectedProjectForDetail && (
        <ProjectDetail
          project={selectedProjectForDetail}
          isOpen={true}
          onClose={handleCloseProjectDetail}
        />
      )}

      {/* Shortcuts help modal */}
      <ShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* Main content */}
      {showEmptyState ? (
        <EmptyState onAddFolder={handleAddFolder} />
      ) : (
        <div className="flex flex-col h-full">
          {/* Tab navigation */}
          <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'library'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                Dashboard
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'library' && (
                <button
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    isFilterPanelOpen
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Filters
                </button>
              )}
              <button
                onClick={handleAddFolder}
                className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Add Folder
              </button>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'library' ? (
            <div className="flex flex-1 gap-4 overflow-hidden">
              {/* Filter panel (collapsible) */}
              {isFilterPanelOpen && (
                <div className="w-64 flex-shrink-0">
                  <FilterPanel
                    isOpen={true}
                    onClose={() => setIsFilterPanelOpen(false)}
                  />
                </div>
              )}

              {/* Project list */}
              <div className="flex-1 overflow-auto">
                {viewMode === 'table' ? (
                  <ProjectTable />
                ) : (
                  <ProjectGrid />
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <Dashboard />
            </div>
          )}
        </div>
      )}

      {/* Bulk actions bar */}
      <BulkActions
        selectedCount={selectedProjectIds.length}
        onClearSelection={clearSelection}
        onFavoriteAll={handleFavoriteAll}
        onUnfavoriteAll={handleUnfavoriteAll}
      />
    </Layout>
  );
}

export default App;
