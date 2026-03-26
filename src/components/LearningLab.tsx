import { useEffect, useRef, useState } from 'react'
import { BASE_URL } from '../utils/baseUrl'

type ShapePrompt = {
  id: string
  label: string
  clue: string
  emoji: string
}

type CountPrompt = {
  id: string
  prompt: string
  emoji: string
  answer: number
  helper: string
}

type ShapeChallenge = {
  prompt: ShapePrompt
  options: string[]
}

type CountChallenge = {
  prompt: CountPrompt
  options: number[]
}

const SHAPE_PROMPTS: ShapePrompt[] = [
  { id: 'circle', label: 'Circle', clue: 'Round like the bright sun!', emoji: '🟡' },
  { id: 'triangle', label: 'Triangle', clue: 'Pointy like a mountain peak!', emoji: '🔺' },
  { id: 'square', label: 'Square', clue: 'Four sides like a cozy window.', emoji: '🟥' },
  { id: 'star', label: 'Star', clue: 'Twinkles in the night sky.', emoji: '⭐' },
  { id: 'heart', label: 'Heart', clue: 'Full of love and hugs.', emoji: '❤️' },
]

const COUNT_PROMPTS: CountPrompt[] = [
  { id: 'apples', prompt: 'Count the apples for the picnic basket.', emoji: '🍎', answer: 4, helper: 'Tap the right number to feed the bunny.' },
  { id: 'rainbows', prompt: 'How many tiny rainbows sparkle?', emoji: '🌈', answer: 3, helper: 'A sprinkle of color magic!' },
  { id: 'ducks', prompt: 'Quack quack! How many ducklings swim?', emoji: '🦆', answer: 5, helper: 'Count each buddy in the pond.' },
  { id: 'kites', prompt: 'How many kites zoom in the sky?', emoji: '🪁', answer: 2, helper: 'Spot every zig-zag tail.' },
  { id: 'shells', prompt: 'Count the shiny shells on the sand.', emoji: '🐚', answer: 6, helper: 'Wave hello as you count!' },
]

const NUMBER_POOL = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const HAPPY_SHAPE_MESSAGES = ['Shape superstar! 🌟', 'Perfect pick! 🎯', 'You spotted it! 👀', 'Shape garden blooms! 🌼']
const HAPPY_COUNT_MESSAGES = ['Numbers sparkle! ✨', 'Counting champ! 🏅', 'Tapping talent! 🎵', 'Great math moves! 🧠']
const TRY_AGAIN_MESSAGE = 'Almost there — peek carefully and try again!'
const DEFAULT_SHAPE_MESSAGE = 'Pick the shape that matches the clue.'
const DEFAULT_COUNT_MESSAGE = 'Count the objects, then tap the number.'

const shuffle = <T,>(items: readonly T[]): T[] => {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

const pickRandom = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

const createShapeChallenge = (): ShapeChallenge => {
  const prompt = pickRandom(SHAPE_PROMPTS)
  const distractors = shuffle(SHAPE_PROMPTS.filter((shape) => shape.id !== prompt.id)).slice(0, 2)
  const options = shuffle([prompt.label, ...distractors.map((shape) => shape.label)])
  return { prompt, options }
}

const createCountChallenge = (): CountChallenge => {
  const prompt = pickRandom(COUNT_PROMPTS)
  const extras = shuffle(NUMBER_POOL.filter((num) => num !== prompt.answer)).slice(0, 2)
  const options = shuffle([prompt.answer, ...extras])
  return { prompt, options }
}

const ABHI_PHOTO_SRC = `${BASE_URL}Abhi.jpg`

export const LearningLab = () => {
  const [shapeChallenge, setShapeChallenge] = useState<ShapeChallenge>(() => createShapeChallenge())
  const [countChallenge, setCountChallenge] = useState<CountChallenge>(() => createCountChallenge())
  const [shapeMessage, setShapeMessage] = useState(DEFAULT_SHAPE_MESSAGE)
  const [countMessage, setCountMessage] = useState(DEFAULT_COUNT_MESSAGE)
  const [shapeScore, setShapeScore] = useState(0)
  const [countScore, setCountScore] = useState(0)
  const [shapeLocked, setShapeLocked] = useState(false)
  const [countLocked, setCountLocked] = useState(false)
  const timeoutPool = useRef<number[]>([])

  useEffect(() => {
    return () => {
      timeoutPool.current.forEach((id) => window.clearTimeout(id))
      timeoutPool.current = []
    }
  }, [])

  const queue = (cb: () => void, delay = 900) => {
    const id = window.setTimeout(() => {
      cb()
      timeoutPool.current = timeoutPool.current.filter((stored) => stored !== id)
    }, delay)
    timeoutPool.current.push(id)
  }

  const handleShapePick = (label: string) => {
    if (shapeLocked) return
    if (label === shapeChallenge.prompt.label) {
      setShapeLocked(true)
      setShapeMessage(pickRandom(HAPPY_SHAPE_MESSAGES))
      setShapeScore((prev) => prev + 1)
      queue(() => {
        setShapeChallenge(createShapeChallenge())
        setShapeMessage(DEFAULT_SHAPE_MESSAGE)
        setShapeLocked(false)
      })
    } else {
      setShapeMessage(TRY_AGAIN_MESSAGE)
    }
  }

  const handleCountPick = (value: number) => {
    if (countLocked) return
    if (value === countChallenge.prompt.answer) {
      setCountLocked(true)
      setCountMessage(pickRandom(HAPPY_COUNT_MESSAGES))
      setCountScore((prev) => prev + 1)
      queue(() => {
        setCountChallenge(createCountChallenge())
        setCountMessage(DEFAULT_COUNT_MESSAGE)
        setCountLocked(false)
      })
    } else {
      setCountMessage(TRY_AGAIN_MESSAGE)
    }
  }

  const totalStars = shapeScore + countScore

  return (
    <div className="learning-lab">
      <div className="status-bar">
        <div className="status-chip">
          <span className="status-label">Shape Wins</span>
          <span className="status-value">{shapeScore}</span>
        </div>
        <div className="status-chip">
          <span className="status-label">Counting Wins</span>
          <span className="status-value">{countScore}</span>
        </div>
        <div className="status-chip coin">
          <span className="status-label">Sparkle Stars</span>
          <span className="status-value">{totalStars}</span>
        </div>
      </div>

      <div className="mission-card">
        <p className="mission-label">Learning Lab</p>
        <p className="mission-text">Explore shapes and numbers with gentle mini-games perfect for kindergarten brains.</p>
      </div>

      <div className="lab-grid">
        <article className="lab-card">
          <header className="lab-card-header">
            <span className="lab-card-icon" aria-hidden="true">
              {shapeChallenge.prompt.emoji}
            </span>
            <div>
              <h2>Shape Garden</h2>
              <p className="lab-card-sub">{shapeChallenge.prompt.clue}</p>
            </div>
          </header>
          <div className="option-grid" role="group" aria-label="Shape choices">
            {shapeChallenge.options.map((option) => (
              <button
                key={option}
                type="button"
                className="option-button"
                onClick={() => handleShapePick(option)}
                aria-pressed={shapeLocked && option === shapeChallenge.prompt.label}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="lab-feedback">{shapeMessage}</p>
        </article>

        <article className="lab-card">
          <header className="lab-card-header">
            <span className="lab-card-icon" aria-hidden="true">
              {countChallenge.prompt.emoji}
            </span>
            <div>
              <h2>Counting Parade</h2>
              <p className="lab-card-sub">{countChallenge.prompt.prompt}</p>
            </div>
          </header>
          <p className="lab-helper">{countChallenge.prompt.helper}</p>
          <div className="option-grid" role="group" aria-label="Number choices">
            {countChallenge.options.map((option) => (
              <button
                key={option}
                type="button"
                className="option-button"
                onClick={() => handleCountPick(option)}
                aria-pressed={countLocked && option === countChallenge.prompt.answer}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="lab-feedback">{countMessage}</p>
        </article>
      </div>

      <div className="kid-showcase">
        <div className="kid-photo-frame" aria-hidden="true">
          <img src={ABHI_PHOTO_SRC} className="kid-photo" alt="Abhi cheering" />
        </div>
        <div>
          <span className="kid-badge">Lab Coach</span>
          <p className="kid-quote">
            Abhi says, “Shapes, numbers, and smiles! Keep tapping to grow your super skills.”
          </p>
        </div>
      </div>
    </div>
  )
};
