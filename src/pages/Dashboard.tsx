import { Bar, Card, Ring, Title } from '../components/ui'
import {
  completion,
  getWorkoutLog,
  isTrainingDay,
  mealTotals,
  pct,
  PROGRAM_DAYS,
  programDay,
  progressOf,
  targets,
} from '../lib/calc'
import { formatJa } from '../lib/dates'
import { useStore } from '../lib/store'

export default function Dashboard() {
  const { data, today, setTab, setViewDate } = useStore()
  const s = data.settings
  const day = programDay(s, today)
  const clamped = Math.min(PROGRAM_DAYS, Math.max(0, day))
  const body = data.body[today]
  const tot = mealTotals(data.meals[today])
  const tg = targets(s)
  const log = getWorkoutLog(data, today)
  const prog = progressOf(log)
  const trainDay = isTrainingDay(s, today)
  const comp = completion(data, today)
  const compPct = comp.total ? comp.done / comp.total : 0

  const go = (t: 'body' | 'meal' | 'train') => {
    setViewDate(today)
    setTab(t)
  }

  const dayLabel = day < 1 ? '開始前' : day > PROGRAM_DAYS ? '完了' : `DAY ${String(day).padStart(2, '0')}`

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sub text-[13px]">{formatJa(today)}</p>
        <h1 className="text-[28px] font-extrabold tracking-tight">BODY OS</h1>
      </header>

      <Card className="flex items-center gap-5">
        <Ring value={clamped / PROGRAM_DAYS} size={128} stroke={13}>
          <span className="text-[26px] font-extrabold tnum leading-none">{Math.round((clamped / PROGRAM_DAYS) * 100)}%</span>
          <span className="text-[11px] text-sub mt-1">進捗</span>
        </Ring>
        <div>
          <p className="text-[34px] font-extrabold tnum leading-none">
            {dayLabel}
            {day >= 1 && day <= PROGRAM_DAYS && <span className="text-sub text-lg font-semibold"> / 60</span>}
          </p>
          <p className="text-sub text-[13px] mt-2">
            {day < 1 ? `開始まであと${1 - day}日` : day > PROGRAM_DAYS ? '60日プログラム達成' : `残り${PROGRAM_DAYS - day}日`}
          </p>
          <p className="text-[13px] mt-3">
            記録完了 <span className="text-accent font-bold tnum">{comp.done}/{comp.total}</span>
            <span className="text-sub"> （{Math.round(compPct * 100)}%）</span>
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => go('body')} className="text-left">
          <Card>
            <p className="text-sub text-[12px]">今日の体重</p>
            <p className="text-[30px] font-extrabold tnum mt-1">
              {body?.weight ?? '--'}
              <span className="text-sub text-sm font-medium"> kg</span>
            </p>
            <p className="text-sub text-[11px] mt-1 tnum">目標 {s.targetWeight}kg</p>
          </Card>
        </button>
        <button onClick={() => go('body')} className="text-left">
          <Card>
            <p className="text-sub text-[12px]">今日の体脂肪率</p>
            <p className="text-[30px] font-extrabold tnum mt-1">
              {body?.bodyFat ?? '--'}
              <span className="text-sub text-sm font-medium"> %</span>
            </p>
            <p className="text-sub text-[11px] mt-1 tnum">目標 {s.targetBodyFat}%</p>
          </Card>
        </button>
      </div>

      <button onClick={() => go('meal')} className="block w-full text-left">
        <Card>
          <Title>今日の食事</Title>
          <div className="space-y-4">
            <Macro label="摂取カロリー" value={tot.kcal} target={tg.kcal} unit="kcal" color="#c6ff3d" />
            <Macro label="タンパク質" value={tot.protein} target={tg.protein} unit="g" color="#ff4d6d" />
            <Macro label="脂質" value={tot.fat} target={tg.fat} unit="g" color="#ffb340" />
          </div>
        </Card>
      </button>

      <button onClick={() => go('train')} className="block w-full text-left">
        <Card className="flex items-center gap-4">
          <Ring value={prog.total ? prog.done / prog.total : 0} size={72} stroke={9} color="#ff4d6d">
            <span className="text-sm font-bold tnum">
              {prog.done}/{prog.total}
            </span>
          </Ring>
          <div>
            <p className="text-sub text-[12px]">今日の筋トレ</p>
            <p className="text-lg font-bold">
              {!trainDay && prog.done === 0 ? '休養日' : prog.total > 0 && prog.done >= prog.total ? 'コンプリート' : prog.done > 0 ? '進行中' : '未実施'}
            </p>
            <p className="text-sub text-[12px]">{trainDay ? 'トレーニング予定日' : '予定外の日'} ・ 完了セット {prog.done}/{prog.total}</p>
          </div>
        </Card>
      </button>
    </div>
  )
}

function Macro({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[13px]">{label}</span>
        <span className="tnum text-[13px]">
          <b className="text-[17px]">{value}</b>
          <span className="text-sub"> / {target}{unit} ・ {pct(value, target)}%</span>
        </span>
      </div>
      <Bar value={target > 0 ? value / target : 0} color={color} />
    </div>
  )
}
