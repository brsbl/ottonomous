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

/**
 * Wait for a page to finish loading.
 * @param {import('playwright').Page} page - Playwright page
 * @param {object} options - Wait options
 * @param {number} options.timeout - Timeout in ms (default: 30000)
 */
export async function waitForPageLoad(page, options = {}) {
  const { timeout = DEFAULT_TIMEOUT } = options;
  await page.waitForLoadState("networkidle", { timeout }).catch(() => {
    // Fall back to domcontentloaded if networkidle times out
    return page.waitForLoadState("domcontentloaded", { timeout });
  });
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
