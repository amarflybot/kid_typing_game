import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CAR_WORDS, CAR_LOOKUP, type CarWord, type CarWordCard } from '../data/carWordCards'
import { BASE_URL } from '../utils/baseUrl'

const CAR_STEPS = 6
const ABHI_PHOTO_SRC = `${BASE_URL}Abhi.jpg`

type AudioContextRef = { current: AudioContext | null }

type CarCheer = {
  message: string
}

type CarDashState = {
  currentWord: CarWord
  lap: number
  boosts: number
  fans: number
  feedback: string
  pitMessage: string
  raceWon: boolean
}

const playTone = (ctxRef: AudioContextRef, freq: number, duration = 0.1) => {
  try {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {
    // ignore autoplay errors
  }
}

const FALLBACK_CAR_WORD = 'car' as CarWord

const CAR_CHEERS: CarCheer[] = [
  { message: 'Pit crew dances with joy!' },
  { message: 'Engines roar for you!' },
  { message: 'Crowd waves shiny flags!' },
  { message: 'Turbo thumbs up!' },
  { message: 'Mega boost unlocked!' },
]

const createCarPicker = () => {
  const used = new Set<CarWord>()
  return () => {
    const available = CAR_WORDS.filter((word) => !used.has(word))
    if (!available.length) used.clear()
    const selection = available.length ? available : CAR_WORDS
    const next = selection[Math.floor(Math.random() * selection.length)] as CarWord
    used.add(next)
    return next
  }
}

const createInitialState = (): CarDashState => ({
  currentWord: CAR_WORDS[0] ?? FALLBACK_CAR_WORD,
  lap: 0,
  boosts: 0,
  fans: 0,
  feedback: '',
  pitMessage: 'Tap a pit button to pump up the race!',
  raceWon: false,
})

const getCarPosition = (lap: number) => {
  const progress = Math.min(lap, CAR_STEPS) / CAR_STEPS
  const trackStart = 12
  const trackEnd = 88
  return trackStart + progress * (trackEnd - trackStart)
}

export const CarDash = () => {
  const [state, setState] = useState<CarDashState>(() => createInitialState())
  const wordInputRef = useRef<HTMLInputElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const pickNextWordRef = useRef(createCarPicker())
  const nextWordTimeoutRef = useRef<number | null>(null)

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => wordInputRef.current?.focus())
  }, [])

  const setNewWord = useCallback(() => {
    const next = pickNextWordRef.current()
    setState((prev) => ({ ...prev, currentWord: next }))
    focusInput()
  }, [focusInput])

  const clearNextWordTimeout = useCallback(() => {
    if (nextWordTimeoutRef.current) {
      window.clearTimeout(nextWordTimeoutRef.current)
      nextWordTimeoutRef.current = null
    }
  }, [])

  const queueNextWord = useCallback(() => {
    clearNextWordTimeout()
    nextWordTimeoutRef.current = window.setTimeout(() => {
      setNewWord()
      nextWordTimeoutRef.current = null
    }, 400)
  }, [clearNextWordTimeout, setNewWord])

  const updatePitMessage = useCallback((message: string) => {
    setState((prev) => ({ ...prev, pitMessage: message }))
  }, [])

  useEffect(() => {
    setNewWord()
    return () => {
      clearNextWordTimeout()
    }
  }, [setNewWord, clearNextWordTimeout])

  const handleBoost = useCallback(() => {
    setState((prev) => ({
      ...prev,
      boosts: Math.min(9, prev.boosts + 1),
      fans: Math.min(99, prev.fans + 1),
    }))
    const speedLines = document.getElementById('speedLines')
    const carEl = document.getElementById('raceCar')
    speedLines?.classList.add('show')
    carEl?.classList.add('boost')
    setTimeout(() => {
      speedLines?.classList.remove('show')
      carEl?.classList.remove('boost')
    }, 600)
  }, [])

  const handlePenalty = useCallback(() => {
    setState((prev) => ({
      ...prev,
      boosts: Math.max(0, prev.boosts - 1),
    }))
  }, [])

  const resetInput = useCallback(() => {
    if (wordInputRef.current) {
      wordInputRef.current.value = ''
    }
  }, [])

  const isRaceComplete = state.raceWon || state.lap >= CAR_STEPS

  const handleCorrect = useCallback(() => {
    playTone(audioCtxRef, 523.25)
    let raceFinished = false
    setState((prev) => {
      const nextLap = prev.lap + 1
      raceFinished = nextLap >= CAR_STEPS
      return {
        ...prev,
        lap: nextLap,
        raceWon: raceFinished,
        feedback: raceFinished ? '🏁 Hot wheels! You finished the race!' : 'Vroom! Keep racing!',
        pitMessage: raceFinished ? '🏆 Victory lap! Grab another race!' : prev.pitMessage,
      }
    })
    if (raceFinished) {
      clearNextWordTimeout()
    } else {
      queueNextWord()
      const cheer = CAR_CHEERS[Math.floor(Math.random() * CAR_CHEERS.length)]
      updatePitMessage(cheer.message)
    }
    handleBoost()
  }, [clearNextWordTimeout, handleBoost, queueNextWord, updatePitMessage])

  const handleWrong = useCallback(() => {
    playTone(audioCtxRef, 190, 0.2)
    setState((prev) => ({ ...prev, feedback: 'Slow down! Try again.' }))
    resetInput()
    handlePenalty()
    updatePitMessage('Pit crew says: try again carefully!')
  }, [handlePenalty, resetInput, updatePitMessage])

  const checkWord = useCallback(
    (value: string) => {
      if (isRaceComplete) return
      const typed = value.trim().toLowerCase()
      if (!typed) return
      if (typed === state.currentWord) {
        resetInput()
        handleCorrect()
      } else {
        handleWrong()
      }
    },
    [handleCorrect, handleWrong, isRaceComplete, resetInput, state.currentWord],
  )

  const restartRace = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(),
      currentWord: prev.currentWord,
    }))
    clearNextWordTimeout()
    setNewWord()
    const speedLines = document.getElementById('speedLines')
    const carEl = document.getElementById('raceCar')
    speedLines?.classList.remove('show')
    carEl?.classList.remove('boost')
  }, [clearNextWordTimeout, setNewWord])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (isRaceComplete) return
      if (event.key === 'Enter') {
        checkWord(event.currentTarget.value)
      } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
        playTone(audioCtxRef, 330)
      }
    },
    [checkWord, isRaceComplete],
  )

  const { currentWord, lap, boosts, fans, feedback, pitMessage, raceWon } = state
  const carCard: CarWordCard | undefined = CAR_LOOKUP[currentWord]
  const carPosition = getCarPosition(lap)

  return (
    <div className="car-panel">
      <div className="car-area">
        <span className="car-flag">🏁</span>
        <div className="car-track"></div>
        <div className="speed-lines" id="speedLines"></div>
        <div className="race-car" id="raceCar" style={{ left: `${carPosition}%` }}>
          <span>🏎️</span>
        </div>
      </div>

      <div className="car-photo-card">
        <img src={ABHI_PHOTO_SRC} alt="Smiling racer ready to zoom" />
        <p className="car-photo-text">Captain Zoom is ready! Type fast to fuel the race. 🏎️⚡</p>
      </div>

      <div className="car-status-bar">
        <div className="car-chip">
          <span className="car-chip-label">Lap</span>
          <span className="car-chip-value">
            {Math.min(lap, CAR_STEPS)} / {CAR_STEPS}
          </span>
        </div>
        <div className="car-chip">
          <span className="car-chip-label">Boost</span>
          <span className="car-chip-value">{boosts}</span>
        </div>
        <div className="car-chip">
          <span className="car-chip-label">Fans</span>
          <span className="car-chip-value">{fans}</span>
        </div>
      </div>

      <div
        className="car-word-card"
        style={{
          background: `linear-gradient(145deg, ${carCard?.colors?.[0] ?? '#fff'}, ${carCard?.colors?.[1] ?? '#fff'})`,
        }}
      >
        <div className="car-word-icon" aria-hidden="true">
          {carCard?.emoji ?? '🏎️'}
        </div>
        <div className="car-word-info">
          <p className="car-mission">{carCard?.mission}</p>
          <p className="car-word">{currentWord.toUpperCase()}</p>
        </div>
      </div>

      <div className="pit-panel">
        <div className="pit-buttons">
          <button className="pit-btn" type="button" onClick={() => playTone(audioCtxRef, 440)}>
            🔊 Honk Word
          </button>
          <button
            className="pit-btn"
            type="button"
            onClick={() => updatePitMessage(CAR_CHEERS[Math.floor(Math.random() * CAR_CHEERS.length)].message)}
          >
            🎉 Pit Cheer
          </button>
        </div>
        <p className="pit-text">{pitMessage}</p>
      </div>

      <div className="car-input-stack">
        <input
          type="text"
          maxLength={3}
          ref={wordInputRef}
          placeholder={currentWord}
          disabled={isRaceComplete}
          aria-disabled={isRaceComplete}
          onKeyDown={handleKeyDown}
        />
        <p className="car-feedback">{feedback}</p>
        <div className="car-progress">
          <div className="car-progress-bar" style={{ width: `${(Math.min(lap, CAR_STEPS) / CAR_STEPS) * 100}%` }}></div>
        </div>
        <p className="car-progress-text">
          Lap: {Math.min(lap, CAR_STEPS)} / {CAR_STEPS}
        </p>
        <button className="btn car-btn" type="button" onClick={restartRace}>
          {raceWon ? 'Race Again' : 'Start New Race'}
        </button>
      </div>

      {raceWon && (
        <div className="car-win show">
          <p>🏆 Vroom! You won the race!</p>
          <button className="btn" type="button" onClick={restartRace}>
            Play Again
          </button>
        </div>
      )}
    </div>
  )
};
