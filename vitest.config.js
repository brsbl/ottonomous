import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'skills/*/vitest.config.js',
      '.claude/skills/*/vitest.config.js',
    ],
  },
})
