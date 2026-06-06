import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../../utils/localStorage'
import { HindiPractice } from '../HindiPractice'

describe('HindiPractice', () => {
  const getChipValue = (label: string) => {
    const chip = screen.getByText(label).parentElement as HTMLElement
    return chip.querySelector('.status-value')?.textContent ?? ''
  }

  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('awards a Hindi star and moves to the next card after a correct answer', () => {
    vi.useFakeTimers()
    try {
      render(<HindiPractice />)

      fireEvent.click(screen.getByRole('button', { name: 'अनार' }))

      expect(screen.getByText('बहुत बढ़िया!')).toBeInTheDocument()
      expect(getChipValue('Hindi Stars')).toBe('1')
      expect(getChipValue('Streak')).toBe('1')

      act(() => {
        vi.advanceTimersByTime(900)
      })

      expect(screen.getByText('Word to Letter')).toBeInTheDocument()
      expect(getChipValue('Practice')).toBe('2 / 64')
    } finally {
      vi.useRealTimers()
    }
  })

  it('restores saved Hindi progress from local storage', () => {
    window.localStorage.setItem(STORAGE_KEYS.hindiScore, JSON.stringify({ stars: 5, streak: 2, answered: 9 }))

    render(<HindiPractice />)

    expect(getChipValue('Hindi Stars')).toBe('5')
    expect(getChipValue('Streak')).toBe('2')
  })
})
