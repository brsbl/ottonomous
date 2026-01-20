import { describe, it, expect } from 'vitest'
import {
  parseFrontmatter,
  generateMetadataHtml,
  parseArgs,
  escapeHtml,
} from '../scripts/md-to-html.utils.js'

describe('parseFrontmatter', () => {
  it('extracts frontmatter and returns content without it', () => {
    const markdown = `---
title: Test Doc
date: 2024-01-15
---
# Content

Hello world`

    const result = parseFrontmatter(markdown)

    expect(result.meta).toEqual({
      title: 'Test Doc',
      date: '2024-01-15',
    })
    expect(result.content).toBe('# Content\n\nHello world')
  })

  it('returns empty meta for markdown without frontmatter', () => {
    const markdown = '# No frontmatter\n\nJust content'

    const result = parseFrontmatter(markdown)

    expect(result.meta).toEqual({})
    expect(result.content).toBe(markdown)
  })

  it('handles values with colons in them', () => {
    const markdown = `---
url: https://example.com
time: 12:30:00
---
Content`

    const result = parseFrontmatter(markdown)

    expect(result.meta.url).toBe('https://example.com')
    expect(result.meta.time).toBe('12:30:00')
  })

  it('trims whitespace from keys and values', () => {
    const markdown = `---
  key  :   value
branch: feature/test
---
Content`

    const result = parseFrontmatter(markdown)

    expect(result.meta.key).toBe('value')
    expect(result.meta.branch).toBe('feature/test')
  })

  it('ignores malformed lines', () => {
    const markdown = `---
valid: yes
no-colon-here
also-valid: true
---
Content`

    const result = parseFrontmatter(markdown)

    expect(result.meta).toEqual({
      valid: 'yes',
      'also-valid': 'true',
    })
  })

  it('handles CRLF line endings', () => {
    const markdown = "---\r\ntitle: Test\r\n---\r\nContent"
    const result = parseFrontmatter(markdown)
    expect(result.meta.title).toBe('Test')
    expect(result.content).toBe('Content')
  })
})

describe('generateMetadataHtml', () => {
  it('returns empty string for empty meta', () => {
    expect(generateMetadataHtml({})).toBe('')
  })

  it('generates date metadata', () => {
    const html = generateMetadataHtml({ date: '2024-01-15' })

    expect(html).toContain('<strong>Date:</strong> 2024-01-15')
    expect(html).toContain('class="metadata"')
  })

  it('generates branch metadata with commits', () => {
    const html = generateMetadataHtml({
      branch: 'feature/test',
      commits: '5',
    })

    expect(html).toContain('<strong>Branch:</strong> feature/test (5 commits)')
  })

  it('generates branch metadata without commits', () => {
    const html = generateMetadataHtml({ branch: 'main' })

    expect(html).toContain('<strong>Branch:</strong> main')
    expect(html).not.toContain('commits')
  })

  it('generates files changed with colored line counts', () => {
    const html = generateMetadataHtml({
      files_changed: '10',
      lines: '+150/-50',
    })

    expect(html).toContain('<strong>Total Files:</strong> 10 files changed')
    expect(html).toContain('color:#22863a')
    expect(html).toContain('+150')
    expect(html).toContain('color:#cb2431')
    expect(html).toContain('-50')
  })

  it('generates files changed with unparseable lines format', () => {
    const html = generateMetadataHtml({
      files_changed: '5',
      lines: 'unknown format',
    })

    expect(html).toContain('5 files changed')
    expect(html).toContain('(unknown format)')
  })

  it('generates complete metadata with all fields', () => {
    const html = generateMetadataHtml({
      date: '2024-01-15',
      branch: 'feature/test',
      commits: '3',
      files_changed: '7',
      lines: '+100/-25',
    })

    expect(html).toContain('Date:')
    expect(html).toContain('Branch:')
    expect(html).toContain('Total Files:')
  })
})

describe('parseArgs', () => {
  it('returns null paths for empty args', () => {
    const result = parseArgs([])

    expect(result.inputPath).toBeNull()
    expect(result.outputPath).toBeNull()
  })

  it('returns input path and generates output path from .md extension', () => {
    const result = parseArgs(['input.md'])

    expect(result.inputPath).toBe('input.md')
    expect(result.outputPath).toBe('input.html')
  })

  it('uses provided output path when given', () => {
    const result = parseArgs(['input.md', 'custom-output.html'])

    expect(result.inputPath).toBe('input.md')
    expect(result.outputPath).toBe('custom-output.html')
  })

  it('handles paths with directories', () => {
    const result = parseArgs(['path/to/file.md'])

    expect(result.inputPath).toBe('path/to/file.md')
    expect(result.outputPath).toBe('path/to/file.html')
  })

  it('handles files without .md extension', () => {
    const result = parseArgs(['readme'])

    expect(result.inputPath).toBe('readme')
    expect(result.outputPath).toBe('readme')
  })
})

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;')
    expect(escapeHtml("it's")).toBe("it&#39;s")
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('handles empty/null input', () => {
    expect(escapeHtml('')).toBe('')
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })
})
