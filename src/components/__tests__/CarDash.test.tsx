import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CarDash } from '../CarDash'

describe('CarDash', () => {
  const enterWord = (value = 'car') => {
    const input = screen.getByPlaceholderText<HTMLInputElement>(/car/i)
    fireEvent.change(input, { target: { value } })
    fireEvent.keyDown(input, { key: 'Enter', currentTarget: input })
  }

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updates lap progress when a correct word is typed', async () => {
    render(<CarDash />)

    const wordLabel = await screen.findByText('CAR')
    expect(wordLabel).toBeInTheDocument()

    enterWord()

    const feedback = await screen.findByText(/Vroom! Keep racing!/i)
    expect(feedback).toBeInTheDocument()
    expect(screen.getByText(/Lap:/i)).toHaveTextContent('Lap: 1 / 6')
  })

  it('shows pit crew warning and removes boosts after a mistake', async () => {
    render(<CarDash />)

    enterWord()
    enterWord('cab')

    expect(await screen.findByText(/Slow down! Try again/i)).toBeInTheDocument()
    const boostChip = screen.getByText('Boost').parentElement as HTMLElement
    expect(boostChip.querySelector('.car-chip-value')?.textContent).toBe('0')
    expect(screen.getByText(/Pit crew says:/i)).toHaveTextContent('Pit crew says: try again carefully!')
  })

  it('shows the win banner after completing all laps', async () => {
    render(<CarDash />)

    for (let i = 0; i < 6; i += 1) {
      enterWord()
    }

    expect(await screen.findByText(/You won the race/i)).toBeInTheDocument()
    const playAgain = screen.getByRole('button', { name: /Play Again/i })
    fireEvent.click(playAgain)
    expect(screen.queryByText(/You won the race/i)).not.toBeInTheDocument()
  })
})
