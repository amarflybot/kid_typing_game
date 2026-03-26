import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CAR_WORDS, CAR_LOOKUP, type CarWord, type CarWordCard } from '../data/carWordCards'

const CAR_STEPS = 6

type AudioContextRef = MutableRefObject<AudioContext | null>

type CarCheer = {
  message: string
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
    // ignore audio errors in autoplay restricted browsers
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

const useCarPicker = () => {
  const used = useRef<Set<CarWord>>(new Set())
  return useCallback(() => {
    const available = CAR_WORDS.filter((word) => !used.current.has(word))
    if (!available.length) used.current.clear()
    const selection = available.length ? available : CAR_WORDS
    const next = selection[Math.floor(Math.random() * selection.length)] as CarWord
    used.current.add(next)
    return next
  }, [])
}

export const CarDash = () => {
  const [currentWord, setCurrentWord] = useState<CarWord>(CAR_WORDS[0] ?? FALLBACK_CAR_WORD)
  const [lap, setLap] = useState(0)
  const [boosts, setBoosts] = useState(0)
  const [fans, setFans] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [pitMessage, setPitMessage] = useState('Tap a pit button to pump up the race!')
  const [raceWon, setRaceWon] = useState(false)
  const wordInputRef = useRef<HTMLInputElement | null>(null)
  const picker = useCarPicker()
  const audioCtxRef = useRef<AudioContext | null>(null)
  const nextWordTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRaceComplete = raceWon || lap >= CAR_STEPS

  const carCard: CarWordCard | undefined = useMemo(() => CAR_LOOKUP[currentWord], [currentWord])

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => wordInputRef.current?.focus())
  }, [])

  const setNewWord = useCallback(() => {
    const next = picker()
    setCurrentWord(next)
    focusInput()
  }, [focusInput, picker])

  useEffect(() => {
    setNewWord()
  }, [setNewWord])

  const clearNextWordTimeout = useCallback(() => {
    if (nextWordTimeout.current) {
      clearTimeout(nextWordTimeout.current)
      nextWordTimeout.current = null
    }
  }, [])

  const queueNextWord = useCallback(() => {
    clearNextWordTimeout()
    nextWordTimeout.current = window.setTimeout(() => {
      setNewWord()
      nextWordTimeout.current = null
    }, 400)
  }, [clearNextWordTimeout, setNewWord])

  useEffect(() => () => clearNextWordTimeout(), [clearNextWordTimeout])

  const updatePitMessage = useCallback((message: string) => {
    setPitMessage(message)
  }, [])

  const handleBoost = useCallback(() => {
    setBoosts((prev) => Math.min(9, prev + 1))
    setFans((prev) => Math.min(99, prev + 1))
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
    setBoosts((prev) => Math.max(0, prev - 1))
  }, [])

  const handleCorrect = useCallback(() => {
    playTone(audioCtxRef, 523.25)
    setLap((prev) => {
      const next = prev + 1
      if (next >= CAR_STEPS) {
        clearNextWordTimeout()
        setRaceWon(true)
        setFeedback('🏁 Hot wheels! You finished the race!')
        updatePitMessage('🏆 Victory lap! Grab another race!')
      } else {
        setFeedback('Vroom! Keep racing!')
        queueNextWord()
      }
      return next
    })
    handleBoost()
    const cheer = CAR_CHEERS[Math.floor(Math.random() * CAR_CHEERS.length)]
    updatePitMessage(cheer.message)
  }, [clearNextWordTimeout, handleBoost, queueNextWord, updatePitMessage])

  const resetInput = useCallback(() => {
    if (wordInputRef.current) {
      wordInputRef.current.value = ''
    }
  }, [])

  const handleWrong = useCallback(() => {
    playTone(audioCtxRef, 190, 0.2)
    setFeedback('Slow down! Try again.')
    resetInput()
    handlePenalty()
    updatePitMessage('Pit crew says: try again carefully!')
  }, [handlePenalty, resetInput, updatePitMessage])

  const checkWord = useCallback(
    (value: string) => {
      if (isRaceComplete) return
      const typed = value.trim().toLowerCase()
      if (!typed) return
      if (typed === currentWord) {
        resetInput()
        handleCorrect()
      } else {
        handleWrong()
      }
    },
    [currentWord, handleCorrect, handleWrong, isRaceComplete, resetInput],
  )

  const restartRace = () => {
    setLap(0)
    setBoosts(0)
    setFans(0)
    setRaceWon(false)
    setFeedback('')
    updatePitMessage('Tap a pit button to pump up the race!')
    clearNextWordTimeout()
    setNewWord()
    const speedLines = document.getElementById('speedLines')
    speedLines?.classList.remove('show')
  }

  const carPosition = useMemo(() => {
    const progress = Math.min(lap, CAR_STEPS) / CAR_STEPS
    const trackStart = 12 // keep emoji fully on track at the starting line
    const trackEnd = 88 // prevent overshooting at the finish line
    return trackStart + progress * (trackEnd - trackStart)
  }, [lap])

  return (
    <div className="car-panel">
      <div className="car-area">
        <span className="car-flag">🏁</span>
        <div className="car-track"></div>
        <div className="speed-lines" id="speedLines"></div>
        <div className="race-car" id="raceCar" style={{ left: `${carPosition}%` }}>
          <span>{'🏎️'}</span>
        </div>
      </div>

      <div className="car-photo-card">
        <img src="/Abhi.jpg" alt="Smiling racer ready to zoom" />
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isRaceComplete) {
              checkWord(e.currentTarget.value)
            } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !isRaceComplete) {
              playTone(audioCtxRef, 330)
            }
          }}
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
}
