import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS, type AppSettings } from './index'

describe('DEFAULT_SETTINGS', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('system')
    expect(DEFAULT_SETTINGS.fontSize).toBe('medium')
    expect(DEFAULT_SETTINGS.sidebarVisible).toBe(true)
    expect(DEFAULT_SETTINGS.sortOrder).toBe('updated')
  })

  it('should have all required AppSettings keys', () => {
    const expectedKeys: (keyof AppSettings)[] = [
      'theme',
      'fontSize',
      'sidebarVisible',
      'sortOrder',
    ]
    expect(Object.keys(DEFAULT_SETTINGS).sort()).toEqual(expectedKeys.sort())
  })

  it('should have valid theme value', () => {
    const validThemes = ['light', 'dark', 'system']
    expect(validThemes).toContain(DEFAULT_SETTINGS.theme)
  })

  it('should have valid fontSize value', () => {
    const validSizes = ['small', 'medium', 'large']
    expect(validSizes).toContain(DEFAULT_SETTINGS.fontSize)
  })

  it('should have valid sortOrder value', () => {
    const validOrders = ['updated', 'created', 'title']
    expect(validOrders).toContain(DEFAULT_SETTINGS.sortOrder)
  })
})
