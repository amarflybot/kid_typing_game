import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { LadderGame } from '../LadderGame'

describe('LadderGame', () => {
  const enterWord = (value = 'cat') => {
    const input = screen.getByPlaceholderText<HTMLInputElement>('???')
    fireEvent.change(input, { target: { value } })
    fireEvent.keyDown(input, { key: 'Enter', currentTarget: input })
  }

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('advances the ladder after typing the correct word', async () => {
    render(<LadderGame />)

    const wordDisplay = await screen.findByText('CAT')
    expect(wordDisplay).toBeInTheDocument()

    enterWord()

    const feedback = await screen.findByText(/Abhimanyu climbs up/i)
    expect(feedback).toBeInTheDocument()
    expect(screen.getByText(/Ladder:/i)).toHaveTextContent('Ladder: 1 / 8')
  })

  it('penalizes wrong guesses and refills hearts after a timeout', () => {
    vi.useFakeTimers()
    try {
      render(<LadderGame />)

      for (let i = 0; i < 3; i += 1) {
        enterWord('dog')
      }

      expect(screen.getByText(/Oops! Try again/i)).toBeInTheDocument()
      const heartsRow = screen.getByLabelText('Hearts status')
      expect(heartsRow.textContent).toContain('🤍')

      act(() => {
        vi.advanceTimersByTime(700)
      })
      expect(heartsRow).toHaveTextContent('❤️❤️❤️')
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows win state after reaching the top and advances levels on restart', async () => {
    render(<LadderGame />)

    for (let i = 0; i < 8; i += 1) {
      enterWord()
    }

    expect(await screen.findByText(/typing champion/i)).toBeInTheDocument()
    const nextLevelBtn = screen.getByRole('button', { name: /Next Level/i })
    fireEvent.click(nextLevelBtn)

    const levelChip = screen.getByText('Level').parentElement as HTMLElement
    expect(levelChip.querySelector('.status-value')?.textContent).toBe('2')
  })
})
