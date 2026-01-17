import { useEffect, useCallback } from 'react';
import { SlidersHorizontal, Heart, CheckCircle, X, RotateCcw } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import type { FilterState } from '../types';

const STORAGE_KEY = 'ableton-project-manager-filters';

/**
 * Loads filter state from localStorage
 */
function loadFiltersFromStorage(): Partial<FilterState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load filters from localStorage:', e);
  }
  return null;
}

/**
 * Saves filter state to localStorage
 */
function saveFiltersToStorage(filters: FilterState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    console.error('Failed to save filters to localStorage:', e);
  }
}

interface DualRangeSliderProps {
  label: string;
  min: number;
  max: number;
  valueMin: number | null;
  valueMax: number | null;
  onChange: (min: number | null, max: number | null) => void;
  step?: number;
  unit?: string;
}

/**
 * Custom dual-range slider component
 */
function DualRangeSlider({
  label,
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  step = 1,
  unit = '',
}: DualRangeSliderProps) {
  const currentMin = valueMin ?? min;
  const currentMax = valueMax ?? max;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    const newMinValue = newMin === min ? null : newMin;
    // Ensure min doesn't exceed max
    if (newMin <= currentMax) {
      onChange(newMinValue, valueMax);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    const newMaxValue = newMax === max ? null : newMax;
    // Ensure max doesn't go below min
    if (newMax >= currentMin) {
      onChange(valueMin, newMaxValue);
    }
  };

  // Calculate positions for visual range indicator
  const minPercent = ((currentMin - min) / (max - min)) * 100;
  const maxPercent = ((currentMax - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-xs text-muted-foreground">
          {currentMin}
          {unit} - {currentMax}
          {unit}
        </span>
      </div>

      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-1.5 bg-secondary rounded-full" />

        {/* Active range highlight */}
        <div
          className="absolute h-1.5 bg-primary/60 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentMin}
          onChange={handleMinChange}
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:bg-primary
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:cursor-grab
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:transition-transform
            [&::-moz-range-thumb]:hover:scale-110
            [&::-moz-range-thumb]:active:cursor-grabbing"
          aria-label={`${label} minimum`}
        />

        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentMax}
          onChange={handleMaxChange}
          className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:bg-primary
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:cursor-grab
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:transition-transform
            [&::-moz-range-thumb]:hover:scale-110
            [&::-moz-range-thumb]:active:cursor-grabbing"
          aria-label={`${label} maximum`}
        />
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Toggle switch component
 */
function Toggle({ label, icon, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
          ${checked ? 'bg-primary' : 'bg-secondary'}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        `}
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform
            ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}
          `}
          style={{
            transform: checked ? 'translateX(18px)' : 'translateX(2px)',
          }}
        />
      </button>
    </label>
  );
}

interface FilterPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Filter panel component with BPM and track count sliders, favorites/analyzed toggles
 */
export function FilterPanel({ isOpen = true, onClose, className = '' }: FilterPanelProps) {
  const filters = useProjectStore((state) => state.filters);
  const updateFilters = useProjectStore((state) => state.updateFilters);

  // Load filters from localStorage on mount
  useEffect(() => {
    const storedFilters = loadFiltersFromStorage();
    if (storedFilters) {
      updateFilters(storedFilters);
    }
  }, [updateFilters]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  const handleBpmChange = useCallback(
    (min: number | null, max: number | null) => {
      updateFilters({ bpmMin: min, bpmMax: max });
    },
    [updateFilters]
  );

  const handleTrackCountChange = useCallback(
    (min: number | null, max: number | null) => {
      updateFilters({ trackCountMin: min, trackCountMax: max });
    },
    [updateFilters]
  );

  const handleFavoritesOnlyChange = useCallback(
    (checked: boolean) => {
      updateFilters({ favoritesOnly: checked });
    },
    [updateFilters]
  );

  const handleAnalyzedOnlyChange = useCallback(
    (checked: boolean) => {
      updateFilters({ analyzedOnly: checked });
    },
    [updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    updateFilters({
      bpmMin: null,
      bpmMax: null,
      trackCountMin: null,
      trackCountMax: null,
      favoritesOnly: false,
      analyzedOnly: false,
    });
  }, [updateFilters]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.bpmMin !== null ||
    filters.bpmMax !== null ||
    filters.trackCountMin !== null ||
    filters.trackCountMax !== null ||
    filters.favoritesOnly ||
    filters.analyzedOnly;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`bg-card border border-border rounded-lg p-4 space-y-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </h3>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="p-1.5 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Reset filters"
              title="Reset filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close filter panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* BPM Range Slider */}
      <DualRangeSlider
        label="BPM"
        min={0}
        max={200}
        valueMin={filters.bpmMin}
        valueMax={filters.bpmMax}
        onChange={handleBpmChange}
        step={1}
      />

      {/* Track Count Range Slider */}
      <DualRangeSlider
        label="Track Count"
        min={0}
        max={100}
        valueMin={filters.trackCountMin}
        valueMax={filters.trackCountMax}
        onChange={handleTrackCountChange}
        step={1}
      />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Toggles */}
      <div className="space-y-3">
        <Toggle
          label="Favorites only"
          icon={<Heart className="w-4 h-4 text-red-500" />}
          checked={filters.favoritesOnly}
          onChange={handleFavoritesOnlyChange}
        />

        <Toggle
          label="Analyzed only"
          icon={<CheckCircle className="w-4 h-4 text-green-500" />}
          checked={filters.analyzedOnly}
          onChange={handleAnalyzedOnlyChange}
        />
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Filters active. Click{' '}
            <button
              onClick={handleResetFilters}
              className="text-primary hover:underline"
            >
              reset
            </button>{' '}
            to clear.
          </p>
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
