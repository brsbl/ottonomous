import type { Project } from '../types';

/**
 * Escapes a value for CSV format by handling special characters
 * - Wraps value in quotes if it contains commas, quotes, or newlines
 * - Escapes double quotes by doubling them
 */
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if the value contains special characters that need escaping
  const needsQuoting =
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r');

  if (needsQuoting) {
    // Escape double quotes by doubling them, then wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Joins an array of strings for CSV export
 * Uses semicolon as separator to avoid conflicts with CSV comma delimiter
 */
function joinArray(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) {
    return '';
  }
  return arr.join('; ');
}

/**
 * Exports an array of projects to a CSV file and triggers a browser download
 *
 * @param projects - Array of Project objects to export
 * @param filename - Optional custom filename (defaults to 'ableton-projects-export.csv')
 */
export function exportToCsv(
  projects: Project[],
  filename: string = 'ableton-projects-export.csv'
): void {
  // Define CSV headers
  const headers = [
    'Name',
    'Path',
    'BPM',
    'Track Count',
    'Audio Track Count',
    'MIDI Track Count',
    'Plugins',
    'Tags',
    'Rating',
    'Notes',
  ];

  // Create header row
  const headerRow = headers.map(escapeCSVValue).join(',');

  // Create data rows
  const dataRows = projects.map((project) => {
    const values = [
      project.name,
      project.path,
      project.bpm,
      project.trackCount,
      project.audioTrackCount,
      project.midiTrackCount,
      joinArray(project.plugins),
      joinArray(project.tags),
      project.rating,
      project.notes,
    ];

    return values.map(escapeCSVValue).join(',');
  });

  // Combine all rows with newlines
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  // Create blob and trigger download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Create temporary link element to trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

export default exportToCsv;
