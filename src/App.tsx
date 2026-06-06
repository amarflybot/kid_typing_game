import { useState } from 'react'
import { LadderGame } from './components/LadderGame'
import { CarDash } from './components/CarDash'
import { LearningLab } from './components/LearningLab'
import { MathQuest } from './components/MathQuest'
import { BASE_URL } from './utils/baseUrl'
import './App.css'

type TabId = 'ladder' | 'car' | 'lab' | 'math'
type Tab = { id: TabId; label: string; detail: string; icon: string }
const ABHI_PHOTO_SRC = `${BASE_URL}Abhi.jpg`

const tabs: Tab[] = [
  { id: 'ladder', label: 'Ladder', detail: 'Type words', icon: '🪜' },
  { id: 'car', label: 'Race', detail: 'Speed rounds', icon: '🏎️' },
  { id: 'lab', label: 'Words', detail: 'Build tiles', icon: '🔤' },
  { id: 'math', label: 'Math', detail: 'Upper KG', icon: '🔢' },
]

const App = () => {
  const [activeTab, setActiveTab] = useState<TabId>('ladder')

  return (
    <div className="app-shell">
      <div className="clouds" aria-hidden="true">
        <span className="sparkle">⭐</span>
        <span className="sparkle">✨</span>
        <span className="sparkle">🌟</span>
      </div>
      <div className="main-card">
        <header className="app-header">
          <div className="hero-title">
            <span className="title-photo-frame">
              <img className="title-photo" src={ABHI_PHOTO_SRC} alt="Abhimanyu smiling" />
            </span>
            <div className="hero-copy">
              <p className="eyebrow">Daily practice board</p>
              <h1>Abhimanyu Typing Adventure</h1>
              <p className="instructions">A focused practice space for words, numbers, and confident little wins.</p>
            </div>
          </div>
        </header>

        <nav className="tab-bar" aria-label="Practice modes">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              type="button"
            >
              <span className="tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span>
                <span className="tab-label">{tab.label}</span>
                <span className="tab-detail">{tab.detail}</span>
              </span>
            </button>
          ))}
        </nav>

        <section className="mode-panel">
          {activeTab === 'ladder' && <LadderGame />}
          {activeTab === 'car' && <CarDash />}
          {activeTab === 'lab' && <LearningLab />}
          {activeTab === 'math' && <MathQuest />}
        </section>
      </div>
    </div>
  )
};

export default App
