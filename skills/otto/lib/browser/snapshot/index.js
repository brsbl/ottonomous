/**
 * Snapshot module exports.
 * Provides the injectable browser script for ARIA snapshot generation.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
    cachedScript = readFileSync(join(__dirname, "browser-script.js"), "utf-8");
  }
  return cachedScript;
}
