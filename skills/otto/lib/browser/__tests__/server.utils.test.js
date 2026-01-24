import { describe, expect, it } from "vitest";
import {
  buildResponse,
  getArg,
  isValidPort,
  normalizePageName,
  validateScreenshotOptions,
} from "../server.utils.js";

describe("getArg", () => {
  // Happy path
  it("returns value after named argument", () => {
    expect(getArg(["--port", "8080"], "port", "3000")).toBe("8080");
  });

  it("returns value for argument in middle of array", () => {
    expect(
      getArg(["--headless", "--port", "9000", "--verbose"], "port", "3000"),
    ).toBe("9000");
  });

  // Default/fallback
  it("returns default when argument not found", () => {
    expect(getArg([], "port", "3000")).toBe("3000");
  });

  it("returns default when argument has no value", () => {
    expect(getArg(["--port"], "port", "3000")).toBe("3000");
  });

  // Edge cases
  it("handles empty array", () => {
    expect(getArg([], "config", "default.json")).toBe("default.json");
  });

  it("is case-sensitive", () => {
    expect(getArg(["--Port", "8080"], "port", "3000")).toBe("3000");
  });
});

describe("isValidPort", () => {
  // Valid inputs
  it("accepts port 1", () => {
    expect(isValidPort(1)).toBe(true);
  });

  it("accepts port 80", () => {
    expect(isValidPort(80)).toBe(true);
  });

  it("accepts port 8080", () => {
    expect(isValidPort(8080)).toBe(true);
  });

  it("accepts port 65535", () => {
    expect(isValidPort(65535)).toBe(true);
  });

  // Boundary conditions
  it("rejects port 0", () => {
    expect(isValidPort(0)).toBe(false);
  });

  it("rejects ports above 65535", () => {
    expect(isValidPort(65536)).toBe(false);
  });

  it("rejects negative ports", () => {
    expect(isValidPort(-1)).toBe(false);
  });

  // Invalid inputs
  it("rejects NaN", () => {
    expect(isValidPort(Number.NaN)).toBe(false);
  });

  it("rejects Infinity", () => {
    expect(isValidPort(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("normalizePageName", () => {
  // Happy path
  it("lowercases name", () => {
    expect(normalizePageName("MyPage")).toBe("mypage");
  });

  it("replaces spaces with hyphens", () => {
    expect(normalizePageName("my page")).toBe("my-page");
  });

  it("removes special characters", () => {
    expect(normalizePageName("page@123!")).toBe("page-123-");
  });

  // Edge cases
  it('returns "default" for empty string', () => {
    expect(normalizePageName("")).toBe("default");
  });

  it('returns "default" for null', () => {
    expect(normalizePageName(null)).toBe("default");
  });

  it('returns "default" for undefined', () => {
    expect(normalizePageName(undefined)).toBe("default");
  });

  it("trims whitespace", () => {
    expect(normalizePageName("  test  ")).toBe("test");
  });

  it("preserves hyphens and underscores", () => {
    expect(normalizePageName("test-page_1")).toBe("test-page_1");
  });
});

describe("buildResponse", () => {
  // Happy path
  it("builds success response with data", () => {
    const result = buildResponse(true, { name: "test" });
    expect(result).toEqual({ success: true, name: "test" });
  });

  it("builds error response", () => {
    const result = buildResponse(false, {}, "Something went wrong");
    expect(result).toEqual({ success: false, error: "Something went wrong" });
  });

  // Edge cases
  it("handles empty data", () => {
    const result = buildResponse(true);
    expect(result).toEqual({ success: true });
  });

  it("does not include error key when null", () => {
    const result = buildResponse(true, { foo: "bar" }, null);
    expect(result).toEqual({ success: true, foo: "bar" });
    expect("error" in result).toBe(false);
  });
});

describe("validateScreenshotOptions", () => {
  // Valid inputs
  it("accepts empty options", () => {
    const result = validateScreenshotOptions({});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts valid path", () => {
    const result = validateScreenshotOptions({ path: "./screenshot.png" });
    expect(result.valid).toBe(true);
  });

  it("accepts fullPage boolean", () => {
    const result = validateScreenshotOptions({ fullPage: true });
    expect(result.valid).toBe(true);
  });

  it("accepts png type", () => {
    const result = validateScreenshotOptions({ type: "png" });
    expect(result.valid).toBe(true);
  });

  it("accepts jpeg type", () => {
    const result = validateScreenshotOptions({ type: "jpeg" });
    expect(result.valid).toBe(true);
  });

  it("accepts valid quality", () => {
    const result = validateScreenshotOptions({ quality: 80 });
    expect(result.valid).toBe(true);
  });

  // Invalid inputs
  it("rejects non-string path", () => {
    const result = validateScreenshotOptions({ path: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("path must be a string");
  });

  it("rejects non-boolean fullPage", () => {
    const result = validateScreenshotOptions({ fullPage: "yes" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("fullPage must be a boolean");
  });

  it("rejects invalid type", () => {
    const result = validateScreenshotOptions({ type: "gif" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('type must be "png" or "jpeg"');
  });

  it("rejects quality out of range", () => {
    const result = validateScreenshotOptions({ quality: 150 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "quality must be a number between 0 and 100",
    );
  });

  it("rejects negative quality", () => {
    const result = validateScreenshotOptions({ quality: -10 });
    expect(result.valid).toBe(false);
  });

  // Boundary conditions
  it("accepts quality 0", () => {
    const result = validateScreenshotOptions({ quality: 0 });
    expect(result.valid).toBe(true);
  });

  it("accepts quality 100", () => {
    const result = validateScreenshotOptions({ quality: 100 });
    expect(result.valid).toBe(true);
  });

  // Multiple errors
  it("reports multiple validation errors", () => {
    const result = validateScreenshotOptions({
      path: 123,
      fullPage: "yes",
      type: "gif",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });
});
