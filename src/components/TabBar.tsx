import { useStore } from '../lib/store'
import type { TabKey } from '../lib/types'
import { TabIcon } from './icons'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'ホーム' },
  { key: 'body', label: '身体' },
  { key: 'meal', label: '食事' },
  { key: 'train', label: '筋トレ' },
  { key: 'analysis', label: '分析' },
  { key: 'calendar', label: '暦' },
  { key: 'settings', label: '設定' },
]

export default function TabBar() {
  const { tab, setTab } = useStore()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-black/85 backdrop-blur-xl border-t border-line/70 safe-bottom">
      <div className="max-w-xl mx-auto flex">
        {TABS.map((t) => {
          const active = t.key === tab
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 min-h-[54px] ${active ? 'text-accent' : 'text-sub'}`}
            >
              <TabIcon k={t.key} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
