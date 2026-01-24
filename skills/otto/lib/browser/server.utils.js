/**
 * Pure utility functions for the browser server.
 * Extracted for testability - no I/O, no side effects.
 */

/**
 * Get a named argument value from args array.
 * @param {string[]} args - Command line arguments
 * @param {string} name - Argument name (without --)
 * @param {string} defaultValue - Default if not found
 * @returns {string} The argument value or default
 */
export function getArg(args, name, defaultValue) {
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

/**
 * Check if a port number is valid.
 * @param {number} port - Port number to validate
 * @returns {boolean} True if valid
 */
export function isValidPort(port) {
  return Number.isFinite(port) && port >= 1 && port <= 65535;
}

/**
 * Parse JSON body from an HTTP request.
 * @param {import('http').IncomingMessage} req - HTTP request
 * @returns {Promise<object>} Parsed JSON body
 */
export async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Normalize a page name for use as a key.
 * @param {string} name - Raw page name
 * @returns {string} Normalized name
 */
export function normalizePageName(name) {
  if (!name || typeof name !== "string") {
    return "default";
  }
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-");
}

/**
 * Build a standard API response object.
 * @param {boolean} success - Whether the operation succeeded
 * @param {object} data - Response data
 * @param {string|null} error - Error message if failed
 * @returns {object} Response object
 */
export function buildResponse(success, data = {}, error = null) {
  return {
    success,
    ...data,
    ...(error ? { error } : {}),
  };
}

/**
 * Validate screenshot options.
 * @param {object} options - Screenshot options
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateScreenshotOptions(options = {}) {
  const errors = [];

  if (options.path && typeof options.path !== "string") {
    errors.push("path must be a string");
  }

  if (options.fullPage !== undefined && typeof options.fullPage !== "boolean") {
    errors.push("fullPage must be a boolean");
  }

  if (options.type && !["png", "jpeg"].includes(options.type)) {
    errors.push('type must be "png" or "jpeg"');
  }

  if (options.quality !== undefined) {
    if (
      typeof options.quality !== "number" ||
      options.quality < 0 ||
      options.quality > 100
    ) {
      errors.push("quality must be a number between 0 and 100");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
