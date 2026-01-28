// =============================================================================
// Agentation Module
// =============================================================================
//
// Provides injection and queue management for the Agentation annotation system.
// Used by the browser client to inject the annotation overlay and poll for
// annotations from the page.
//
// =============================================================================

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cache the script content
let cachedScript = null;

/**
 * Get the Agentation browser script content.
 * Cached after first read.
 * @returns {string} The IIFE script to inject
 */
export function getAgentationScript() {
  if (cachedScript === null) {
    cachedScript = readFileSync(join(__dirname, "browser-script.js"), "utf-8");
  }
  return cachedScript;
}

/**
 * Inject Agentation into a Playwright page.
 * Safe to call multiple times - the script prevents double initialization.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
export async function injectAgentation(page) {
  const script = getAgentationScript();
  await page.addScriptTag({ content: script });
}

/**
 * Check if Agentation is already injected in the page.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<boolean>}
 */
export async function isAgentationInjected(page) {
  return page.evaluate(() => !!window.__agentationInitialized);
}

/**
 * Get all pending annotations from the page queue.
 * This does NOT clear the queue - use clearAnnotationQueue for that.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<Array<Object>>} Array of annotation objects
 */
export async function getAnnotations(page) {
  return page.evaluate(() => window.__agentationQueue?.slice() || []);
}

/**
 * Clear and return all annotations from the page queue.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<Array<Object>>} Array of cleared annotation objects
 */
export async function clearAnnotationQueue(page) {
  return page.evaluate(() => {
    if (!window.__agentationQueue) return [];
    return window.__agentationQueue.splice(0);
  });
}

/**
 * Activate annotation mode in the page.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
export async function activateAnnotationMode(page) {
  await page.evaluate(() => window.__agentationAPI?.activate());
}

/**
 * Deactivate annotation mode in the page.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
export async function deactivateAnnotationMode(page) {
  await page.evaluate(() => window.__agentationAPI?.deactivate());
}

/**
 * Remove Agentation from the page completely.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
export async function cleanupAgentation(page) {
  await page.evaluate(() => window.__agentationAPI?.cleanup());
}

/**
 * Poll for new annotations with a callback.
 * Continues polling until cancelled.
 *
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {(annotation: Object) => Promise<void>} callback - Called for each new annotation
 * @param {Object} options - Polling options
 * @param {number} [options.interval=500] - Poll interval in ms
 * @param {AbortSignal} [options.signal] - AbortSignal to cancel polling
 * @returns {Promise<void>} Resolves when polling is cancelled
 */
export async function watchAnnotations(page, callback, options = {}) {
  const { interval = 500, signal } = options;

  while (!signal?.aborted) {
    try {
      // Get and clear new annotations
      const annotations = await clearAnnotationQueue(page);

      // Process each annotation
      for (const annotation of annotations) {
        await callback(annotation);
      }

      // Wait before next poll
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, interval);
        if (signal) {
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true }
          );
        }
      });
    } catch (error) {
      // Page might have been closed or navigated
      if (
        error.message?.includes("Target closed") ||
        error.message?.includes("Execution context was destroyed")
      ) {
        break;
      }
      throw error;
    }
  }
}

export default {
  getAgentationScript,
  injectAgentation,
  isAgentationInjected,
  getAnnotations,
  clearAnnotationQueue,
  activateAnnotationMode,
  deactivateAnnotationMode,
  cleanupAgentation,
  watchAnnotations,
};
