import TabBar from './components/TabBar'
import { Notice } from './components/ui'
import { useStore } from './lib/store'
import Analysis from './pages/Analysis'
import Body from './pages/Body'
import CalendarPage from './pages/CalendarPage'
import Dashboard from './pages/Dashboard'
import Meals from './pages/Meals'
import Settings from './pages/Settings'
import Training from './pages/Training'

export default function App() {
  const { tab, saveError } = useStore()
  return (
    <div className="min-h-full max-w-xl mx-auto px-4 safe-top pb-[calc(90px+env(safe-area-inset-bottom))] pt-4">
      {saveError && (
        <div className="mb-3">
          <Notice tone="error">{saveError}</Notice>
        </div>
      )}
      {tab === 'home' && <Dashboard />}
      {tab === 'body' && <Body />}
      {tab === 'meal' && <Meals />}
      {tab === 'train' && <Training />}
      {tab === 'analysis' && <Analysis />}
      {tab === 'calendar' && <CalendarPage />}
      {tab === 'settings' && <Settings />}
      <TabBar />
    </div>
  )
}
