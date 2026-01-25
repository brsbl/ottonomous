/**
 * Browser automation client for ottonomous skills.
 * Provides a simple API for browser automation tasks.
 *
 * Usage:
 *   import { connect, waitForPageLoad } from './client.js';
 *
 *   const client = await connect();
 *   const page = await client.page('my-page');
 *   await page.goto('https://example.com');
 *   await waitForPageLoad(page);
 *   await page.screenshot({ path: 'screenshot.png' });
 *   await client.disconnect();
 */

import { chromium } from "playwright";
import {
  normalizePageName,
  validateScreenshotOptions,
} from "./server.utils.js";
import { getSnapshotScript } from "./snapshot/index.js";

const DEFAULT_TIMEOUT = 30000;

/**
 * Connect to a browser instance. Always launches a new browser directly.
 * @param {object} options - Connection options
 * @param {boolean} options.headless - Run headless (default: true)
 * @returns {Promise<BrowserClient>}
 */
export async function connect(options = {}) {
  const { headless = true } = options;

  const browser = await chromium.launch({
    headless,
  });

  return new BrowserClient(browser);
}

// Domains to ignore when checking for pending requests (ads, tracking, etc.)
const IGNORED_DOMAINS = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.com",
  "facebook.net",
  "twitter.com",
  "linkedin.com",
  "hotjar.com",
  "mixpanel.com",
  "segment.com",
  "amplitude.com",
  "sentry.io",
  "newrelic.com",
  "datadoghq.com",
  "adsense",
  "adservice",
  "analytics",
  "tracking",
  "beacon",
];

/**
 * Wait for a page to finish loading using Performance API monitoring.
 * Monitors document.readyState and pending network requests, filtering out
 * ads and tracking requests that may never complete.
 * @param {import('playwright').Page} page - Playwright page
 * @param {object} options - Wait options
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 * @param {number} options.idleTime - Time with no activity to consider loaded (default: 500)
 */
export async function waitForPageLoad(page, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, idleTime = 500 } = options;

  // First, wait for domcontentloaded
  await page.waitForLoadState("domcontentloaded", { timeout });

  const startTime = Date.now();

  // Then monitor for network idle using Performance API
  const isPageLoaded = async () => {
    return page.evaluate((ignoredDomains) => {
      // Check document ready state
      if (document.readyState !== "complete") {
        return { ready: false, reason: "document not complete" };
      }

      // Use Performance API to check for pending requests
      if (
        typeof PerformanceObserver !== "undefined" &&
        performance.getEntriesByType
      ) {
        const resources = performance.getEntriesByType("resource");
        const pendingResources = resources.filter((entry) => {
          // Check if resource is still loading (responseEnd is 0 or not set)
          if (entry.responseEnd > 0) return false;

          // Filter out ignored domains
          const url = entry.name.toLowerCase();
          for (const domain of ignoredDomains) {
            if (url.includes(domain)) return false;
          }

          return true;
        });

        if (pendingResources.length > 0) {
          return {
            ready: false,
            reason: `${pendingResources.length} pending requests`,
          };
        }
      }

      return { ready: true };
    }, IGNORED_DOMAINS);
  };

  // Poll until page is loaded or timeout
  while (Date.now() - startTime < timeout) {
    const result = await isPageLoaded();
    if (result.ready) {
      // Wait for idle time to ensure no new requests
      await page.waitForTimeout(idleTime);
      const secondCheck = await isPageLoaded();
      if (secondCheck.ready) {
        return { ready: true };
      }
    }
    await page.waitForTimeout(100);
  }

  // Timeout reached
  throw new Error(
    "Page load timeout: page did not stabilize within the timeout period",
  );
}

/**
 * Take a screenshot with validation.
 * @param {import('playwright').Page} page - Playwright page
 * @param {object} options - Screenshot options
 * @returns {Promise<Buffer>}
 */
export async function screenshot(page, options = {}) {
  const validation = validateScreenshotOptions(options);
  if (!validation.valid) {
    throw new Error(
      `Invalid screenshot options: ${validation.errors.join(", ")}`,
    );
  }
  return page.screenshot(options);
}

/**
 * Browser client with direct browser control.
 */
class BrowserClient {
  constructor(browser) {
    this.browser = browser;
    this.pages = new Map();
  }

  /**
   * Get or create a named page.
   * @param {string} name - Page name
   * @returns {Promise<import('playwright').Page>}
   */
  async page(name) {
    const normalized = normalizePageName(name);

    if (this.pages.has(normalized)) {
      return this.pages.get(normalized);
    }

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    this.pages.set(normalized, page);
    return page;
  }

  /**
   * Close a named page.
   * @param {string} name - Page name
   * @returns {Promise<boolean>} True if page was closed
   */
  async closePage(name) {
    const normalized = normalizePageName(name);
    const page = this.pages.get(normalized);

    if (page) {
      await page.close();
      this.pages.delete(normalized);
      return true;
    }
    return false;
  }

  /**
   * List all open pages.
   * @returns {Promise<Array<{name: string, url: string, title: string}>>}
   */
  async listPages() {
    const pages = [];
    for (const [name, page] of this.pages) {
      pages.push({
        name,
        url: page.url(),
        title: await page.title().catch(() => ""),
      });
    }
    return pages;
  }

  /**
   * Get an ARIA snapshot of a page for AI agent consumption.
   * Returns a YAML representation of the accessibility tree with element refs.
   * @param {string} name - Page name
   * @returns {Promise<string>} YAML accessibility tree
   */
  async getAISnapshot(name) {
    const normalized = normalizePageName(name);
    if (!this.pages.has(normalized)) {
      throw new Error(`Page "${name}" not found. Create it first with page().`);
    }
    const page = this.pages.get(normalized);

    // Only inject if not already present
    const hasSnapshot = await page.evaluate(
      () => typeof window.__devBrowser_getAISnapshot === "function",
    );
    if (!hasSnapshot) {
      const script = getSnapshotScript();
      await page.addScriptTag({ content: script });
    }

    // Generate and return the snapshot
    return page.evaluate(() => window.__devBrowser_getAISnapshot());
  }

  /**
   * Get an element handle by its snapshot ref.
   * Must call getAISnapshot first to generate refs.
   * @param {string} name - Page name
   * @param {string} ref - Element ref (e.g., "e1", "e5")
   * @returns {Promise<import('playwright').ElementHandle>} Element handle
   */
  async selectSnapshotRef(name, ref) {
    const normalized = normalizePageName(name);
    if (!this.pages.has(normalized)) {
      throw new Error(`Page "${name}" not found. Create it first with page().`);
    }
    const page = this.pages.get(normalized);

    return page.evaluateHandle((r) => {
      const refs = window.__devBrowserRefs;
      if (!refs) {
        throw new Error("No refs available. Call getAISnapshot first.");
      }
      const element = refs[r];
      if (!element) {
        throw new Error(
          `Ref "${r}" not found. Available refs: ${Object.keys(refs).join(", ")}`,
        );
      }
      return element;
    }, ref);
  }

  /**
   * Disconnect and close browser.
   */
  async disconnect() {
    for (const page of this.pages.values()) {
      await page.close().catch(() => {});
    }
    this.pages.clear();
    await this.browser.close();
  }
}

// Re-export utilities for convenience
export { normalizePageName, validateScreenshotOptions };
