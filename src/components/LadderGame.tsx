import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WORDS, WORD_LOOKUP, type Word } from '../data/wordCards'

const LADDER_RUNGS = 8
const RUNG_HEIGHT = 38
const MARIO_BASE_BOTTOM = 45
const BASE_LIVES = 3
const HEART_CAP = 6
const POINTS_PER_WORD = 10
const LEVEL_BONUS = 20

type AudioContextRef = MutableRefObject<AudioContext | null>

type OscillatorShape = OscillatorType | 'sine'

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

const useWordPicker = () => {
  const used = useRef<Set<Word>>(new Set())
  return useCallback(() => {
    const available = WORDS.filter((word) => !used.current.has(word))
    if (available.length === 0) {
      used.current.clear()
    }
    const source = available.length ? available : WORDS
    const next = source[Math.floor(Math.random() * source.length)] as Word
    used.current.add(next)
    return next
  }, [])
}

export const LadderGame = () => {
  const [currentWord, setCurrentWord] = useState<Word>(WORDS[0] ?? FALLBACK_WORD)
  const [currentRung, setCurrentRung] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [maxLives, setMaxLives] = useState(BASE_LIVES)
  const [lives, setLives] = useState(BASE_LIVES)
  const [feedback, setFeedback] = useState('')
  const [winState, setWinState] = useState(false)
  const [mission, setMission] = useState('Get ready to type!')
  const [progressColor, setProgressColor] = useState('#6c757d')
  const wordInputRef = useRef<HTMLInputElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const pickWord = useWordPicker()
  const isGameComplete = winState || currentRung >= LADDER_RUNGS

  const rungSteps = useMemo(() => Array.from({ length: LADDER_RUNGS }, (_, i) => i), [])

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      wordInputRef.current?.focus()
    })
  }, [])

  const setNewWord = useCallback(() => {
    const newWord = pickWord()
    setCurrentWord(newWord)
    const card = WORD_LOOKUP[newWord]
    setMission(card?.mission ?? `Type ${newWord.toUpperCase()}!`)
    focusInput()
  }, [focusInput, pickWord])

  useEffect(() => {
    setNewWord()
  }, [setNewWord])

  const drawProgressColor = useCallback(() => {
    setProgressColor('#27ae60')
    setTimeout(() => setProgressColor('#6c757d'), 800)
  }, [])

  const unlockHearts = useCallback(
    (nextRung: number) => {
      const targetMax = Math.min(HEART_CAP, BASE_LIVES + Math.floor(nextRung / 2))
      if (targetMax > maxLives) {
        setMaxLives(targetMax)
        setLives((prev) => Math.min(prev + (targetMax - maxLives), targetMax))
      }
    },
    [maxLives],
  )

  const handleWin = useCallback(() => {
    playTone(audioCtxRef, 1046.5, 0.25)
    setWinState(true)
    createConfetti()
  }, [])

  const resetInput = useCallback(() => {
    if (wordInputRef.current) {
      wordInputRef.current.value = ''
    }
  }, [])

  const handleCorrect = useCallback(() => {
    celebrate(audioCtxRef)
    setScore((prev) => prev + POINTS_PER_WORD)
    setCurrentRung((prev) => {
      const next = prev + 1
      drawProgressColor()
      unlockHearts(next)
      if (next >= LADDER_RUNGS) {
        setScore((prevScore) => prevScore + LEVEL_BONUS)
        setFeedback('🏆 Mario reached the top!')
        handleWin()
      } else {
        setFeedback('🎉 Great job! Mario climbs up!')
        setTimeout(setNewWord, 600)
      }
      return next
    })
  }, [drawProgressColor, handleWin, setNewWord, unlockHearts])

  const handleWrong = useCallback(() => {
    playWrongNotes(audioCtxRef)
    setFeedback('Oops! Try again 💪')
    setLives((prev) => {
      const next = Math.max(0, prev - 1)
      if (next === 0) {
        setTimeout(() => {
          setLives(maxLives)
        }, 600)
      }
      return next
    })
  }, [maxLives])

  const checkWord = useCallback(
    (value: string) => {
      if (isGameComplete) return
      if (!value.trim()) return
      const typed = value.trim().toLowerCase()
      if (typed === currentWord) {
        resetInput()
        handleCorrect()
      } else {
        resetInput()
        handleWrong()
      }
    },
    [currentWord, handleCorrect, handleWrong, isGameComplete, resetInput],
  )

  const restart = (nextLevel = false) => {
    setCurrentRung(0)
    setWinState(false)
    setFeedback('')
    setProgressColor('#6c757d')
    if (nextLevel) {
      setLevel((prev) => prev + 1)
    } else {
      setLevel(1)
      setScore(0)
    }
    setMaxLives(BASE_LIVES)
    setLives(BASE_LIVES)
    setNewWord()
  }

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
          <span className="hearts-row">
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
              <img src="/Ashu.jpg" alt="Excited kid" className="kid-photo" />
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
              <button className="action-btn" type="button" onClick={() => setFeedback('You got this! 💪')}>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isGameComplete) {
                    checkWord(e.currentTarget.value)
                  } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !isGameComplete) {
                    playTone(audioCtxRef, 329.63)
                  }
                }}
              />
            </div>
            <p className={`feedback ${feedback.includes('Oops') ? 'wrong' : 'correct'}`}>{feedback}</p>
            <div className="progress-panel">
              <div className="progress-bar">
                {rungSteps.map((step) => (
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
              <div
                className={`mario ${currentRung > 0 ? 'climbing' : ''}`}
                style={{ bottom: MARIO_BASE_BOTTOM + currentRung * RUNG_HEIGHT }}
              >
                <img src="/Ashu.jpg" alt="Mario" className="mario-avatar" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {winState && (
        <div className="win-message show">
          <p className="trophy">🏆</p>
          <p className="feedback correct">Mario reached the top! You're a typing champion! 🌟</p>
          <p className="feedback win-score">Level {level} complete! +{LEVEL_BONUS} coins</p>
          <button className="btn" type="button" onClick={() => restart(true)}>
            Next Level 🚀
          </button>
        </div>
      )}
    </div>
  )
}
