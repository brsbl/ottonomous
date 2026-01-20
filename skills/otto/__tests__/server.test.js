import { describe, it, expect } from 'vitest'
import {
  getArg,
  isValidPort,
  isValidSessionId,
  parseJson,
  SESSION_ID_PATTERN,
} from '../report/server.utils.js'

describe('getArg', () => {
  it('returns the value after the named argument', () => {
    const args = ['--session', 'my-session', '--port', '8080']
    expect(getArg(args, 'session', '')).toBe('my-session')
    expect(getArg(args, 'port', '3456')).toBe('8080')
  })

  it('returns default when argument not found', () => {
    const args = ['--session', 'my-session']
    expect(getArg(args, 'port', '3456')).toBe('3456')
  })

  it('returns default for empty args array', () => {
    expect(getArg([], 'session', 'default')).toBe('default')
  })

  it('returns default when flag exists but value is missing', () => {
    const args = ['--session']
    expect(getArg(args, 'session', 'default')).toBe('default')
  })
})

describe('isValidPort', () => {
  it('returns true for valid port numbers', () => {
    expect(isValidPort(1)).toBe(true)
    expect(isValidPort(80)).toBe(true)
    expect(isValidPort(3456)).toBe(true)
    expect(isValidPort(8080)).toBe(true)
    expect(isValidPort(65535)).toBe(true)
  })

  it('returns false for port 0', () => {
    expect(isValidPort(0)).toBe(false)
  })

  it('returns false for negative ports', () => {
    expect(isValidPort(-1)).toBe(false)
    expect(isValidPort(-80)).toBe(false)
  })

  it('returns false for ports above 65535', () => {
    expect(isValidPort(65536)).toBe(false)
    expect(isValidPort(100000)).toBe(false)
  })

  it('returns false for NaN', () => {
    expect(isValidPort(NaN)).toBe(false)
  })
})

describe('isValidSessionId', () => {
  it('returns true for valid alphanumeric session IDs', () => {
    expect(isValidSessionId('session123')).toBe(true)
    expect(isValidSessionId('my-session')).toBe(true)
    expect(isValidSessionId('my_session')).toBe(true)
    expect(isValidSessionId('Session-123_test')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(isValidSessionId('')).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isValidSessionId(null)).toBe(false)
    expect(isValidSessionId(undefined)).toBe(false)
  })

  it('returns false for strings starting with --', () => {
    expect(isValidSessionId('--port')).toBe(false)
    expect(isValidSessionId('--session')).toBe(false)
  })

  it('returns false for session IDs with invalid characters', () => {
    expect(isValidSessionId('session/123')).toBe(false)
    expect(isValidSessionId('session.123')).toBe(false)
    expect(isValidSessionId('../path/traversal')).toBe(false)
    expect(isValidSessionId('session id')).toBe(false)
  })
})

describe('SESSION_ID_PATTERN', () => {
  it('matches valid patterns', () => {
    expect(SESSION_ID_PATTERN.test('abc123')).toBe(true)
    expect(SESSION_ID_PATTERN.test('a-b-c')).toBe(true)
    expect(SESSION_ID_PATTERN.test('a_b_c')).toBe(true)
  })

  it('does not match invalid patterns', () => {
    expect(SESSION_ID_PATTERN.test('')).toBe(false)
    expect(SESSION_ID_PATTERN.test('a/b')).toBe(false)
    expect(SESSION_ID_PATTERN.test('a b')).toBe(false)
  })
})

describe('parseJson', () => {
  it('parses valid JSON', () => {
    expect(parseJson('{"key": "value"}')).toEqual({ key: 'value' })
    expect(parseJson('[1, 2, 3]')).toEqual([1, 2, 3])
    expect(parseJson('"string"')).toBe('string')
    expect(parseJson('123')).toBe(123)
    expect(parseJson('null')).toBe(null)
  })

  it('returns null for invalid JSON', () => {
    expect(parseJson('not json')).toBe(null)
    expect(parseJson('{invalid}')).toBe(null)
    expect(parseJson('')).toBe(null)
    expect(parseJson(undefined)).toBe(null)
  })
})
