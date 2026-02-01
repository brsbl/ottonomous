import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bear Notes App')
  })

  it('renders the setup message', () => {
    render(<App />)
    expect(screen.getByText('Project setup complete')).toBeInTheDocument()
  })

  it('renders the example tag', () => {
    render(<App />)
    expect(screen.getByText('#example-tag')).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    const { container } = render(<App />)
    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('h-screen', 'flex', 'flex-col')
  })
})
