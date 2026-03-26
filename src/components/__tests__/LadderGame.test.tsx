import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LadderGame } from '../LadderGame'

describe('LadderGame', () => {
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

    const input = screen.getByPlaceholderText('???') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'cat' } })
    fireEvent.keyDown(input, { key: 'Enter', currentTarget: input })

    const feedback = await screen.findByText(/Abhimanyu climbs up/i)
    expect(feedback).toBeInTheDocument()
    expect(screen.getByText(/Ladder:/i)).toHaveTextContent('Ladder: 1 / 8')
  })
})
