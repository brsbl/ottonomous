// =============================================================================
// Design Feedback Module
// =============================================================================
//
// Provides injection and queue management for the design feedback overlay.
// Used by the browser client to inject the overlay and retrieve feedback.
//
// Two interaction models:
// 1. Submit - User submits single feedback immediately
// 2. Save + Send All - User saves multiple, then batch submits
//
// =============================================================================

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cache the script content
let cachedScript = null;

/**
 * Get the design feedback browser script content.
 * Cached after first read.
 * @returns {string} The IIFE script to inject
 */
export function getDesignFeedbackScript() {
  if (cachedScript === null) {
    cachedScript = readFileSync(join(__dirname, "browser-script.js"), "utf-8");
  }
  return cachedScript;
}

/**
 * Inject design feedback overlay into a Playwright page.
 * Safe to call multiple times - the script prevents double initialization.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
export async function injectDesignFeedback(page) {
  const script = getDesignFeedbackScript();
  await page.addScriptTag({ content: script });
}

/**
 * Check if design feedback overlay is already injected in the page.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<boolean>}
 */
export async function isDesignFeedbackInjected(page) {
  return page.evaluate(() => !!window.__designFeedbackInitialized);
}

/**
 * Get submitted feedback from the page (ready for Claude to process).
 * This does NOT clear the queue - use clearSubmittedFeedback for that.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<Array<Object>>} Array of feedback objects
 */
export async function getSubmittedFeedback(page) {
  return page.evaluate(() => window.__designFeedbackSubmit?.slice() || []);
}

/**
 * Clear and return submitted feedback from the page.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<Array<Object>>} Array of cleared feedback objects
 */
export async function clearSubmittedFeedback(page) {
  return page.evaluate(() => {
    if (!window.__designFeedbackSubmit) return [];
    return window.__designFeedbackSubmit.splice(0);
  });
}

/**
 * Get saved feedback count (not yet submitted).
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<number>}
 */
export async function getSavedCount(page) {
  return page.evaluate(() => window.__designFeedbackSaved?.length || 0);
}

/**
 * Get saved feedback from the page (not yet submitted).
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<Array<Object>>} Array of saved feedback objects
 */
export async function getSavedFeedback(page) {
  return page.evaluate(() => window.__designFeedbackSaved?.slice() || []);
}

/**
 * Trigger "Send All" to move saved feedback to submit queue.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
export async function sendAllFeedback(page) {
  await page.evaluate(() => window.__designFeedbackAPI?.sendAll());
}

/**
 * Activate design feedback mode in the page.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
export async function activateDesignFeedbackMode(page) {
  await page.evaluate(() => window.__designFeedbackAPI?.activate());
}

/**
 * Deactivate design feedback mode in the page.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
export async function deactivateDesignFeedbackMode(page) {
  await page.evaluate(() => window.__designFeedbackAPI?.deactivate());
}

/**
 * Remove design feedback overlay from the page completely.
 * @param {import('playwright').Page} page - Playwright page instance
 * @returns {Promise<void>}
 */
export async function cleanupDesignFeedback(page) {
  await page.evaluate(() => window.__designFeedbackAPI?.cleanup());
}

/**
 * Wait for feedback to be submitted (via Submit button or Send All).
 * Returns when the submit queue has items.
 *
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {Object} options - Wait options
 * @param {number} [options.timeout=0] - Timeout in ms (0 = no timeout)
 * @returns {Promise<Array<Object>>} Array of submitted feedback objects
 */
export async function waitForSubmission(page, options = {}) {
  const { timeout = 0 } = options;

  return page.evaluate(
    ({ timeout }) => {
      return new Promise((resolve, reject) => {
        // Check if already has items
        if (window.__designFeedbackSubmit?.length > 0) {
          resolve(window.__designFeedbackSubmit.splice(0));
          return;
        }

        let timeoutId = null;

        const submitHandler = () => {
          cleanup();
          resolve(window.__designFeedbackSubmit.splice(0));
        };

        const closeHandler = () => {
          cleanup();
          resolve([]); // Empty array signals close
        };

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          window.removeEventListener("designFeedback:submitted", submitHandler);
          window.removeEventListener("designFeedback:closed", closeHandler);
        };

        window.addEventListener("designFeedback:submitted", submitHandler);
        window.addEventListener("designFeedback:closed", closeHandler);

        if (timeout > 0) {
          timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error("Timeout waiting for feedback submission"));
          }, timeout);
        }
      });
    },
    { timeout },
  );
}

export default {
  getDesignFeedbackScript,
  injectDesignFeedback,
  isDesignFeedbackInjected,
  getSubmittedFeedback,
  clearSubmittedFeedback,
  getSavedCount,
  getSavedFeedback,
  sendAllFeedback,
  activateDesignFeedbackMode,
  deactivateDesignFeedbackMode,
  cleanupDesignFeedback,
  waitForSubmission,
};
