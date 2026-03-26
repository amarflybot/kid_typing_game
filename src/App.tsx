import { useState } from 'react'
import { LadderGame } from './components/LadderGame'
import { CarDash } from './components/CarDash'
import { LearningLab } from './components/LearningLab'
import './App.css'

type TabId = 'ladder' | 'car' | 'lab'
type Tab = { id: TabId; label: string }

const tabs: Tab[] = [
  { id: 'ladder', label: 'Ladder Mode' },
  { id: 'car', label: 'Car Dash' },
  { id: 'lab', label: 'Learning Lab' },
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
        <h1>🦸 Abhimanyu Typing Adventure</h1>
        <p className="instructions">
          Type to make Abhimanyu climb, zoom the race car, or explore playful shape and counting quests! ✨
        </p>

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

        {activeTab === 'ladder' && <LadderGame />}
        {activeTab === 'car' && <CarDash />}
        {activeTab === 'lab' && <LearningLab />}
      </div>
    </div>
  )
};

export default App
