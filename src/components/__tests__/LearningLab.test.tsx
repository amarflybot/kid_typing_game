import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LearningLab } from '../LearningLab'

describe('LearningLab', () => {
  const clickLetter = (letter: string) => {
    const tileGrid = screen.getByRole('group', { name: 'Letter tiles' })
    const buttons = within(tileGrid).getAllByRole('button', { name: letter })
    const available = buttons.find((btn) => btn.getAttribute('aria-pressed') !== 'true')
    if (!available) {
      throw new Error(`No available tile for ${letter}`)
    }
    fireEvent.click(available)
  }

  const getChipValue = (label: string) => {
    const chip = screen.getByText(label).parentElement as HTMLElement
    return chip.querySelector('.status-value')?.textContent ?? ''
  }

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('celebrates when the builder word is completed and awards a star', () => {
    render(<LearningLab />)

    ;['C', 'A', 'T'].forEach((letter) => clickLetter(letter))

    expect(screen.getByText('Word garden blooming! 🌷')).toBeInTheDocument()
    expect(getChipValue('Builder Stars')).toBe('1')
  })

  it('undoes the last placed tile so kids can fix mistakes', () => {
    render(<LearningLab />)
    clickLetter('C')

    const firstSlot = screen.getByLabelText('Letter slot 1')
    expect(firstSlot).toHaveTextContent('C')

    const undo = screen.getByRole('button', { name: /Undo/i })
    fireEvent.click(undo)

    expect(firstSlot).toHaveTextContent('_')
  })

  it('matches the correct word card from the clue and updates score', async () => {
    render(<LearningLab />)
    const option = await screen.findByRole('button', { name: /^CAT$/i })
    fireEvent.click(option)

    expect(screen.getByText('Card match magic! ✨')).toBeInTheDocument()
    expect(getChipValue('Match Stars')).toBe('1')
  })
})
