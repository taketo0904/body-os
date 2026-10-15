import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Title } from '../components/ui'
import { isTrainingDay, mealTotals, progressOf, trainedDay } from '../lib/calc'
import { lastNDays, shortMD } from '../lib/dates'
import { useStore } from '../lib/store'

const RANGES = [7, 30, 60] as const

interface Point {
  date: string
  label: string
  weight: number | null
  fat: number | null
  kcal: number | null
  protein: number | null
  train: number | null
}

const axis = { stroke: '#8e8e93', fontSize: 11, tickLine: false, axisLine: false } as const
const tip = {
  contentStyle: { background: '#1a1a1d', border: '1px solid #2a2a2e', borderRadius: 12, fontSize: 12 },
  labelStyle: { color: '#8e8e93' },
  itemStyle: { color: '#fff' },
} as const

export default function Analysis() {
  const { data, today } = useStore()
  const [range, setRange] = useState<(typeof RANGES)[number]>(7)

  const points = useMemo<Point[]>(
    () =>
      lastNDays(today, range).map((date) => {
        const b = data.body[date]
        const hasMeal = (data.meals[date]?.length ?? 0) > 0
        const t = mealTotals(data.meals[date])
        const log = data.workouts[date]
        const p = progressOf(log)
        let train: number | null = null
        if (p.total > 0 && p.done > 0) train = Math.round((p.done / p.total) * 100)
        else if (isTrainingDay(data.settings, date)) train = 0
        return {
          date,
          label: shortMD(date),
          weight: b?.weight ?? null,
          fat: b?.bodyFat ?? null,
          kcal: hasMeal ? t.kcal : null,
          protein: hasMeal ? t.protein : null,
          train,
        }
      }),
    [data, today, range],
  )

  const stats = useMemo(() => {
    const days = lastNDays(today, range)
    const scheduled = days.filter((d) => isTrainingDay(data.settings, d))
    const trainedScheduled = scheduled.filter((d) => trainedDay(data, d)).length
    const trainedAll = days.filter((d) => trainedDay(data, d)).length
    const rate = scheduled.length ? Math.min(100, Math.round((trainedScheduled / scheduled.length) * 100)) : 0
    return { scheduled: scheduled.length, trainedScheduled, trainedAll, rate }
  }, [data, today, range])

  const first = (k: 'weight' | 'fat') => points.find((p) => p[k] !== null)?.[k] ?? null
  const lastV = (k: 'weight' | 'fat') => [...points].reverse().find((p) => p[k] !== null)?.[k] ?? null
  const delta = (k: 'weight' | 'fat', unit: string) => {
    const a = first(k)
    const b = lastV(k)
    if (a === null || b === null) return null
    const d = Math.round((b - a) * 10) / 10
    return `${d > 0 ? '+' : ''}${d}${unit}`
  }

  const interval = range === 7 ? 0 : Math.ceil(range / 6) - 1
  const dom: [(m: number) => number, (m: number) => number] = [(m) => Math.floor(m - 1), (m) => Math.ceil(m + 1)]
  const s = data.settings

  const lineChart = (key: 'weight' | 'fat', color: string, unit: string, target: number) => (
    <ComposedChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
      <CartesianGrid stroke="#222" vertical={false} />
      <XAxis dataKey="label" interval={interval} {...axis} />
      <YAxis domain={dom} width={42} {...axis} />
      <Tooltip {...tip} formatter={(v) => [`${v}${unit}`, '']} />
      <ReferenceLine y={target} stroke={color} strokeDasharray="4 4" strokeOpacity={0.5} />
      <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2.5} dot={{ r: range === 60 ? 1.5 : 3, fill: color }} connectNulls isAnimationActive={false} />
    </ComposedChart>
  )

  const barChart = (key: 'kcal' | 'protein', color: string, unit: string, target: number) => (
    <ComposedChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
      <CartesianGrid stroke="#222" vertical={false} />
      <XAxis dataKey="label" interval={interval} {...axis} />
      <YAxis domain={[0, (m: number) => Math.ceil(Math.max(m, target) * 1.1)]} width={42} {...axis} />
      <Tooltip {...tip} formatter={(v) => [`${v}${unit}`, '']} cursor={{ fill: '#ffffff10' }} />
      <ReferenceLine y={target} stroke="#fff" strokeDasharray="4 4" strokeOpacity={0.4} />
      <Bar dataKey={key} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
    </ComposedChart>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">分析</h1>
      <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-card border border-line">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={`min-h-[44px] rounded-xl text-[14px] font-semibold ${range === r ? 'bg-accent text-black' : 'text-sub'}`}
          >
            {r}日
          </button>
        ))}
      </div>

      <Chart title="体重推移" note={delta('weight', 'kg')} empty={first('weight') === null}>
        {lineChart('weight', '#c6ff3d', 'kg', s.targetWeight)}
      </Chart>
      <Chart title="体脂肪率推移" note={delta('fat', '%')} empty={first('fat') === null}>
        {lineChart('fat', '#4cc9f0', '%', s.targetBodyFat)}
      </Chart>
      <Chart title="摂取カロリー推移" note={`目標 ${s.kcal}kcal`} empty={points.every((p) => p.kcal === null)}>
        {barChart('kcal', '#c6ff3d', 'kcal', s.kcal)}
      </Chart>
      <Chart title="タンパク質摂取量" note={`目標 ${s.protein}g`} empty={points.every((p) => p.protein === null)}>
        {barChart('protein', '#ff4d6d', 'g', s.protein)}
      </Chart>

      <Card>
        <Title>トレーニング実施率</Title>
        <p className="text-[34px] font-extrabold tnum leading-none">
          {stats.rate}
          <span className="text-sub text-lg">%</span>
        </p>
        <p className="text-sub text-[12px] mt-2 tnum">
          予定日 {stats.scheduled}日中 {stats.trainedScheduled}日実施（期間内の実施合計 {stats.trainedAll}日）
        </p>
        <div className="h-44 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#222" vertical={false} />
              <XAxis dataKey="label" interval={interval} {...axis} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} width={42} {...axis} />
              <Tooltip {...tip} formatter={(v) => [`${v}%`, 'セット達成率']} cursor={{ fill: '#ffffff10' }} />
              <Bar dataKey="train" fill="#ff4d6d" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sub text-[11px] mt-1">棒＝その日の完了セット達成率（予定日で未実施は0%）</p>
      </Card>
    </div>
  )
}

function Chart({ title, note, empty, children }: { title: string; note?: string | null; empty: boolean; children: ReactNode }) {
  return (
    <Card>
      <Title right={note ? <span className="text-[12px] text-sub tnum">{note}</span> : undefined}>{title}</Title>
      {empty ? (
        <p className="text-sub text-sm text-center py-10">この期間のデータがありません</p>
      ) : (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
