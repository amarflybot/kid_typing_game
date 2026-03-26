import { useCallback, useEffect, useRef, useState } from 'react'
import { WORD_CARDS, type WordCard } from '../data/wordCards'
import { BASE_URL } from '../utils/baseUrl'

type BuilderChallenge = {
  card: WordCard
  options: string[]
}

type BuilderState = {
  challenge: BuilderChallenge
  slots: string[]
  placement: (number | null)[]
}

type MatchChallenge = {
  answer: WordCard
  options: WordCard[]
}

const LETTER_BANK = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const LAB_WORDS = WORD_CARDS.filter((card) => card.word.length >= 3 && card.word.length <= 4)
const DEFAULT_BUILDER_MESSAGE = 'Tap the tiles to build the word.'
const DEFAULT_MATCH_MESSAGE = 'Pick the word card that matches the clue.'
const BUILDER_WINS = ['Word garden blooming! 🌷', 'Spell superstar! 🌟', 'Letters locked in! 🔐']
const MATCH_WINS = ['Card match magic! ✨', 'Word detective! 🔍', 'Brilliant choice! 🎉']
const TRY_AGAIN_MESSAGE = 'Almost! Switch letters and try again.'
const MATCH_TRY_AGAIN = 'Peek at the clue again and tap another card.'
const ABHI_PHOTO_SRC = `${BASE_URL}Abhi.jpg`

const shuffle = <T,>(items: readonly T[]): T[] => {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

const pickRandom = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]

const createBuilderChallenge = (): BuilderChallenge => {
  const card = pickRandom(LAB_WORDS)
  const baseLetters = card.word.toUpperCase().split('')
  const extras = shuffle(LETTER_BANK.filter((letter) => !baseLetters.includes(letter))).slice(0, 2)
  const options = shuffle([...baseLetters, ...extras])
  return { card, options }
}

const createBuilderState = (): BuilderState => {
  const challenge = createBuilderChallenge()
  const slotCount = challenge.card.word.length
  return {
    challenge,
    slots: Array.from<string>({ length: slotCount }, () => ''),
    placement: Array.from<(number | null)>({ length: slotCount }, () => null),
  }
}

const createMatchChallenge = (): MatchChallenge => {
  const answer = pickRandom(LAB_WORDS)
  const distractors = shuffle(LAB_WORDS.filter((card) => card.word !== answer.word)).slice(0, 2)
  return {
    answer,
    options: shuffle([answer, ...distractors]),
  }
}

export function LearningLab() {
  const [builderState, setBuilderState] = useState<BuilderState>(() => createBuilderState())
  const [builderStars, setBuilderStars] = useState(0)
  const [builderMessage, setBuilderMessage] = useState(DEFAULT_BUILDER_MESSAGE)
  const [builderLocked, setBuilderLocked] = useState(false)

  const [matchChallenge, setMatchChallenge] = useState<MatchChallenge>(() => createMatchChallenge())
  const [matchStars, setMatchStars] = useState(0)
  const [matchMessage, setMatchMessage] = useState(DEFAULT_MATCH_MESSAGE)
  const [matchLocked, setMatchLocked] = useState(false)

  const timeoutsRef = useRef<number[]>([])

  const queue = useCallback((cb: () => void, delay = 1100) => {
    const id = window.setTimeout(() => {
      cb()
      timeoutsRef.current = timeoutsRef.current.filter((stored) => stored !== id)
    }, delay)
    timeoutsRef.current.push(id)
  }, [])

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id))
      timeoutsRef.current = []
    }
  }, [])

  const resetBuilder = useCallback(() => {
    setBuilderState(createBuilderState())
    setBuilderLocked(false)
    setBuilderMessage(DEFAULT_BUILDER_MESSAGE)
  }, [])

  const handleLetterPick = useCallback(
    (letter: string, optionIndex: number) => {
      if (builderLocked) return
      if (builderState.placement.includes(optionIndex)) return
      const slotIndex = builderState.placement.findIndex((idx) => idx === null)
      if (slotIndex === -1) return

      const nextSlots = [...builderState.slots]
      const nextPlacement = [...builderState.placement]
      nextSlots[slotIndex] = letter
      nextPlacement[slotIndex] = optionIndex
      const builtWord = nextSlots.join('')
      const filled = nextPlacement.every((idx) => idx !== null)

      setBuilderState((prev) => ({
        ...prev,
        slots: nextSlots,
        placement: nextPlacement,
      }))

      if (!filled) {
        setBuilderMessage('Great! Add the next letter.')
        return
      }
      if (builtWord.toLowerCase() === builderState.challenge.card.word) {
        setBuilderLocked(true)
        setBuilderMessage(pickRandom(BUILDER_WINS))
        setBuilderStars((prev) => prev + 1)
        queue(() => resetBuilder())
      } else {
        setBuilderMessage(TRY_AGAIN_MESSAGE)
      }
    },
    [builderLocked, builderState, queue, resetBuilder],
  )

  const handleUndo = useCallback(() => {
    if (builderLocked) return
    setBuilderState((prev) => {
      let lastIndex = -1
      for (let i = prev.placement.length - 1; i >= 0; i -= 1) {
        if (prev.placement[i] !== null) {
          lastIndex = i
          break
        }
      }
      if (lastIndex === -1) return prev
      const nextSlots = [...prev.slots]
      const nextPlacement = [...prev.placement]
      nextSlots[lastIndex] = ''
      nextPlacement[lastIndex] = null
      return { ...prev, slots: nextSlots, placement: nextPlacement }
    })
    setBuilderMessage('Oops? No worries, letter removed.')
  }, [builderLocked])

  const shuffleBuilderTiles = useCallback(() => {
    setBuilderState((prev) => ({
      ...prev,
      challenge: { ...prev.challenge, options: shuffle(prev.challenge.options) },
    }))
    setBuilderMessage('Tiles shuffled! Try a new order.')
  }, [])

  const skipBuilderWord = useCallback(() => {
    resetBuilder()
    setBuilderMessage('New word loaded. Let’s build!')
  }, [resetBuilder])

  const handleMatchPick = useCallback(
    (word: WordCard) => {
      if (matchLocked) return
      if (word.word === matchChallenge.answer.word) {
        setMatchLocked(true)
        setMatchMessage(pickRandom(MATCH_WINS))
        setMatchStars((prev) => prev + 1)
        queue(() => {
          setMatchChallenge(createMatchChallenge())
          setMatchLocked(false)
          setMatchMessage(DEFAULT_MATCH_MESSAGE)
        })
      } else {
        setMatchMessage(MATCH_TRY_AGAIN)
      }
    },
    [matchChallenge.answer.word, matchLocked, queue],
  )

  const totalStars = builderStars + matchStars

  return (
    <div className="learning-lab">
      <div className="status-bar">
        <div className="status-chip">
          <span className="status-label">Builder Stars</span>
          <span className="status-value">{builderStars}</span>
        </div>
        <div className="status-chip">
          <span className="status-label">Match Stars</span>
          <span className="status-value">{matchStars}</span>
        </div>
        <div className="status-chip coin">
          <span className="status-label">Word Power</span>
          <span className="status-value">{totalStars}</span>
        </div>
      </div>

      <div className="mission-card">
        <p className="mission-label">Learning Lab</p>
        <p className="mission-text">
          Build and discover cheerful three- and four-letter words. Tap tiles, swap letters, and match clues to earn
          word power!
        </p>
      </div>

      <div className="lab-grid">
        <article className="lab-card builder-card">
          <header className="lab-card-header">
            <span className="lab-card-icon" aria-hidden="true">
              {builderState.challenge.card.emoji}
            </span>
            <div>
              <h2>Word Builder</h2>
              <p className="lab-card-sub">{builderState.challenge.card.mission}</p>
            </div>
          </header>

          <div className="word-slots" role="status" aria-live="polite">
            {builderState.slots.map((slot, index) => (
              <span
                key={`slot-${index}`}
                className={`word-slot ${slot ? 'filled' : ''}`}
                aria-label={`Letter slot ${index + 1}`}
              >
                {slot || '_'}
              </span>
            ))}
          </div>

          <div className="tile-grid" role="group" aria-label="Letter tiles">
            {builderState.challenge.options.map((option, index) => {
              const used = builderState.placement.includes(index)
              return (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  className={`tile-button ${used ? 'used' : ''}`}
                  onClick={() => handleLetterPick(option, index)}
                  aria-pressed={used}
                  disabled={builderLocked}
                >
                  {option}
                </button>
              )
            })}
          </div>

          <div className="builder-actions">
            <button className="mini-btn" type="button" onClick={handleUndo} disabled={builderLocked}>
              ⬅️ Undo
            </button>
            <button className="mini-btn" type="button" onClick={shuffleBuilderTiles}>
              🔁 Shuffle
            </button>
            <button className="mini-btn" type="button" onClick={skipBuilderWord}>
              🌈 New Word
            </button>
          </div>

          <p className="lab-feedback">{builderMessage}</p>
        </article>

        <article className="lab-card match-card">
          <header className="lab-card-header">
            <span className="lab-card-icon" aria-hidden="true">
              {matchChallenge.answer.emoji}
            </span>
            <div>
              <h2>Word Match Hunt</h2>
              <p className="lab-card-sub">{matchChallenge.answer.mission}</p>
            </div>
          </header>
          <p className="lab-helper">Tap the correct word to help Abhi pack his reading backpack.</p>

          <div className="match-grid" role="group" aria-label="Word cards">
            {matchChallenge.options.map((option) => (
              <button
                key={option.word}
                type="button"
                className="match-option"
                onClick={() => handleMatchPick(option)}
                disabled={matchLocked}
              >
                <span className="match-emoji" aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="match-word">{option.word.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <p className="lab-feedback">{matchMessage}</p>
        </article>
      </div>

      <div className="kid-showcase">
        <div className="kid-photo-frame" aria-hidden="true">
          <img src={ABHI_PHOTO_SRC} className="kid-photo" alt="Abhi cheering in the lab" />
        </div>
        <div>
          <span className="kid-badge">Word Coach</span>
          <p className="kid-quote">
            Abhi whispers, “Every tiny word is a big win! Keep tapping letters, swapping cards, and cheering for your
            brain.”
          </p>
        </div>
      </div>
    </div>
  )
}
