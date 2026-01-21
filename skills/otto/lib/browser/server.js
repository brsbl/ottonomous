#!/usr/bin/env node
/**
 * Stateful Playwright browser server for ottonomous skills.
 * Manages a single browser instance with persistent named pages.
 *
 * Usage:
 *   node server.js [--port 9222] [--headless]
 *
 * API:
 *   POST /page/:name     - Create or get a named page
 *   DELETE /page/:name   - Close a named page
 *   GET /pages           - List all open pages
 *   POST /shutdown       - Graceful shutdown
 *   GET /health          - Health check
 */

import { chromium } from 'playwright';
import http from 'http';
import { URL } from 'url';
import { getArg, isValidPort } from './server.utils.js';

const DEFAULT_PORT = 9222;
const args = process.argv.slice(2);
const PORT = parseInt(getArg(args, 'port', String(DEFAULT_PORT)), 10);
const HEADLESS = args.includes('--headless');

if (!isValidPort(PORT)) {
  console.error(`Invalid port: ${PORT}`);
  process.exit(1);
}

let browser = null;
const pages = new Map(); // name -> page

async function ensureBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: HEADLESS
    });
    console.log(`Browser launched (headless: ${HEADLESS})`);
  }
  return browser;
}

async function getOrCreatePage(name) {
  if (pages.has(name)) {
    return { page: pages.get(name), created: false };
  }

  const b = await ensureBrowser();
  const context = await b.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  pages.set(name, page);
  console.log(`Page created: ${name}`);
  return { page, created: true };
}

async function closePage(name) {
  const page = pages.get(name);
  if (page) {
    await page.close();
    pages.delete(name);
    console.log(`Page closed: ${name}`);
    return true;
  }
  return false;
}

async function shutdown() {
  console.log('Shutting down...');
  for (const [name, page] of pages) {
    await page.close().catch(() => {});
    console.log(`Page closed: ${name}`);
  }
  pages.clear();
  if (browser) {
    await browser.close();
    browser = null;
  }
  console.log('Browser closed');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  res.setHeader('Content-Type', 'application/json');

  try {
    // Health check
    if (req.method === 'GET' && pathname === '/health') {
      res.end(JSON.stringify({
        status: 'ok',
        browser: !!browser,
        pages: Array.from(pages.keys())
      }));
      return;
    }

    // List pages
    if (req.method === 'GET' && pathname === '/pages') {
      const pageList = [];
      for (const [name, page] of pages) {
        pageList.push({
          name,
          url: page.url(),
          title: await page.title().catch(() => '')
        });
      }
      res.end(JSON.stringify({ pages: pageList }));
      return;
    }

    // Create/get page
    if (req.method === 'POST' && pathname.startsWith('/page/')) {
      const name = decodeURIComponent(pathname.slice(6));
      const { page, created } = await getOrCreatePage(name);
      res.end(JSON.stringify({
        name,
        created,
        url: page.url()
      }));
      return;
    }

    // Close page
    if (req.method === 'DELETE' && pathname.startsWith('/page/')) {
      const name = decodeURIComponent(pathname.slice(6));
      const closed = await closePage(name);
      res.statusCode = closed ? 200 : 404;
      res.end(JSON.stringify({ closed }));
      return;
    }

    // Shutdown
    if (req.method === 'POST' && pathname === '/shutdown') {
      res.end(JSON.stringify({ status: 'shutting_down' }));
      await shutdown();
      process.exit(0);
    }

    // 404
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    console.error('Request error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use`);
    console.error(`Check if another browser server is running: lsof -i :${PORT}`);
    process.exit(1);
  }
  console.error('Server error:', error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Browser server listening on port ${PORT}`);
  console.log(`PID: ${process.pid}`);
});

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

// Export for programmatic use
export { ensureBrowser, getOrCreatePage, closePage, shutdown, pages };
