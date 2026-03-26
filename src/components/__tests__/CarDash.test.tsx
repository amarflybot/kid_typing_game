import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CarDash } from '../CarDash'

describe('CarDash', () => {
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

    const input = screen.getByPlaceholderText(/car/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'car' } })
    fireEvent.keyDown(input, { key: 'Enter', currentTarget: input })

    const feedback = await screen.findByText(/Vroom! Keep racing!/i)
    expect(feedback).toBeInTheDocument()
    expect(screen.getByText(/Lap:/i)).toHaveTextContent('Lap: 1 / 6')
  })
})
