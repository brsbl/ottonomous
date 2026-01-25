import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connect, waitForPageLoad } from "../client.js";

describe("Snapshot functionality", () => {
  let client;

  beforeAll(async () => {
    client = await connect({ headless: true });
  });

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  it("should generate ARIA snapshot from a page", async () => {
    const page = await client.page("snapshot-test");

    // Create a simple HTML page with various elements
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Test Page</title></head>
        <body>
          <header>
            <nav>
              <a href="/home">Home</a>
              <a href="/about">About</a>
            </nav>
          </header>
          <main>
            <h1>Welcome</h1>
            <button id="btn1">Click Me</button>
            <input type="text" placeholder="Enter name" />
            <ul>
              <li><a href="/item1">Item 1</a></li>
              <li><a href="/item2">Item 2</a></li>
            </ul>
          </main>
        </body>
      </html>
    `);

    const snapshot = await client.getAISnapshot("snapshot-test");

    // Verify it returns a string
    expect(typeof snapshot).toBe("string");

    // Verify it contains expected elements
    expect(snapshot).toContain("banner");
    expect(snapshot).toContain("main");
    expect(snapshot).toContain("navigation");
    expect(snapshot).toContain('link "Home"');
    expect(snapshot).toContain('link "About"');
    expect(snapshot).toContain('heading "Welcome"');
    expect(snapshot).toContain('button "Click Me"');
    expect(snapshot).toContain("textbox");
    expect(snapshot).toContain('link "Item 1"');
    expect(snapshot).toContain('link "Item 2"');

    // Verify refs are present
    expect(snapshot).toMatch(/\[ref=e\d+\]/);
  });

  it("should select element by ref", async () => {
    const page = await client.page("ref-test");

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="test-btn">Test Button</button>
        </body>
      </html>
    `);

    // Generate snapshot first
    const snapshot = await client.getAISnapshot("ref-test");

    // Extract ref from snapshot
    const refMatch = snapshot.match(/button "Test Button" \[ref=(e\d+)\]/);
    expect(refMatch).not.toBeNull();
    const ref = refMatch[1];

    // Get element by ref
    const element = await client.selectSnapshotRef("ref-test", ref);

    // Verify it's the correct element
    const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("button");

    const text = await element.evaluate((el) => el.textContent);
    expect(text).toBe("Test Button");
  });

  it("should throw error when selecting ref without snapshot", async () => {
    const page = await client.page("no-snapshot-test");

    await page.setContent(`
      <!DOCTYPE html>
      <html><body><button>Test</button></body></html>
    `);

    // Clear any existing refs
    await page.evaluate(() => {
      delete window.__devBrowserRefs;
    });

    // Should throw when trying to select a ref
    await expect(
      client.selectSnapshotRef("no-snapshot-test", "e1"),
    ).rejects.toThrow("No refs available");
  });

  it("should throw error for invalid ref", async () => {
    const page = await client.page("invalid-ref-test");

    await page.setContent(`
      <!DOCTYPE html>
      <html><body><button>Test</button></body></html>
    `);

    // Generate snapshot
    await client.getAISnapshot("invalid-ref-test");

    // Try to select an invalid ref
    await expect(
      client.selectSnapshotRef("invalid-ref-test", "e9999"),
    ).rejects.toThrow('Ref "e9999" not found');
  });

  it("should include placeholder in textbox properties", async () => {
    const page = await client.page("placeholder-test");

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <input type="text" placeholder="Enter your email" />
        </body>
      </html>
    `);

    const snapshot = await client.getAISnapshot("placeholder-test");

    expect(snapshot).toContain("textbox");
    expect(snapshot).toContain('/placeholder: "Enter your email"');
  });

  it("should handle heading levels", async () => {
    const page = await client.page("heading-test");

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Level 1</h1>
          <h2>Level 2</h2>
          <h3>Level 3</h3>
        </body>
      </html>
    `);

    const snapshot = await client.getAISnapshot("heading-test");

    expect(snapshot).toContain('heading "Level 1"');
    expect(snapshot).toContain("/level: 1");
    expect(snapshot).toContain('heading "Level 2"');
    expect(snapshot).toContain("/level: 2");
    expect(snapshot).toContain('heading "Level 3"');
    expect(snapshot).toContain("/level: 3");
  });

  it("should click element retrieved by ref", async () => {
    const page = await client.page("click-test");

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="click-btn" onclick="this.textContent = 'Clicked!'">Click Me</button>
        </body>
      </html>
    `);

    // Generate snapshot and get ref
    const snapshot = await client.getAISnapshot("click-test");
    const refMatch = snapshot.match(/button "Click Me" \[ref=(e\d+)\]/);
    expect(refMatch).not.toBeNull();
    const ref = refMatch[1];

    // Get element and click it
    const element = await client.selectSnapshotRef("click-test", ref);
    await element.click();

    // Verify the click worked
    const text = await page.locator("#click-btn").textContent();
    expect(text).toBe("Clicked!");
  });
});

describe("waitForPageLoad improvements", () => {
  let client;

  beforeAll(async () => {
    client = await connect({ headless: true });
  });

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  it("should wait for page to fully load", async () => {
    const page = await client.page("load-test");

    // Navigate to a simple page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="content">Loaded</div>
        </body>
      </html>
    `);

    await waitForPageLoad(page, { timeout: 5000, idleTime: 100 });

    // Page should be ready
    const readyState = await page.evaluate(() => document.readyState);
    expect(readyState).toBe("complete");
  });
});
