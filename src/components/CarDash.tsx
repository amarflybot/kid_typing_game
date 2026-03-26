import { Component, createRef, type KeyboardEvent } from 'react'
import { CAR_WORDS, CAR_LOOKUP, type CarWord, type CarWordCard } from '../data/carWordCards'

const CAR_STEPS = 6
// Normalize BASE_URL for builds where ImportMeta typing omits env
const BASE_URL =
  (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'

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

export class CarDash extends Component<Record<string, never>, CarDashState> {
  private readonly wordInputRef = createRef<HTMLInputElement>()
  private readonly audioCtxRef: AudioContextRef = { current: null }
  private readonly pickNextWord = createCarPicker()
  private nextWordTimeout: number | null = null

  override state: CarDashState = {
    currentWord: CAR_WORDS[0] ?? FALLBACK_CAR_WORD,
    lap: 0,
    boosts: 0,
    fans: 0,
    feedback: '',
    pitMessage: 'Tap a pit button to pump up the race!',
    raceWon: false,
  }

  override componentDidMount(): void {
    this.setNewWord()
  }

  override componentWillUnmount(): void {
    this.clearNextWordTimeout()
  }

  private focusInput = () => {
    requestAnimationFrame(() => this.wordInputRef.current?.focus())
  }

  private setNewWord = () => {
    const next = this.pickNextWord()
    this.setState({ currentWord: next }, this.focusInput)
  }

  private clearNextWordTimeout = () => {
    if (this.nextWordTimeout) {
      window.clearTimeout(this.nextWordTimeout)
      this.nextWordTimeout = null
    }
  }

  private queueNextWord = () => {
    this.clearNextWordTimeout()
    this.nextWordTimeout = window.setTimeout(() => {
      this.setNewWord()
      this.nextWordTimeout = null
    }, 400)
  }

  private updatePitMessage = (message: string) => {
    this.setState({ pitMessage: message })
  }

  private handleBoost = () => {
    this.setState((prev) => ({
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
  }

  private handlePenalty = () => {
    this.setState((prev) => ({
      boosts: Math.max(0, prev.boosts - 1),
    }))
  }

  private handleCorrect = () => {
    playTone(this.audioCtxRef, 523.25)
    this.setState(
      (prev) => {
        const nextLap = prev.lap + 1
        const raceWon = nextLap >= CAR_STEPS
        return {
          lap: nextLap,
          raceWon,
          feedback: raceWon ? '🏁 Hot wheels! You finished the race!' : 'Vroom! Keep racing!',
          pitMessage: raceWon ? '🏆 Victory lap! Grab another race!' : prev.pitMessage,
        }
      },
      () => {
        if (this.state.raceWon) {
          this.clearNextWordTimeout()
        } else {
          this.queueNextWord()
          const cheer = CAR_CHEERS[Math.floor(Math.random() * CAR_CHEERS.length)]
          this.updatePitMessage(cheer.message)
        }
      },
    )
    this.handleBoost()
  }

  private resetInput = () => {
    if (this.wordInputRef.current) {
      this.wordInputRef.current.value = ''
    }
  }

  private handleWrong = () => {
    playTone(this.audioCtxRef, 190, 0.2)
    this.setState({ feedback: 'Slow down! Try again.' })
    this.resetInput()
    this.handlePenalty()
    this.updatePitMessage('Pit crew says: try again carefully!')
  }

  private checkWord = (value: string) => {
    if (this.isRaceComplete()) return
    const typed = value.trim().toLowerCase()
    if (!typed) return
    if (typed === this.state.currentWord) {
      this.resetInput()
      this.handleCorrect()
    } else {
      this.handleWrong()
    }
  }

  private restartRace = () => {
    this.setState({
      lap: 0,
      boosts: 0,
      fans: 0,
      raceWon: false,
      feedback: '',
      pitMessage: 'Tap a pit button to pump up the race!',
    })
    this.clearNextWordTimeout()
    this.setNewWord()
    const speedLines = document.getElementById('speedLines')
    speedLines?.classList.remove('show')
  }

  private isRaceComplete = () => this.state.raceWon || this.state.lap >= CAR_STEPS

  private getCarPosition = () => {
    const progress = Math.min(this.state.lap, CAR_STEPS) / CAR_STEPS
    const trackStart = 12
    const trackEnd = 88
    return trackStart + progress * (trackEnd - trackStart)
  }

  private handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (this.isRaceComplete()) return
    if (event.key === 'Enter') {
      this.checkWord(event.currentTarget.value)
      return
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      playTone(this.audioCtxRef, 330)
    }
  }

  override render() {
    const { currentWord, lap, boosts, fans, feedback, pitMessage, raceWon } = this.state
    const isRaceComplete = this.isRaceComplete()
    const carCard: CarWordCard | undefined = CAR_LOOKUP[currentWord]
    const carPosition = this.getCarPosition()
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
            <button className="pit-btn" type="button" onClick={() => playTone(this.audioCtxRef, 440)}>
              🔊 Honk Word
            </button>
            <button
              className="pit-btn"
              type="button"
              onClick={() => this.updatePitMessage(CAR_CHEERS[Math.floor(Math.random() * CAR_CHEERS.length)].message)}
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
            ref={this.wordInputRef}
            placeholder={currentWord}
            disabled={isRaceComplete}
            aria-disabled={isRaceComplete}
            onKeyDown={this.handleKeyDown}
          />
          <p className="car-feedback">{feedback}</p>
          <div className="car-progress">
            <div className="car-progress-bar" style={{ width: `${(Math.min(lap, CAR_STEPS) / CAR_STEPS) * 100}%` }}></div>
          </div>
          <p className="car-progress-text">
            Lap: {Math.min(lap, CAR_STEPS)} / {CAR_STEPS}
          </p>
          <button className="btn car-btn" type="button" onClick={this.restartRace}>
            {raceWon ? 'Race Again' : 'Start New Race'}
          </button>
        </div>

        {raceWon && (
          <div className="car-win show">
            <p>🏆 Vroom! You won the race!</p>
            <button className="btn" type="button" onClick={this.restartRace}>
              Play Again
            </button>
          </div>
        )}
      </div>
    )
  }
}
