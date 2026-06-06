import { useCallback, useEffect, useRef, useState } from 'react'
import { STORAGE_KEYS, readStoredValue, writeStoredValue } from '../utils/localStorage'

type HindiCard = {
  letter: string
  sound: string
  word: string
  meaning: string
  emoji: string
}

type HindiAnswer = string

type HindiChallenge = {
  id: string
  badge: string
  title: string
  prompt: string
  display: string
  answer: HindiAnswer
  options: HindiAnswer[]
  card: HindiCard
}

type HindiStoredScore = {
  stars: number
  streak: number
  answered: number
}

const DEFAULT_HINDI_SCORE: HindiStoredScore = { stars: 0, streak: 0, answered: 0 }
const AUTO_ADVANCE_MS = 900

const HINDI_CARDS: HindiCard[] = [
  { letter: 'अ', sound: 'a', word: 'अनार', meaning: 'pomegranate', emoji: '🍎' },
  { letter: 'आ', sound: 'aa', word: 'आम', meaning: 'mango', emoji: '🥭' },
  { letter: 'इ', sound: 'i', word: 'इमली', meaning: 'tamarind', emoji: '🌿' },
  { letter: 'ई', sound: 'ee', word: 'ईख', meaning: 'sugarcane', emoji: '🎋' },
  { letter: 'उ', sound: 'u', word: 'उल्लू', meaning: 'owl', emoji: '🦉' },
  { letter: 'ऊ', sound: 'oo', word: 'ऊन', meaning: 'wool', emoji: '🧶' },
  { letter: 'क', sound: 'ka', word: 'कमल', meaning: 'lotus', emoji: '🪷' },
  { letter: 'ख', sound: 'kha', word: 'खरगोश', meaning: 'rabbit', emoji: '🐰' },
  { letter: 'ग', sound: 'ga', word: 'गमला', meaning: 'flower pot', emoji: '🪴' },
  { letter: 'च', sound: 'cha', word: 'चम्मच', meaning: 'spoon', emoji: '🥄' },
  { letter: 'ज', sound: 'ja', word: 'जहाज', meaning: 'ship', emoji: '🚢' },
  { letter: 'ट', sound: 'ta', word: 'टमाटर', meaning: 'tomato', emoji: '🍅' },
  { letter: 'न', sound: 'na', word: 'नल', meaning: 'tap', emoji: '🚰' },
  { letter: 'म', sound: 'ma', word: 'मछली', meaning: 'fish', emoji: '🐟' },
  { letter: 'र', sound: 'ra', word: 'रथ', meaning: 'chariot', emoji: '🛞' },
  { letter: 'स', sound: 'sa', word: 'सूरज', meaning: 'sun', emoji: '☀️' },
]

const HINDI_CHEERS = ['बहुत बढ़िया!', 'Hindi star unlocked!', 'शाबाश!', 'Great Hindi practice!'] as const
const HINDI_TRY_AGAIN = ['Try one more Hindi card.', 'Look at the letter again.', 'Almost! Listen to the sound.'] as const

const getStoredHindiScore = () => {
  const stored = readStoredValue(STORAGE_KEYS.hindiScore, DEFAULT_HINDI_SCORE)
  return {
    stars: Number.isFinite(stored.stars) ? Math.max(0, stored.stars) : 0,
    streak: Number.isFinite(stored.streak) ? Math.max(0, stored.streak) : 0,
    answered: Number.isFinite(stored.answered) ? Math.max(0, stored.answered) : 0,
  }
}

const createOptions = (answer: HindiAnswer, allOptions: HindiAnswer[], offset: number) => {
  const distractors = allOptions.filter((option) => option !== answer)
  const options = [answer, distractors[offset % distractors.length], distractors[(offset + 5) % distractors.length]]
  const rotation = offset % options.length
  return [...options.slice(rotation), ...options.slice(0, rotation)]
}

const createChallengeOrder = (length: number) => {
  const start = Math.floor(Math.random() * length)
  const step = [1, 5, 7, 11][Math.floor(Math.random() * 4)] ?? 1
  const order: number[] = []
  const used = new Set<number>()
  let next = start

  while (order.length < length) {
    if (!used.has(next)) {
      order.push(next)
      used.add(next)
    }
    next = (next + step) % length
    while (used.has(next) && order.length < length) {
      next = (next + 1) % length
    }
  }

  return order
}

const createHindiChallenges = (): HindiChallenge[] => {
  const letters = HINDI_CARDS.map((card) => card.letter)
  const words = HINDI_CARDS.map((card) => card.word)
  const pictures = HINDI_CARDS.map((card) => card.emoji)

  return HINDI_CARDS.flatMap((card, index) => [
    {
      id: `letter-word-${card.letter}`,
      badge: 'Letter',
      title: 'Akshar Match',
      prompt: `Which word starts with ${card.letter}?`,
      display: card.letter,
      answer: card.word,
      options: createOptions(card.word, words, index),
      card,
    },
    {
      id: `word-letter-${card.letter}`,
      badge: 'Word',
      title: 'Word to Letter',
      prompt: `Tap the Hindi letter for ${card.word}.`,
      display: `${card.emoji} ${card.word}`,
      answer: card.letter,
      options: createOptions(card.letter, letters, index + 2),
      card,
    },
    {
      id: `sound-${card.letter}`,
      badge: 'Sound',
      title: 'Sound Match',
      prompt: `Which letter says "${card.sound}"?`,
      display: card.sound,
      answer: card.letter,
      options: createOptions(card.letter, letters, index + 4),
      card,
    },
    {
      id: `picture-${card.letter}`,
      badge: 'Picture',
      title: 'Picture Match',
      prompt: `Which picture matches ${card.word}?`,
      display: card.word,
      answer: card.emoji,
      options: createOptions(card.emoji, pictures, index + 6),
      card,
    },
  ])
}

const HINDI_CHALLENGES = createHindiChallenges()

const pickMessage = (messages: readonly string[], seed: number) => messages[seed % messages.length]

export function HindiPractice() {
  const [challengeOrder] = useState(() => createChallengeOrder(HINDI_CHALLENGES.length))
  const [challengeStep, setChallengeStep] = useState(0)
  const [stars, setStars] = useState(() => getStoredHindiScore().stars)
  const [streak, setStreak] = useState(() => getStoredHindiScore().streak)
  const [answered, setAnswered] = useState(() => getStoredHindiScore().answered)
  const [selectedAnswer, setSelectedAnswer] = useState<HindiAnswer | null>(null)
  const [feedback, setFeedback] = useState('Pick the matching Hindi card.')
  const nextChallengeTimeoutRef = useRef<number | null>(null)
  const scorePersistenceReadyRef = useRef(false)

  const challenge = HINDI_CHALLENGES[challengeOrder[challengeStep] ?? 0]

  const clearNextChallengeTimeout = useCallback(() => {
    if (nextChallengeTimeoutRef.current) {
      window.clearTimeout(nextChallengeTimeoutRef.current)
      nextChallengeTimeoutRef.current = null
    }
  }, [])

  const advanceChallenge = useCallback(() => {
    setChallengeStep((current) => (current + 1) % challengeOrder.length)
    setSelectedAnswer(null)
    setFeedback('Pick the matching Hindi card.')
  }, [challengeOrder.length])

  useEffect(() => clearNextChallengeTimeout, [clearNextChallengeTimeout])

  useEffect(() => {
    if (!scorePersistenceReadyRef.current) {
      scorePersistenceReadyRef.current = true
      return
    }
    writeStoredValue(STORAGE_KEYS.hindiScore, { stars, streak, answered })
  }, [answered, stars, streak])

  const handleAnswer = (answer: HindiAnswer) => {
    if (selectedAnswer !== null) return

    const correct = answer === challenge.answer
    setSelectedAnswer(answer)
    setAnswered((current) => current + 1)

    if (correct) {
      setStars((current) => current + 1)
      setStreak((current) => current + 1)
      setFeedback(pickMessage(HINDI_CHEERS, stars + streak))
    } else {
      setStreak(0)
      setFeedback(pickMessage(HINDI_TRY_AGAIN, answered + answer.length))
    }

    clearNextChallengeTimeout()
    nextChallengeTimeoutRef.current = window.setTimeout(() => {
      advanceChallenge()
      nextChallengeTimeoutRef.current = null
    }, AUTO_ADVANCE_MS)
  }

  return (
    <div className="hindi-practice">
      <div className="status-bar">
        <div className="status-chip">
          <span className="status-label">Hindi Stars</span>
          <span className="status-value">{stars}</span>
        </div>
        <div className="status-chip">
          <span className="status-label">Streak</span>
          <span className="status-value">{streak}</span>
        </div>
        <div className="status-chip coin">
          <span className="status-label">Practice</span>
          <span className="status-value">
            {challengeStep + 1} / {challengeOrder.length}
          </span>
        </div>
      </div>

      <div className="mission-card">
        <p className="mission-label">Hindi Practice</p>
        <p className="mission-text">Match Hindi letters, sounds, words, and pictures.</p>
      </div>

      <article className="hindi-card">
        <header className="hindi-card-header">
          <span className="hindi-badge">{challenge.badge}</span>
          <div>
            <h2>{challenge.title}</h2>
            <p className="lab-card-sub">{challenge.prompt}</p>
          </div>
        </header>

        <div className="hindi-stage">
          <span className="hindi-display">{challenge.display}</span>
          <span className="hindi-helper">
            {challenge.card.letter} se {challenge.card.word} · {challenge.card.meaning}
          </span>
        </div>

        <div className="hindi-options" role="group" aria-label="Hindi answer choices">
          {challenge.options.map((option) => {
            const correct = selectedAnswer !== null && option === challenge.answer
            const wrong = selectedAnswer === option && option !== challenge.answer
            return (
              <button
                key={`${challenge.id}-${option}`}
                className={`hindi-option ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}
                type="button"
                aria-pressed={selectedAnswer === option}
                disabled={selectedAnswer !== null}
                onClick={() => handleAnswer(option)}
              >
                {option}
              </button>
            )
          })}
        </div>

        <p className={`hindi-feedback ${selectedAnswer === challenge.answer ? 'correct' : selectedAnswer !== null ? 'wrong' : ''}`} role="status">
          {feedback}
        </p>
      </article>
    </div>
  )
}
