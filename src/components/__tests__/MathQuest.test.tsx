import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { MathQuest } from '../MathQuest'

describe('MathQuest', () => {
  const getChipValue = (label: string) => {
    const chip = screen.getByText(label).parentElement as HTMLElement
    return chip.querySelector('.status-value')?.textContent ?? ''
  }

  it('counts tapped objects for hands-on number practice', () => {
    render(<MathQuest />)

    fireEvent.click(screen.getByLabelText('stars 1'))
    fireEvent.click(screen.getByLabelText('stars 2'))

    expect(screen.getByText('Tap Count: 2')).toBeInTheDocument()
  })

  it('awards a math star when the correct answer is chosen', () => {
    vi.useFakeTimers()
    try {
      render(<MathQuest />)

      fireEvent.click(screen.getByRole('button', { name: '6' }))

      expect(screen.getByText('Number star unlocked!')).toBeInTheDocument()
      expect(getChipValue('Math Stars')).toBe('1')
      expect(getChipValue('Streak')).toBe('1')
    } finally {
      vi.useRealTimers()
    }
  })

  it('records a wrong answer and automatically moves forward', () => {
    vi.useFakeTimers()
    try {
      render(<MathQuest />)

      fireEvent.click(screen.getByRole('button', { name: '5' }))

      expect(screen.getByRole('status')).toHaveTextContent(/Almost|Try another|Look at/)
      expect(getChipValue('Math Stars')).toBe('0')
      expect(getChipValue('Streak')).toBe('0')

      act(() => {
        vi.advanceTimersByTime(900)
      })

      expect(screen.getByText('Snack Basket')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('moves to the next problem after an answer and resets the tap counter', () => {
    vi.useFakeTimers()
    try {
      render(<MathQuest />)

      fireEvent.click(screen.getByLabelText('stars 1'))
      fireEvent.click(screen.getByRole('button', { name: '6' }))

      expect(screen.queryByRole('button', { name: /Next Problem/i })).not.toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(900)
      })

      expect(screen.getByText('Snack Basket')).toBeInTheDocument()
      expect(screen.getByText('Tap Count: 0')).toBeInTheDocument()
      expect(getChipValue('Challenge')).toBe('2 / 178')
    } finally {
      vi.useRealTimers()
    }
  })
})
