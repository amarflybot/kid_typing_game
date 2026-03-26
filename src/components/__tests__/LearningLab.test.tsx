import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LearningLab } from '../LearningLab'

describe('LearningLab', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updates the helper text after choosing a tile', () => {
    render(<LearningLab />)

    const tile = screen.getAllByRole('button', { name: 'C' })[0]
    fireEvent.click(tile)

    expect(screen.getByText('Great! Add the next letter.')).toBeInTheDocument()
  })

  it('matches the correct word card from the clue', async () => {
    render(<LearningLab />)
    const option = await screen.findByRole('button', { name: /^CAT$/i })
    fireEvent.click(option)
    const matchSuccess = await screen.findByText('Card match magic! ✨')
    expect(matchSuccess).toBeInTheDocument()
  })
})
