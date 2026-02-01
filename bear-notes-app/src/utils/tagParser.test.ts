import { describe, it, expect } from 'vitest'
import { extractTags, extractTitle } from './tagParser'

describe('extractTags', () => {
  describe('basic tag extraction', () => {
    it('should extract a single tag', () => {
      expect(extractTags('Hello #world')).toEqual(['world'])
    })

    it('should extract multiple tags', () => {
      expect(extractTags('#hello and #world')).toEqual(['hello', 'world'])
    })

    it('should return empty array for content without tags', () => {
      expect(extractTags('No tags here')).toEqual([])
    })

    it('should return empty array for empty content', () => {
      expect(extractTags('')).toEqual([])
    })
  })

  describe('tag format handling', () => {
    it('should extract tags with hyphens', () => {
      expect(extractTags('#my-tag')).toEqual(['my-tag'])
    })

    it('should extract tags with underscores', () => {
      expect(extractTags('#my_tag')).toEqual(['my_tag'])
    })

    it('should extract tags with numbers', () => {
      expect(extractTags('#tag123')).toEqual(['tag123'])
    })

    it('should handle mixed alphanumeric tags', () => {
      expect(extractTags('#tag_with-mixed123')).toEqual(['tag_with-mixed123'])
    })
  })

  describe('hierarchical tags', () => {
    it('should extract nested tags and add parent tags', () => {
      const result = extractTags('#work/projects')
      expect(result).toContain('work')
      expect(result).toContain('work/projects')
    })

    it('should extract deeply nested tags with all parents', () => {
      const result = extractTags('#work/projects/alpha')
      expect(result).toEqual(['work', 'work/projects', 'work/projects/alpha'])
    })

    it('should handle multiple nested tags', () => {
      const result = extractTags('#work/tasks and #personal/health')
      expect(result).toContain('work')
      expect(result).toContain('work/tasks')
      expect(result).toContain('personal')
      expect(result).toContain('personal/health')
    })
  })

  describe('deduplication and sorting', () => {
    it('should deduplicate identical tags', () => {
      expect(extractTags('#hello #hello')).toEqual(['hello'])
    })

    it('should return tags sorted alphabetically', () => {
      expect(extractTags('#zebra #apple #mango')).toEqual(['apple', 'mango', 'zebra'])
    })

    it('should deduplicate parent tags from multiple nested tags', () => {
      const result = extractTags('#work/tasks #work/projects')
      expect(result.filter((t) => t === 'work').length).toBe(1)
    })
  })

  describe('code block exclusion', () => {
    it('should ignore tags inside fenced code blocks', () => {
      const content = `
Some text #valid
\`\`\`
#ignored
\`\`\`
More text
`
      expect(extractTags(content)).toEqual(['valid'])
    })

    it('should ignore tags inside inline code', () => {
      expect(extractTags('Use `#ignored` tag and #valid')).toEqual(['valid'])
    })

    it('should handle multiple code blocks', () => {
      const content = `
#outside
\`\`\`js
#inside1
\`\`\`
#between
\`\`\`python
#inside2
\`\`\`
#after
`
      expect(extractTags(content)).toEqual(['after', 'between', 'outside'])
    })

    it('should handle code blocks with language specifiers', () => {
      const content = `
\`\`\`javascript
const tag = '#not-a-tag'
\`\`\`
#real-tag
`
      expect(extractTags(content)).toEqual(['real-tag'])
    })
  })

  describe('edge cases', () => {
    it('should not match hash without word characters', () => {
      expect(extractTags('Price is # or #')).toEqual([])
    })

    it('should handle tags at start and end of content', () => {
      expect(extractTags('#start middle #end')).toEqual(['end', 'start'])
    })

    it('should handle tags on multiple lines', () => {
      const content = `#line1
#line2
#line3`
      expect(extractTags(content)).toEqual(['line1', 'line2', 'line3'])
    })

    it('should handle adjacent tags', () => {
      expect(extractTags('#tag1#tag2')).toEqual(['tag1', 'tag2'])
    })
  })
})

describe('extractTitle', () => {
  describe('H1 heading extraction', () => {
    it('should extract H1 heading as title', () => {
      expect(extractTitle('# My Title\nContent here')).toBe('My Title')
    })

    it('should trim whitespace from H1', () => {
      expect(extractTitle('#   Spaced Title   \nContent')).toBe('Spaced Title')
    })

    it('should extract H1 even if not on first line', () => {
      expect(extractTitle('\n\n# My Title\nContent')).toBe('My Title')
    })

    it('should not match H2 or higher headings', () => {
      expect(extractTitle('## H2 Title\nContent')).toBe('## H2 Title')
    })
  })

  describe('first line fallback', () => {
    it('should use first line when no H1 exists', () => {
      expect(extractTitle('First line\nSecond line')).toBe('First line')
    })

    it('should skip empty lines when finding first line', () => {
      expect(extractTitle('\n\n\nFirst non-empty\nSecond')).toBe('First non-empty')
    })

    it('should trim whitespace from first line', () => {
      expect(extractTitle('  Spaced content  \nMore')).toBe('Spaced content')
    })
  })

  describe('empty content handling', () => {
    it('should return "Untitled" for empty string', () => {
      expect(extractTitle('')).toBe('Untitled')
    })

    it('should return "Untitled" for whitespace-only content', () => {
      expect(extractTitle('   \n\n   ')).toBe('Untitled')
    })
  })

  describe('title length limiting', () => {
    it('should truncate titles longer than 100 characters', () => {
      const longLine = 'a'.repeat(150)
      const result = extractTitle(longLine)
      expect(result.length).toBe(103) // 100 chars + '...'
      expect(result.endsWith('...')).toBe(true)
    })

    it('should not truncate titles at exactly 100 characters', () => {
      const exactLine = 'a'.repeat(100)
      expect(extractTitle(exactLine)).toBe(exactLine)
    })

    it('should not truncate H1 headings', () => {
      const longH1 = '# ' + 'a'.repeat(150)
      const result = extractTitle(longH1)
      expect(result).toBe('a'.repeat(150))
    })
  })

  describe('edge cases', () => {
    it('should handle content with only H1', () => {
      expect(extractTitle('# Just a Title')).toBe('Just a Title')
    })

    it('should handle content with tag-like H1', () => {
      expect(extractTitle('# #tagged Title')).toBe('#tagged Title')
    })

    it('should handle multiline content starting with code', () => {
      expect(extractTitle('```\ncode\n```\nActual content')).toBe('```')
    })
  })
})
