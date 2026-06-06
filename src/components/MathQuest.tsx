import { useCallback, useEffect, useRef, useState } from 'react'

type MathGroup = {
  label: string
  count: number
  emoji: string
  muted?: boolean
}

type MathChallenge = {
  id: string
  badge: string
  title: string
  story: string
  prompt: string
  equation: string
  answer: number
  options: number[]
  groups?: MathGroup[]
  numberPath?: (number | null)[]
  colors: [string, string]
}

type AnswerState = 'correct' | 'wrong' | ''

const DEFAULT_FEEDBACK = 'Pick the number that solves the puzzle.'
const AUTO_ADVANCE_MS = 900

const MATH_CHEERS = [
  'Number star unlocked!',
  'Math magic sparkles!',
  'Brain power is glowing!',
  'Puzzle solved with style!',
] as const

const TRY_MESSAGES = ['Almost! Count the bright pieces again.', 'Try another number cloud.', 'Look at the math story once more.'] as const

const COUNT_ITEMS = [
  { emoji: '⭐', label: 'stars', title: 'Star Count', noun: 'stars', colors: ['#fff4b8', '#ffd166'] },
  { emoji: '🍎', label: 'apples', title: 'Apple Count', noun: 'apples', colors: ['#ffd6a5', '#ff8fab'] },
  { emoji: '🎈', label: 'balloons', title: 'Balloon Count', noun: 'balloons', colors: ['#cdeefd', '#8ec5fc'] },
  { emoji: '🚀', label: 'rockets', title: 'Rocket Count', noun: 'rockets', colors: ['#b8f2e6', '#84fab0'] },
  { emoji: '🧱', label: 'blocks', title: 'Block Count', noun: 'blocks', colors: ['#fbd786', '#f7797d'] },
] as const

const PALETTES: [string, string][] = [
  ['#fff4b8', '#ffd166'],
  ['#ffd6a5', '#ff8fab'],
  ['#cdeefd', '#8ec5fc'],
  ['#b8f2e6', '#84fab0'],
  ['#e0c3fc', '#f9c5d1'],
  ['#fbd786', '#f7797d'],
]

const uniqueOptions = (answer: number, firstDistractor: number, secondDistractor: number) => {
  const options = [answer, firstDistractor, secondDistractor].map((option) => Math.max(0, option))
  let filler = Math.max(0, answer - 2)

  while (new Set(options).size < 3) {
    if (!options.includes(filler)) {
      options.push(filler)
    }
    filler += 1
  }

  return Array.from(new Set(options)).slice(0, 3).sort((left, right) => left - right)
}

const makeCountingChallenge = (count: number, index: number): MathChallenge => {
  const item = COUNT_ITEMS[index % COUNT_ITEMS.length]
  return {
    id: `count-${count}-${index}`,
    badge: 'Counting',
    title: item.title,
    story: `${count} ${item.noun} are ready to be counted.`,
    prompt: `How many ${item.noun} do you see?`,
    equation: 'Count = ?',
    answer: count,
    options: uniqueOptions(count, count - 1, count + 1),
    groups: [{ label: item.label, count, emoji: item.emoji }],
    colors: item.colors,
  }
}

const makeAdditionChallenge = (left: number, right: number, index: number): MathChallenge => {
  const item = COUNT_ITEMS[index % COUNT_ITEMS.length]
  const answer = left + right
  return {
    id: `add-${left}-${right}`,
    badge: 'Addition',
    title: `${item.title} Add`,
    story: `${left} ${item.noun} meet ${right} more.`,
    prompt: `How many ${item.noun} are there altogether?`,
    equation: `${left} + ${right} = ?`,
    answer,
    options: uniqueOptions(answer, answer - 1, answer + 1),
    groups: [
      { label: `first ${item.noun}`, count: left, emoji: item.emoji },
      { label: `more ${item.noun}`, count: right, emoji: item.emoji },
    ],
    colors: PALETTES[index % PALETTES.length],
  }
}

const makeSubtractionChallenge = (total: number, away: number, index: number): MathChallenge => {
  const item = COUNT_ITEMS[index % COUNT_ITEMS.length]
  const answer = total - away
  return {
    id: `subtract-${total}-${away}`,
    badge: 'Subtraction',
    title: `${item.title} Take Away`,
    story: `${total} ${item.noun} start together. ${away} move away.`,
    prompt: `How many ${item.noun} stay?`,
    equation: `${total} - ${away} = ?`,
    answer,
    options: uniqueOptions(answer, answer - 1, answer + 1),
    groups: [
      { label: `staying ${item.noun}`, count: answer, emoji: item.emoji },
      { label: `away ${item.noun}`, count: away, emoji: item.emoji, muted: true },
    ],
    colors: PALETTES[index % PALETTES.length],
  }
}

const makeCompareChallenge = (left: number, right: number, index: number): MathChallenge => ({
  id: `compare-${left}-${right}`,
  badge: 'Bigger Number',
  title: 'Number Towers',
  story: `One tower has ${left}. The other tower has ${right}.`,
  prompt: 'Which number is bigger?',
  equation: `${left} or ${right}`,
  answer: Math.max(left, right),
  options: uniqueOptions(Math.max(left, right), Math.min(left, right), Math.max(left, right) - 1),
  groups: [
    { label: `number ${left}`, count: left, emoji: '🔵' },
    { label: `number ${right}`, count: right, emoji: '🟢' },
  ],
  colors: PALETTES[index % PALETTES.length],
})

const makeMissingNumberChallenge = (start: number, index: number): MathChallenge => {
  const answer = start + 2
  return {
    id: `missing-${start}`,
    badge: 'Number Order',
    title: 'Step Path',
    story: 'The stepping stones go in order.',
    prompt: 'Which number belongs in the empty step?',
    equation: `${start}, ${start + 1}, ?, ${start + 3}`,
    answer,
    options: uniqueOptions(answer, answer - 1, answer + 2),
    numberPath: [start, start + 1, null, start + 3],
    colors: PALETTES[index % PALETTES.length],
  }
}

const FEATURED_CHALLENGES: MathChallenge[] = [
  {
    id: 'count-stars',
    badge: 'Counting',
    title: 'Star Count',
    story: 'Six shiny stars are ready for bedtime.',
    prompt: 'How many stars do you see?',
    equation: 'Count = ?',
    answer: 6,
    options: [5, 6, 7],
    groups: [{ label: 'stars', count: 6, emoji: '⭐' }],
    colors: ['#fff4b8', '#ffd166'],
  },
  {
    id: 'apple-add',
    badge: 'Addition',
    title: 'Snack Basket',
    story: 'Three red apples meet two more apples.',
    prompt: 'How many apples are in the basket?',
    equation: '3 + 2 = ?',
    answer: 5,
    options: [4, 5, 6],
    groups: [
      { label: 'first apples', count: 3, emoji: '🍎' },
      { label: 'more apples', count: 2, emoji: '🍎' },
    ],
    colors: ['#ffd6a5', '#ff8fab'],
  },
  {
    id: 'balloon-minus',
    badge: 'Subtraction',
    title: 'Balloon Parade',
    story: 'Seven balloons float up. Three drift away.',
    prompt: 'How many balloons stay?',
    equation: '7 - 3 = ?',
    answer: 4,
    options: [3, 4, 5],
    groups: [
      { label: 'staying balloons', count: 4, emoji: '🎈' },
      { label: 'away balloons', count: 3, emoji: '🎈', muted: true },
    ],
    colors: ['#cdeefd', '#8ec5fc'],
  },
  {
    id: 'rocket-compare',
    badge: 'Bigger Number',
    title: 'Rocket Towers',
    story: 'One tower has eight rockets. The other tower has five rockets.',
    prompt: 'Which number is bigger?',
    equation: '8 or 5',
    answer: 8,
    options: [5, 8, 6],
    groups: [
      { label: 'rocket tower 8', count: 8, emoji: '🚀' },
      { label: 'rocket tower 5', count: 5, emoji: '🚀' },
    ],
    colors: ['#b8f2e6', '#84fab0'],
  },
  {
    id: 'missing-number',
    badge: 'Number Order',
    title: 'Step Path',
    story: 'The stepping stones go in order.',
    prompt: 'Which number belongs in the empty step?',
    equation: '4, 5, ?, 7',
    answer: 6,
    options: [6, 8, 3],
    numberPath: [4, 5, null, 7],
    colors: ['#e0c3fc', '#f9c5d1'],
  },
  {
    id: 'blocks-add',
    badge: 'Addition',
    title: 'Block Tower',
    story: 'Four blocks stack up. One more block joins.',
    prompt: 'How many blocks make the tower?',
    equation: '4 + 1 = ?',
    answer: 5,
    options: [5, 6, 4],
    groups: [
      { label: 'tower blocks', count: 4, emoji: '🧱' },
      { label: 'new block', count: 1, emoji: '🧱' },
    ],
    colors: ['#fbd786', '#f7797d'],
  },
]

const GENERATED_CHALLENGES: MathChallenge[] = [
  ...Array.from({ length: 20 }, (_, index) => makeCountingChallenge(index + 1, index)),
  ...Array.from({ length: 11 }, (_, leftIndex) =>
    Array.from({ length: 10 - leftIndex }, (_, rightIndex) => makeAdditionChallenge(leftIndex + 1, rightIndex + 1, leftIndex + rightIndex)),
  ).flat(),
  ...Array.from({ length: 10 }, (_, totalIndex) =>
    Array.from({ length: totalIndex + 1 }, (_, awayIndex) => makeSubtractionChallenge(totalIndex + 1, awayIndex + 1, totalIndex + awayIndex)),
  ).flat(),
  ...Array.from({ length: 24 }, (_, index) => makeCompareChallenge((index % 12) + 1, 20 - (index % 10), index)),
  ...Array.from({ length: 18 }, (_, index) => makeMissingNumberChallenge(index + 1, index)),
]

const MATH_CHALLENGES: MathChallenge[] = [...FEATURED_CHALLENGES, ...GENERATED_CHALLENGES]

const getAnswerState = (option: number, selectedAnswer: number | null, answer: number): AnswerState => {
  if (selectedAnswer !== null && option === answer) return 'correct'
  if (selectedAnswer === option && option !== answer) return 'wrong'
  return ''
}

const pickMessage = (messages: readonly string[], seed: number) => messages[seed % messages.length]

export function MathQuest() {
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [stars, setStars] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState(DEFAULT_FEEDBACK)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [tapCount, setTapCount] = useState(0)
  const [answers, setAnswers] = useState(0)
  const nextProblemTimeoutRef = useRef<number | null>(null)

  const challenge = MATH_CHALLENGES[challengeIndex]

  const clearNextProblemTimeout = useCallback(() => {
    if (nextProblemTimeoutRef.current) {
      window.clearTimeout(nextProblemTimeoutRef.current)
      nextProblemTimeoutRef.current = null
    }
  }, [])

  const advanceChallenge = useCallback(() => {
    setChallengeIndex((current) => (current + 1) % MATH_CHALLENGES.length)
    setSelectedAnswer(null)
    setTapCount(0)
    setFeedback(DEFAULT_FEEDBACK)
  }, [])

  useEffect(() => clearNextProblemTimeout, [clearNextProblemTimeout])

  const handleAnswer = (answer: number) => {
    if (selectedAnswer !== null) return

    const correct = answer === challenge.answer
    setSelectedAnswer(answer)
    setAnswers((current) => current + 1)

    if (correct) {
      setStars((current) => current + 1)
      setStreak((current) => current + 1)
      setFeedback(pickMessage(MATH_CHEERS, stars + streak))
    } else {
      setStreak(0)
      setFeedback(pickMessage(TRY_MESSAGES, answers + answer))
    }

    clearNextProblemTimeout()
    nextProblemTimeoutRef.current = window.setTimeout(() => {
      advanceChallenge()
      nextProblemTimeoutRef.current = null
    }, AUTO_ADVANCE_MS)
  }

  return (
    <div className="math-quest">
      <div className="status-bar">
        <div className="status-chip">
          <span className="status-label">Math Stars</span>
          <span className="status-value">{stars}</span>
        </div>
        <div className="status-chip">
          <span className="status-label">Streak</span>
          <span className="status-value">{streak}</span>
        </div>
        <div className="status-chip coin">
          <span className="status-label">Challenge</span>
          <span className="status-value">
            {challengeIndex + 1} / {MATH_CHALLENGES.length}
          </span>
        </div>
      </div>

      <div className="mission-card">
        <p className="mission-label">Upper KG Math Quest</p>
        <p className="mission-text">Count, add, take away, compare, and find missing numbers.</p>
      </div>

      <div className="math-board">
        <article className="math-card">
          <header className="math-problem-header">
            <span className="math-icon" style={{ background: `linear-gradient(145deg, ${challenge.colors[0]}, ${challenge.colors[1]})` }}>
              {challenge.badge === 'Subtraction' ? '➖' : challenge.badge === 'Bigger Number' ? '🔢' : '➕'}
            </span>
            <div>
              <span className="kid-badge">{challenge.badge}</span>
              <h2>{challenge.title}</h2>
              <p className="lab-card-sub">{challenge.story}</p>
            </div>
          </header>

          <div className="math-stage" style={{ background: `linear-gradient(145deg, ${challenge.colors[0]}, ${challenge.colors[1]})` }}>
            <p className="math-equation">{challenge.equation}</p>

            {challenge.numberPath ? (
              <div className="math-number-path" aria-label="Number path">
                {challenge.numberPath.map((number, index) => (
                  <span key={`${challenge.id}-${index}`} className={`math-path-step ${number === null ? 'missing' : ''}`}>
                    {number ?? '?'}
                  </span>
                ))}
              </div>
            ) : (
              <div className="math-groups">
                {challenge.groups?.map((group) => (
                  <div key={group.label} className={`math-group ${group.muted ? 'muted' : ''}`}>
                    <span className="math-group-label">{group.label}</span>
                    <div className="math-objects">
                      {Array.from({ length: group.count }, (_, itemIndex) => (
                        <button
                          key={`${group.label}-${itemIndex}`}
                          className="math-object"
                          type="button"
                          aria-label={`${group.label} ${itemIndex + 1}`}
                          onClick={() => setTapCount((current) => current + 1)}
                        >
                          {group.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="math-prompt">{challenge.prompt}</p>
          <p className="math-tap-count">Tap Count: {tapCount}</p>

          <div className="math-answer-grid" role="group" aria-label="Answer choices">
            {challenge.options.map((option) => {
              const answerState = getAnswerState(option, selectedAnswer, challenge.answer)
              return (
                <button
                  key={option}
                  type="button"
                  className={`math-answer ${answerState}`}
                  aria-pressed={selectedAnswer === option}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </button>
              )
            })}
          </div>

          <p className={`math-feedback ${selectedAnswer === challenge.answer ? 'correct' : selectedAnswer !== null ? 'wrong' : ''}`} role="status">
            {feedback}
          </p>
        </article>
      </div>
    </div>
  )
}
