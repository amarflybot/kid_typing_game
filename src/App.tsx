import { useState } from 'react'
import { LadderGame } from './components/LadderGame'
import { CarDash } from './components/CarDash'
import './App.css'

type TabId = 'ladder' | 'car'
type Tab = { id: TabId; label: string }

const tabs: Tab[] = [
  { id: 'ladder', label: 'Ladder Mode' },
  { id: 'car', label: 'Car Dash' },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('ladder')

  return (
    <div className="app-shell">
      <div className="clouds" aria-hidden="true">
        <span className="sparkle">⭐</span>
        <span className="sparkle">✨</span>
        <span className="sparkle">🌟</span>
      </div>
      <div className="main-card">
        <h1>🦸 Mario Typing Adventure</h1>
        <p className="instructions">Type the word below to make Mario climb the ladder or speed down the track! ✨</p>

        <div className="tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'ladder' ? <LadderGame /> : <CarDash />}
      </div>
    </div>
  )
}

export default App
