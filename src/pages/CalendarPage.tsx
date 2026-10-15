import { useState } from 'react'
import { Card, Title } from '../components/ui'
import { hasBody, hasMeal, isTrainingDay, programDay, trainState } from '../lib/calc'
import { addDays, formatJa, parseDate, toDateStr } from '../lib/dates'
import { useStore } from '../lib/store'

export default function CalendarPage() {
  const { data, today, viewDate, setViewDate, setTab } = useStore()
  const init = parseDate(viewDate)
  const [ym, setYm] = useState({ y: init.getFullYear(), m: init.getMonth() })

  const first = new Date(ym.y, ym.m, 1)
  const lead = (first.getDay() + 6) % 7 // 月曜始まり
  const count = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => toDateStr(new Date(ym.y, ym.m, i + 1))),
  ]
  while (cells.length % 7) cells.push(null)

  const move = (n: number) => {
    const d = new Date(ym.y, ym.m + n, 1)
    setYm({ y: d.getFullYear(), m: d.getMonth() })
  }

  const s = data.settings
  const endDate = addDays(s.startDate, 59)
  const dow = ['月', '火', '水', '木', '金', '土', '日']
  const ts = trainState(data, viewDate)
  const day = programDay(s, viewDate)

  const jump = (t: 'body' | 'meal' | 'train') => setTab(t)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">カレンダー</h1>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => move(-1)} aria-label="前の月" className="w-11 h-11 rounded-xl bg-card2 text-xl">‹</button>
          <span className="font-bold text-[17px]">{ym.y}年{ym.m + 1}月</span>
          <button onClick={() => move(1)} aria-label="次の月" className="w-11 h-11 rounded-xl bg-card2 text-xl">›</button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] text-sub mb-1">
          {dow.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />
            const sel = d === viewDate
            const inProgram = d >= s.startDate && d <= endDate
            const t = trainState(data, d)
            return (
              <button
                key={d}
                onClick={() => setViewDate(d)}
                aria-label={formatJa(d)}
                aria-pressed={sel}
                className={`aspect-square min-h-[44px] rounded-xl flex flex-col items-center justify-center gap-1 border ${
                  sel ? 'border-accent bg-accent/15' : d === today ? 'border-white/40' : 'border-transparent'
                } ${inProgram ? 'bg-card2' : ''}`}
              >
                <span className={`text-[14px] tnum ${d === today ? 'font-bold text-accent' : inProgram ? '' : 'text-sub'}`}>
                  {parseDate(d).getDate()}
                </span>
                <span className="flex gap-[3px] h-[6px]">
                  {hasBody(data, d) && <i className="w-[6px] h-[6px] rounded-full bg-accent" />}
                  {hasMeal(data, d) && <i className="w-[6px] h-[6px] rounded-full bg-carb" />}
                  {t !== 'none' && <i className={`w-[6px] h-[6px] rounded-full ${t === 'done' ? 'bg-pro' : 'bg-pro/50'}`} />}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-4 mt-4 text-[11px] text-sub">
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-accent" />身体</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-carb" />食事</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-pro" />筋トレ（薄＝一部）</span>
        </div>
      </Card>

      <Card>
        <Title>{formatJa(viewDate)}</Title>
        <p className="text-sub text-[12px] mb-3">
          {day < 1 ? 'プログラム開始前' : day > 60 ? 'プログラム終了後' : `DAY ${String(day).padStart(2, '0')} / 60`}
          {isTrainingDay(s, viewDate) ? ' ・ トレーニング予定日' : ''}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Status label="身体記録" ok={hasBody(data, viewDate)} onClick={() => jump('body')} />
          <Status label="食事記録" ok={hasMeal(data, viewDate)} onClick={() => jump('meal')} />
          <Status
            label="筋トレ"
            ok={ts === 'done'}
            text={ts === 'done' ? '完了' : ts === 'partial' ? '一部' : '未実施'}
            onClick={() => jump('train')}
          />
        </div>
        <p className="text-sub text-[11px] mt-3">タップするとこの日の記録画面を開きます</p>
      </Card>
    </div>
  )
}

function Status({ label, ok, text, onClick }: { label: string; ok: boolean; text?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-card2 border border-line py-3 min-h-[72px]">
      <p className="text-[12px] text-sub">{label}</p>
      <p className={`text-[15px] font-bold mt-1 ${ok ? 'text-ok' : text === '一部' ? 'text-fat' : 'text-sub'}`}>
        {text ?? (ok ? '記録あり' : 'なし')}
      </p>
    </button>
  )
}
