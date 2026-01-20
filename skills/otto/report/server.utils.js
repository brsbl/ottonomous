/**
 * Pure utility functions extracted from server.js for testing
 */

/**
 * Get a command line argument value by name
 * @param {string[]} args - Array of command line arguments
 * @param {string} name - Name of the argument (without -- prefix)
 * @param {string} def - Default value if not found
 * @returns {string} The argument value or default
 */
export function getArg(args, name, def) {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const value = args[i + 1];
  return value !== undefined ? value : def;
}

/**
 * Validate a port number
 * @param {number} port - Port number to validate
 * @returns {boolean} True if valid port number
 */
export function isValidPort(port) {
  return !isNaN(port) && port >= 1 && port <= 65535;
}

/**
 * Session ID validation pattern
 */
export const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate a session ID format
 * @param {string} sessionId - Session ID to validate
 * @returns {boolean} True if valid session ID format
 */
export function isValidSessionId(sessionId) {
  if (!sessionId || sessionId.startsWith('--')) {
    return false;
  }
  return SESSION_ID_PATTERN.test(sessionId);
}

/**
 * Parse JSON content safely
 * @param {string} content - JSON string to parse
 * @returns {object|null} Parsed object or null on error
 */
export function parseJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
