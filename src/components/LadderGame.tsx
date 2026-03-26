import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { WORDS, WORD_LOOKUP, type Word } from '../data/wordCards'
import { BASE_URL } from '../utils/baseUrl'

const LADDER_RUNGS = 8
const RUNG_HEIGHT = 38
const MARIO_BASE_BOTTOM = 0
const BASE_LIVES = 3
const HEART_CAP = 6
const POINTS_PER_WORD = 10
const LEVEL_BONUS = 20
const RUNG_STEPS = Array.from({ length: LADDER_RUNGS }, (_, i) => i)
const ASHU_PHOTO_SRC = `${BASE_URL}Ashu.jpg`

type AudioContextRef = { current: AudioContext | null }
type OscillatorShape = OscillatorType | 'sine'

type LadderGameState = {
  currentWord: Word
  currentRung: number
  score: number
  level: number
  maxLives: number
  lives: number
  feedback: string
  winState: boolean
  mission: string
  progressColor: string
}

const playTone = (ctxRef: AudioContextRef, freq: number, duration = 0.1, type: OscillatorShape = 'sine') => {
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
    osc.type = type as OscillatorType
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {
    // ignore audio errors
  }
}

const celebrate = (ctxRef: AudioContextRef) => {
  ;[523.25, 659.25, 783.99].forEach((freq, index) => {
    setTimeout(() => playTone(ctxRef, freq, 0.15, 'sine'), index * 80)
  })
}

const playWrongNotes = (ctxRef: AudioContextRef) => {
  playTone(ctxRef, 200, 0.2, 'sawtooth')
  setTimeout(() => playTone(ctxRef, 180, 0.2, 'sawtooth'), 120)
}

const createConfetti = () => {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4ecdc4', '#e74c3c']
  for (let i = 0; i < 24; i++) {
    const confetti = document.createElement('div')
    confetti.className = 'confetti'
    confetti.style.left = `${Math.random() * 100}vw`
    confetti.style.top = '0'
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)]
    confetti.style.animationDelay = `${Math.random() * 0.5}s`
    document.body.appendChild(confetti)
    setTimeout(() => confetti.remove(), 2000)
  }
}

const FALLBACK_WORD = 'cat' as Word

const createWordPicker = () => {
  const used = new Set<Word>()
  return () => {
    const available = WORDS.filter((word) => !used.has(word))
    if (!available.length) used.clear()
    const source = available.length ? available : WORDS
    const next = source[Math.floor(Math.random() * source.length)] as Word
    used.add(next)
    return next
  }
}

const createInitialState = (): LadderGameState => ({
  currentWord: WORDS[0] ?? FALLBACK_WORD,
  currentRung: 0,
  score: 0,
  level: 1,
  maxLives: BASE_LIVES,
  lives: BASE_LIVES,
  feedback: '',
  winState: false,
  mission: 'Get ready to type!',
  progressColor: '#6c757d',
})

const getHeartUpdates = (prev: LadderGameState, nextRung: number): Partial<LadderGameState> | null => {
  const targetMax = Math.min(HEART_CAP, BASE_LIVES + Math.floor(nextRung / 2))
  if (targetMax > prev.maxLives) {
    const gained = targetMax - prev.maxLives
    return {
      maxLives: targetMax,
      lives: Math.min(prev.lives + gained, targetMax),
    }
  }
  return null
}

export const LadderGame = () => {
  const [state, setState] = useState<LadderGameState>(() => createInitialState())
  const wordInputRef = useRef<HTMLInputElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const pickWordRef = useRef(createWordPicker())
  const nextWordTimeoutRef = useRef<number | null>(null)
  const refillTimeoutRef = useRef<number | null>(null)
  const progressColorTimeoutRef = useRef<number | null>(null)

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => wordInputRef.current?.focus())
  }, [])

  const clearTimers = useCallback(() => {
    if (nextWordTimeoutRef.current) {
      window.clearTimeout(nextWordTimeoutRef.current)
      nextWordTimeoutRef.current = null
    }
    if (refillTimeoutRef.current) {
      window.clearTimeout(refillTimeoutRef.current)
      refillTimeoutRef.current = null
    }
    if (progressColorTimeoutRef.current) {
      window.clearTimeout(progressColorTimeoutRef.current)
      progressColorTimeoutRef.current = null
    }
  }, [])

  const setNewWord = useCallback(() => {
    const newWord = pickWordRef.current()
    const card = WORD_LOOKUP[newWord]
    setState((prev) => ({
      ...prev,
      currentWord: newWord,
      mission: card?.mission ?? `Type ${newWord.toUpperCase()}!`,
    }))
    focusInput()
  }, [focusInput])

  const drawProgressColor = useCallback(() => {
    setState((prev) => ({ ...prev, progressColor: '#27ae60' }))
    if (progressColorTimeoutRef.current) {
      window.clearTimeout(progressColorTimeoutRef.current)
    }
    progressColorTimeoutRef.current = window.setTimeout(() => {
      setState((prev) => ({ ...prev, progressColor: '#6c757d' }))
      progressColorTimeoutRef.current = null
    }, 800)
  }, [])

  const scheduleNewWord = useCallback(() => {
    if (nextWordTimeoutRef.current) {
      window.clearTimeout(nextWordTimeoutRef.current)
    }
    nextWordTimeoutRef.current = window.setTimeout(() => {
      setNewWord()
      nextWordTimeoutRef.current = null
    }, 600)
  }, [setNewWord])

  useEffect(() => {
    setNewWord()
    return () => {
      clearTimers()
    }
  }, [setNewWord, clearTimers])

  const triggerWinCelebration = useCallback(() => {
    playTone(audioCtxRef, 1046.5, 0.25)
    createConfetti()
  }, [])

  const resetInput = useCallback(() => {
    if (wordInputRef.current) {
      wordInputRef.current.value = ''
    }
  }, [])

  const handleCorrect = useCallback(() => {
    celebrate(audioCtxRef)
    drawProgressColor()
    let reachedTop = false
    setState((prev) => {
      const nextRung = prev.currentRung + 1
      reachedTop = nextRung >= LADDER_RUNGS
      const heartUpdates = getHeartUpdates(prev, nextRung)
      const updatedState: LadderGameState = {
        ...prev,
        currentRung: nextRung,
        score: prev.score + POINTS_PER_WORD + (reachedTop ? LEVEL_BONUS : 0),
        feedback: reachedTop ? '🏆 Abhimanyu reached the top!' : '🎉 Great job! Abhimanyu climbs up!',
        winState: reachedTop ? true : prev.winState,
      }
      if (heartUpdates) {
        Object.assign(updatedState, heartUpdates)
      }
      return updatedState
    })
    if (reachedTop) {
      triggerWinCelebration()
    } else {
      scheduleNewWord()
    }
  }, [drawProgressColor, scheduleNewWord, triggerWinCelebration])

  const handleWrong = useCallback(() => {
    playWrongNotes(audioCtxRef)
    const nextLives = Math.max(0, state.lives - 1)
    setState((prev) => ({
      ...prev,
      feedback: 'Oops! Try again 💪',
      lives: nextLives,
    }))
    if (nextLives === 0) {
      if (refillTimeoutRef.current) {
        window.clearTimeout(refillTimeoutRef.current)
      }
      refillTimeoutRef.current = window.setTimeout(() => {
        setState((prev) => ({ ...prev, lives: prev.maxLives }))
        refillTimeoutRef.current = null
      }, 600)
    }
  }, [audioCtxRef, state.lives])

  const isGameComplete = state.winState || state.currentRung >= LADDER_RUNGS

  const checkWord = useCallback(
    (value: string) => {
      if (isGameComplete) return
      const typed = value.trim().toLowerCase()
      if (!typed) return
      if (typed === state.currentWord) {
        resetInput()
        handleCorrect()
      } else {
        resetInput()
        handleWrong()
      }
    },
    [handleCorrect, handleWrong, isGameComplete, resetInput, state.currentWord],
  )

  const restart = useCallback(
    (nextLevel = false) => {
      clearTimers()
      setState((prev) => ({
        ...createInitialState(),
        level: nextLevel ? prev.level + 1 : 1,
        score: nextLevel ? prev.score : 0,
      }))
      setNewWord()
    },
    [clearTimers, setNewWord],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        checkWord(event.currentTarget.value)
      } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !isGameComplete) {
        playTone(audioCtxRef, 329.63)
      }
    },
    [checkWord, isGameComplete],
  )

  const { level, score, maxLives, lives, mission, currentWord, feedback, progressColor, currentRung, winState } = state

  return (
    <div className="ladder-wrapper">
      <div className="status-bar">
        <div className="status-chip">
          <span className="status-label">Level</span>
          <span className="status-value">{level}</span>
        </div>
        <div className="status-chip coin">
          <span className="status-label">Coins</span>
          <span className="status-value">{score}</span>
        </div>
        <div className="status-chip hearts">
          <span className="status-label">Hearts</span>
          <span className="hearts-row" aria-label="Hearts status">
            {Array.from({ length: maxLives }).map((_, idx) => (
              <span key={`heart-${idx}`} className="heart">
                {idx < lives ? '❤️' : '🤍'}
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="mission-card">
        <p className="mission-label">Mission</p>
        <p className="mission-text">{mission}</p>
      </div>

      <div className="game-layout">
        <div className="game-column left">
          <div className="kid-showcase">
            <div className="kid-photo-frame">
              <img src={ASHU_PHOTO_SRC} alt="Excited kid" className="kid-photo" />
              <span className="kid-badge">Let's go!</span>
            </div>
            <div className="kid-quote">
              I'm fired up to climb this ladder!
              <span>Type fast with me 💥</span>
            </div>
          </div>
          <div className="interaction-panel">
            <div className="action-buttons">
              <button className="action-btn" type="button" onClick={() => playTone(audioCtxRef, 261.63)}>
                🔊 Hear Word
              </button>
              <button className="action-btn" type="button" onClick={() => setState((prev) => ({ ...prev, feedback: 'You got this! 💪' }))}>
                🎉 Kid Cheer
              </button>
            </div>
            <p className="cheer-text">Tap a button for help or cheer!</p>
          </div>
        </div>

        <div className="game-column center">
          <div className="word-card">
            <div
              className="word-picture"
              style={{
                background: `linear-gradient(145deg, ${WORD_LOOKUP[currentWord]?.colors?.[0] ?? '#fff9e6'}, ${WORD_LOOKUP[currentWord]?.colors?.[1] ?? '#ffffff'})`,
              }}
            >
              <span className="word-emoji" aria-hidden="true">
                {WORD_LOOKUP[currentWord]?.emoji}
              </span>
            </div>
            <p className="word-label">{WORD_LOOKUP[currentWord]?.label}</p>
            <div className="word-bubble">
              <p className="word-display">{currentWord.toUpperCase()}</p>
            </div>
          </div>
          <div className="input-stack">
            <div className="input-wrapper">
              <input
                ref={wordInputRef}
                type="text"
                maxLength={3}
                placeholder="???"
                disabled={isGameComplete}
                aria-disabled={isGameComplete}
                onKeyDown={(event) => {
                  if (!isGameComplete) {
                    handleKeyDown(event)
                  }
                }}
              />
            </div>
            <p className={`feedback ${feedback.includes('Oops') ? 'wrong' : 'correct'}`}>{feedback}</p>
            <div className="progress-panel">
              <div className="progress-bar">
                {RUNG_STEPS.map((step) => (
                  <span key={`progress-${step}`} className={`progress-step ${step < currentRung ? 'filled' : ''}`}></span>
                ))}
              </div>
              <p className="progress-text" style={{ color: progressColor }}>
                Ladder: {currentRung} / {LADDER_RUNGS}
              </p>
            </div>
          </div>
        </div>

        <div className="game-column right">
          <div className="game-area">
            <span className="flag">🏁</span>
            <div className="ladder">
              {Array.from({ length: LADDER_RUNGS + 1 }).map((_, idx) => (
                <div key={`rung-${idx}`} className="ladder-rung" style={{ bottom: idx * RUNG_HEIGHT }}></div>
              ))}
              <div className={`mario ${currentRung > 0 ? 'climbing' : ''}`} style={{ bottom: MARIO_BASE_BOTTOM + currentRung * RUNG_HEIGHT }}>
                <img src={ASHU_PHOTO_SRC} alt="Mario" className="mario-avatar" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {winState && (
        <div className="win-message show">
          <p className="trophy">🏆</p>
          <p className="feedback correct">Abhimanyu reached the top! You're a typing champion! 🌟</p>
          <p className="feedback win-score">Level {level} complete! +{LEVEL_BONUS} coins</p>
          <button className="btn" type="button" onClick={() => restart(true)}>
            Next Level 🚀
          </button>
        </div>
      )}
    </div>
  )
};
