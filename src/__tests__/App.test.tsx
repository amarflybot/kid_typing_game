import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import App from '../App'
import { STORAGE_KEYS } from '../utils/localStorage'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clears saved app progress from the header reset button', () => {
    window.localStorage.setItem(STORAGE_KEYS.activeTab, JSON.stringify('math'))
    window.localStorage.setItem(STORAGE_KEYS.mathScore, JSON.stringify({ stars: 8, streak: 2, answers: 12 }))
    window.localStorage.setItem(STORAGE_KEYS.ladderScore, JSON.stringify({ score: 90, level: 4 }))

    render(<App />)

    expect(screen.getByText('Math Stars').parentElement?.querySelector('.status-value')).toHaveTextContent('8')

    fireEvent.click(screen.getByRole('button', { name: /Reset Progress/i }))

    expect(window.localStorage.getItem(STORAGE_KEYS.mathScore)).toBeNull()
    expect(window.localStorage.getItem(STORAGE_KEYS.ladderScore)).toBeNull()
    expect(screen.getByText('Level').parentElement?.querySelector('.status-value')).toHaveTextContent('1')
    expect(screen.getByText('Coins').parentElement?.querySelector('.status-value')).toHaveTextContent('0')
  })
})
