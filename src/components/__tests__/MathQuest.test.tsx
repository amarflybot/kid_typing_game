import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
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
    render(<MathQuest />)

    fireEvent.click(screen.getByRole('button', { name: '6' }))

    expect(screen.getByText('Number star unlocked!')).toBeInTheDocument()
    expect(getChipValue('Math Stars')).toBe('1')
    expect(getChipValue('Streak')).toBe('1')
  })

  it('keeps the problem open after a wrong answer so kids can retry', () => {
    render(<MathQuest />)

    fireEvent.click(screen.getByRole('button', { name: '5' }))

    expect(screen.getByRole('status')).toHaveTextContent(/Almost|Try another|Look at/)
    expect(getChipValue('Math Stars')).toBe('0')
    expect(getChipValue('Streak')).toBe('0')

    fireEvent.click(screen.getByRole('button', { name: '6' }))
    expect(getChipValue('Math Stars')).toBe('1')
  })

  it('moves to the next problem and resets the tap counter', () => {
    render(<MathQuest />)

    fireEvent.click(screen.getByLabelText('stars 1'))
    fireEvent.click(screen.getByRole('button', { name: /Next Problem/i }))

    expect(screen.getByText('Snack Basket')).toBeInTheDocument()
    expect(screen.getByText('Tap Count: 0')).toBeInTheDocument()
    expect(getChipValue('Challenge')).toBe('2 / 6')
  })
})
