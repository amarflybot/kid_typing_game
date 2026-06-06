import { useState } from 'react'

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

const MATH_CHEERS = [
  'Number star unlocked!',
  'Math magic sparkles!',
  'Brain power is glowing!',
  'Puzzle solved with style!',
] as const

const TRY_MESSAGES = ['Almost! Count the bright pieces again.', 'Try another number cloud.', 'Look at the math story once more.'] as const

const MATH_CHALLENGES: MathChallenge[] = [
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

const getAnswerState = (option: number, selectedAnswer: number | null, solved: boolean, answer: number): AnswerState => {
  if (solved && option === answer) return 'correct'
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
  const [solved, setSolved] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const [tries, setTries] = useState(0)

  const challenge = MATH_CHALLENGES[challengeIndex]

  const handleAnswer = (answer: number) => {
    if (solved) return

    setSelectedAnswer(answer)
    setTries((current) => current + 1)

    if (answer === challenge.answer) {
      setSolved(true)
      setStars((current) => current + 1)
      setStreak((current) => current + 1)
      setFeedback(pickMessage(MATH_CHEERS, stars + streak))
      return
    }

    setStreak(0)
    setFeedback(pickMessage(TRY_MESSAGES, tries + answer))
  }

  const nextChallenge = () => {
    setChallengeIndex((current) => (current + 1) % MATH_CHALLENGES.length)
    setSelectedAnswer(null)
    setSolved(false)
    setTapCount(0)
    setFeedback(DEFAULT_FEEDBACK)
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
              const answerState = getAnswerState(option, selectedAnswer, solved, challenge.answer)
              return (
                <button
                  key={option}
                  type="button"
                  className={`math-answer ${answerState}`}
                  aria-pressed={selectedAnswer === option || (solved && option === challenge.answer)}
                  disabled={solved}
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </button>
              )
            })}
          </div>

          <p className={`math-feedback ${solved ? 'correct' : selectedAnswer ? 'wrong' : ''}`} role="status">
            {feedback}
          </p>

          <div className="math-actions">
            <button className="btn math-next" type="button" onClick={nextChallenge}>
              Next Problem
            </button>
          </div>
        </article>
      </div>
    </div>
  )
}
