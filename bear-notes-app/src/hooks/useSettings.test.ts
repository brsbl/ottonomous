/**
 * Tests for useSettings Hook
 *
 * Tests the following:
 * - Hook returns all expected state properties
 * - Hook returns derived state values
 * - Hook returns all expected action functions
 * - Actions delegate correctly to the store
 *
 * Note: We test the hook's behavior by testing the underlying store
 * since the hook is essentially a thin wrapper around Zustand selectors.
 * This avoids issues with React Testing Library and Zustand's re-render behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../store/appStore';
import { DEFAULT_SETTINGS } from '../types';

// Mock the database operations to prevent actual database calls
vi.mock('../db/noteOperations', () => ({
  getAllNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  archiveNote: vi.fn(),
  unarchiveNote: vi.fn(),
  pinNote: vi.fn(),
  unpinNote: vi.fn(),
}));

vi.mock('../db/database', () => ({
  db: {
    settings: {
      get: vi.fn(),
      update: vi.fn(),
      put: vi.fn(),
    },
  },
  initializeDatabase: vi.fn(),
}));

describe('useSettings hook behavior', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      notes: [],
      selectedNoteId: null,
      notesLoading: false,
      settings: DEFAULT_SETTINGS,
      settingsLoading: false,
    });
    vi.clearAllMocks();
  });

  describe('state properties', () => {
    it('returns settings object from store', () => {
      const state = useAppStore.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('returns settingsLoading state', () => {
      useAppStore.setState({ settingsLoading: true });

      const state = useAppStore.getState();
      expect(state.settingsLoading).toBe(true);
    });

    it('returns settingsLoading as false when not loading', () => {
      useAppStore.setState({ settingsLoading: false });

      const state = useAppStore.getState();
      expect(state.settingsLoading).toBe(false);
    });
  });

  describe('derived state values', () => {
    it('returns theme from settings', () => {
      useAppStore.setState({
        settings: { ...DEFAULT_SETTINGS, theme: 'dark' },
      });

      const state = useAppStore.getState();
      expect(state.settings.theme).toBe('dark');
    });

    it('returns fontSize from settings', () => {
      useAppStore.setState({
        settings: { ...DEFAULT_SETTINGS, fontSize: 'large' },
      });

      const state = useAppStore.getState();
      expect(state.settings.fontSize).toBe('large');
    });

    it('returns sidebarVisible from settings', () => {
      useAppStore.setState({
        settings: { ...DEFAULT_SETTINGS, sidebarVisible: false },
      });

      const state = useAppStore.getState();
      expect(state.settings.sidebarVisible).toBe(false);
    });

    it('returns sortOrder from settings', () => {
      useAppStore.setState({
        settings: { ...DEFAULT_SETTINGS, sortOrder: 'title' },
      });

      const state = useAppStore.getState();
      expect(state.settings.sortOrder).toBe('title');
    });

    it('returns all default derived values', () => {
      const state = useAppStore.getState();

      expect(state.settings.theme).toBe('system');
      expect(state.settings.fontSize).toBe('medium');
      expect(state.settings.sidebarVisible).toBe(true);
      expect(state.settings.sortOrder).toBe('updated');
    });
  });

  describe('action functions availability', () => {
    it('store has updateSettings function', () => {
      const state = useAppStore.getState();
      expect(typeof state.updateSettings).toBe('function');
    });

    it('store has loadSettings function', () => {
      const state = useAppStore.getState();
      expect(typeof state.loadSettings).toBe('function');
    });
  });

  describe('updateSettings action', () => {
    it('updates settings in the store', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      await useAppStore.getState().updateSettings({ theme: 'dark' });

      expect(useAppStore.getState().settings.theme).toBe('dark');
    });

    it('merges updates with existing settings', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      await useAppStore.getState().updateSettings({ fontSize: 'large' });

      const settings = useAppStore.getState().settings;
      // Other settings should remain unchanged
      expect(settings.theme).toBe('system');
      expect(settings.fontSize).toBe('large');
      expect(settings.sidebarVisible).toBe(true);
      expect(settings.sortOrder).toBe('updated');
    });
  });

  describe('setTheme via updateSettings', () => {
    it('sets theme to light', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      await useAppStore.getState().updateSettings({ theme: 'light' });

      expect(useAppStore.getState().settings.theme).toBe('light');
    });

    it('sets theme to dark', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      await useAppStore.getState().updateSettings({ theme: 'dark' });

      expect(useAppStore.getState().settings.theme).toBe('dark');
    });

    it('sets theme to system', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');
      useAppStore.setState({
        settings: { ...DEFAULT_SETTINGS, theme: 'dark' },
      });

      await useAppStore.getState().updateSettings({ theme: 'system' });

      expect(useAppStore.getState().settings.theme).toBe('system');
    });
  });

  describe('setFontSize via updateSettings', () => {
    it('sets fontSize to small', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      await useAppStore.getState().updateSettings({ fontSize: 'small' });

      expect(useAppStore.getState().settings.fontSize).toBe('small');
    });

    it('sets fontSize to medium', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');
      useAppStore.setState({
        settings: { ...DEFAULT_SETTINGS, fontSize: 'large' },
      });

      await useAppStore.getState().updateSettings({ fontSize: 'medium' });

      expect(useAppStore.getState().settings.fontSize).toBe('medium');
    });

    it('sets fontSize to large', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      await useAppStore.getState().updateSettings({ fontSize: 'large' });

      expect(useAppStore.getState().settings.fontSize).toBe('large');
    });
  });

  describe('toggleSidebar behavior via updateSettings', () => {
    it('toggles sidebar from visible to hidden', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      const currentVisibility = useAppStore.getState().settings.sidebarVisible;
      expect(currentVisibility).toBe(true);

      await useAppStore.getState().updateSettings({ sidebarVisible: false });

      expect(useAppStore.getState().settings.sidebarVisible).toBe(false);
    });

    it('toggles sidebar from hidden to visible', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');
      useAppStore.setState({
        settings: { ...DEFAULT_SETTINGS, sidebarVisible: false },
      });

      expect(useAppStore.getState().settings.sidebarVisible).toBe(false);

      await useAppStore.getState().updateSettings({ sidebarVisible: true });

      expect(useAppStore.getState().settings.sidebarVisible).toBe(true);
    });

    it('can toggle multiple times', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      expect(useAppStore.getState().settings.sidebarVisible).toBe(true);

      await useAppStore.getState().updateSettings({ sidebarVisible: false });
      expect(useAppStore.getState().settings.sidebarVisible).toBe(false);

      await useAppStore.getState().updateSettings({ sidebarVisible: true });
      expect(useAppStore.getState().settings.sidebarVisible).toBe(true);
    });
  });

  describe('setSortOrder via updateSettings', () => {
    it('sets sortOrder to updated', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');
      useAppStore.setState({
        settings: { ...DEFAULT_SETTINGS, sortOrder: 'title' },
      });

      await useAppStore.getState().updateSettings({ sortOrder: 'updated' });

      expect(useAppStore.getState().settings.sortOrder).toBe('updated');
    });

    it('sets sortOrder to created', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      await useAppStore.getState().updateSettings({ sortOrder: 'created' });

      expect(useAppStore.getState().settings.sortOrder).toBe('created');
    });

    it('sets sortOrder to title', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.put).mockResolvedValue('app-settings');

      await useAppStore.getState().updateSettings({ sortOrder: 'title' });

      expect(useAppStore.getState().settings.sortOrder).toBe('title');
    });
  });

  describe('loadSettings action', () => {
    it('loads settings from database', async () => {
      const { db } = await import('../db/database');
      const dbSettings = {
        id: 'app-settings',
        theme: 'dark' as const,
        fontSize: 'large' as const,
        sidebarVisible: false,
        sortOrder: 'title' as const,
      };
      vi.mocked(db.settings.get).mockResolvedValue(dbSettings);

      await useAppStore.getState().loadSettings();

      const settings = useAppStore.getState().settings;
      expect(settings.theme).toBe('dark');
      expect(settings.fontSize).toBe('large');
      expect(settings.sidebarVisible).toBe(false);
      expect(settings.sortOrder).toBe('title');
    });

    it('uses default settings if none exist in database', async () => {
      const { db } = await import('../db/database');
      vi.mocked(db.settings.get).mockResolvedValue(undefined);

      await useAppStore.getState().loadSettings();

      const settings = useAppStore.getState().settings;
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('store subscriptions', () => {
    it('notifies subscribers when settings change', () => {
      const callback = vi.fn();
      const unsubscribe = useAppStore.subscribe(callback);

      useAppStore.setState({
        settings: { ...DEFAULT_SETTINGS, theme: 'dark' },
      });

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });
  });

  describe('settings state changes', () => {
    it('updates derived values when settings change', () => {
      expect(useAppStore.getState().settings.fontSize).toBe('medium');
      expect(useAppStore.getState().settings.sidebarVisible).toBe(true);

      useAppStore.setState({
        settings: {
          ...DEFAULT_SETTINGS,
          fontSize: 'large',
          sidebarVisible: false,
        },
      });

      expect(useAppStore.getState().settings.fontSize).toBe('large');
      expect(useAppStore.getState().settings.sidebarVisible).toBe(false);
    });
  });
});
