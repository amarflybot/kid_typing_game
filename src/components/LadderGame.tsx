import { Component, createRef, type KeyboardEvent } from 'react'
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

export class LadderGame extends Component<Record<string, never>, LadderGameState> {
  private readonly wordInputRef = createRef<HTMLInputElement>()
  private readonly audioCtxRef: AudioContextRef = { current: null }
  private readonly pickWord = createWordPicker()
  private nextWordTimeout: number | null = null
  private refillTimeout: number | null = null
  private progressColorTimeout: number | null = null

  state: LadderGameState = {
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
  }

  componentDidMount(): void {
    this.setNewWord()
  }

  componentWillUnmount(): void {
    this.clearTimers()
  }

  private clearTimers = () => {
    if (this.nextWordTimeout) {
      window.clearTimeout(this.nextWordTimeout)
      this.nextWordTimeout = null
    }
    if (this.refillTimeout) {
      window.clearTimeout(this.refillTimeout)
      this.refillTimeout = null
    }
    if (this.progressColorTimeout) {
      window.clearTimeout(this.progressColorTimeout)
      this.progressColorTimeout = null
    }
  }

  private focusInput = () => {
    requestAnimationFrame(() => this.wordInputRef.current?.focus())
  }

  private setNewWord = () => {
    const newWord = this.pickWord()
    const card = WORD_LOOKUP[newWord]
    this.setState(
      {
        currentWord: newWord,
        mission: card?.mission ?? `Type ${newWord.toUpperCase()}!`,
      },
      this.focusInput,
    )
  }

  private drawProgressColor = () => {
    this.setState({ progressColor: '#27ae60' })
    this.progressColorTimeout && window.clearTimeout(this.progressColorTimeout)
    this.progressColorTimeout = window.setTimeout(() => {
      this.setState({ progressColor: '#6c757d' })
      this.progressColorTimeout = null
    }, 800)
  }

  private getHeartUpdates = (prev: LadderGameState, nextRung: number): Partial<LadderGameState> | null => {
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

  private scheduleNewWord = () => {
    this.nextWordTimeout && window.clearTimeout(this.nextWordTimeout)
    this.nextWordTimeout = window.setTimeout(() => {
      this.setNewWord()
      this.nextWordTimeout = null
    }, 600)
  }

  private triggerWinCelebration = () => {
    playTone(this.audioCtxRef, 1046.5, 0.25)
    createConfetti()
  }

  private resetInput = () => {
    if (this.wordInputRef.current) {
      this.wordInputRef.current.value = ''
    }
  }

  private handleCorrect = () => {
    celebrate(this.audioCtxRef)
    this.drawProgressColor()
    this.setState(
      (prev) => {
        const nextRung = prev.currentRung + 1
        const reachedTop = nextRung >= LADDER_RUNGS
        const heartUpdates = this.getHeartUpdates(prev, nextRung)
        const updatedState: Partial<LadderGameState> = {
          currentRung: nextRung,
          score: prev.score + POINTS_PER_WORD + (reachedTop ? LEVEL_BONUS : 0),
          feedback: reachedTop ? '🏆 Abhimanyu reached the top!' : '🎉 Great job! Abhimanyu climbs up!',
          winState: reachedTop ? true : prev.winState,
        }
        if (heartUpdates) Object.assign(updatedState, heartUpdates)
        return updatedState
      },
      () => {
        if (this.state.winState) {
          this.triggerWinCelebration()
        } else {
          this.scheduleNewWord()
        }
      },
    )
  }

  private handleWrong = () => {
    playWrongNotes(this.audioCtxRef)
    this.setState(
      (prev) => {
        const nextLives = Math.max(0, prev.lives - 1)
        return {
          feedback: 'Oops! Try again 💪',
          lives: nextLives,
        }
      },
      () => {
        if (this.state.lives === 0) {
          this.refillTimeout && window.clearTimeout(this.refillTimeout)
          this.refillTimeout = window.setTimeout(() => {
            this.setState((prev) => ({ lives: prev.maxLives }))
            this.refillTimeout = null
          }, 600)
        }
      },
    )
  }

  private checkWord = (value: string) => {
    if (this.isGameComplete()) return
    const typed = value.trim().toLowerCase()
    if (!typed) return
    if (typed === this.state.currentWord) {
      this.resetInput()
      this.handleCorrect()
    } else {
      this.resetInput()
      this.handleWrong()
    }
  }

  private restart = (nextLevel = false) => {
    this.clearTimers()
    this.setState(
      (prev) => ({
        currentRung: 0,
        winState: false,
        feedback: '',
        progressColor: '#6c757d',
        level: nextLevel ? prev.level + 1 : 1,
        score: nextLevel ? prev.score : 0,
        maxLives: BASE_LIVES,
        lives: BASE_LIVES,
      }),
      this.setNewWord,
    )
  }

  private isGameComplete = () => this.state.winState || this.state.currentRung >= LADDER_RUNGS

  private handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      this.checkWord(event.currentTarget.value)
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !this.isGameComplete()) {
      playTone(this.audioCtxRef, 329.63)
    }
  }

  render() {
    const { level, score, maxLives, lives, mission, currentWord, feedback, progressColor, currentRung, winState } =
      this.state
    const isGameComplete = this.isGameComplete()
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
                <button className="action-btn" type="button" onClick={() => playTone(this.audioCtxRef, 261.63)}>
                  🔊 Hear Word
                </button>
                <button className="action-btn" type="button" onClick={() => this.setState({ feedback: 'You got this! 💪' })}>
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
                  ref={this.wordInputRef}
                  type="text"
                  maxLength={3}
                  placeholder="???"
                  disabled={isGameComplete}
                  aria-disabled={isGameComplete}
                  onKeyDown={(event) => {
                    if (!isGameComplete) {
                      this.handleKeyDown(event)
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
                <div
                  className={`mario ${currentRung > 0 ? 'climbing' : ''}`}
                  style={{ bottom: MARIO_BASE_BOTTOM + currentRung * RUNG_HEIGHT }}
                >
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
            <button className="btn" type="button" onClick={() => this.restart(true)}>
              Next Level 🚀
            </button>
          </div>
        )}
      </div>
    )
  }
}
