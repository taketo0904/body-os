import { addDays, formatJa, isDateStr } from '../lib/dates'
import { programDay } from '../lib/calc'
import { useStore } from '../lib/store'

export default function DateBar() {
  const { viewDate, setViewDate, today, data } = useStore()
  const day = programDay(data.settings, viewDate)
  const label = day < 1 ? 'START前' : day > 60 ? `DAY ${day}（終了後）` : `DAY ${String(day).padStart(2, '0')} / 60`
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          aria-label="前の日"
          onClick={() => setViewDate(addDays(viewDate, -1))}
          className="w-12 h-12 rounded-2xl bg-card border border-line text-xl"
        >
          ‹
        </button>
        <label className="relative flex-1 h-12 rounded-2xl bg-card border border-line flex flex-col items-center justify-center">
          <span className="text-[15px] font-semibold">{formatJa(viewDate)}</span>
          <span className="text-[11px] text-sub">{viewDate === today ? '今日 ・ ' : ''}{label}</span>
          <input
            type="date"
            value={viewDate}
            onChange={(e) => isDateStr(e.target.value) && setViewDate(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full"
            aria-label="日付を選択"
          />
        </label>
        <button
          aria-label="次の日"
          onClick={() => setViewDate(addDays(viewDate, 1))}
          className="w-12 h-12 rounded-2xl bg-card border border-line text-xl"
        >
          ›
        </button>
      </div>
      {viewDate !== today && (
        <button onClick={() => setViewDate(today)} className="mt-2 text-[13px] text-accent min-h-[36px]">
          今日に戻る
        </button>
      )}
    </div>
  )
}
