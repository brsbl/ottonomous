/**
 * Snapshot module exports.
 * Provides the injectable browser script for ARIA snapshot generation.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache the script content
let cachedScript = null;

/**
 * Get the browser-injectable snapshot script.
 * The script is cached after first read.
 * @returns {string} The JavaScript code to inject into the browser
 */
export function getSnapshotScript() {
  if (cachedScript === null) {
    cachedScript = readFileSync(join(__dirname, 'browser-script.js'), 'utf-8');
  }
  return cachedScript;
}
