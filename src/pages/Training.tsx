import { useEffect, useState } from 'react'
import DateBar from '../components/DateBar'
import { Bar, Btn, Card, Empty, Field, Sheet, Title } from '../components/ui'
import { getWorkoutLog, isTrainingDay, progressOf } from '../lib/calc'
import { useStore } from '../lib/store'
import type { AppData, Exercise, SetEntry, WorkoutLog } from '../lib/types'
import { newId, parseNum } from '../lib/validate'

function lastWeightFor(data: AppData, exerciseId: string, name: string, before: string): number | null {
  const dates = Object.keys(data.workouts)
    .filter((d) => d < before)
    .sort()
    .reverse()
  for (const d of dates) {
    const en = data.workouts[d].entries.find((e) => e.exerciseId === exerciseId || e.name === name)
    const w = en?.sets.find((s) => s.done && s.weight !== null)?.weight
    if (w !== undefined && w !== null) return w
  }
  return null
}

export default function Training() {
  const { data, update, viewDate, saveExercise, deleteExercise } = useStore()
  const log = getWorkoutLog(data, viewDate)
  const prog = progressOf(log)
  const trainDay = isTrainingDay(data.settings, viewDate)
  const [manage, setManage] = useState(false)

  const mutate = (fn: (l: WorkoutLog) => WorkoutLog) =>
    update((d) => ({ ...d, workouts: { ...d.workouts, [viewDate]: fn(getWorkoutLog(d, viewDate)) } }))

  const patchSet = (ei: number, si: number, patch: Partial<SetEntry>) =>
    mutate((l) => ({
      ...l,
      entries: l.entries.map((en, i) =>
        i !== ei ? en : { ...en, sets: en.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) },
      ),
    }))

  const addSet = (ei: number) =>
    mutate((l) => ({
      ...l,
      entries: l.entries.map((en, i) => {
        if (i !== ei) return en
        const last = en.sets[en.sets.length - 1]
        return { ...en, sets: [...en.sets, { weight: last?.weight ?? null, reps: last?.reps ?? 10, done: false }] }
      }),
    }))

  const removeSet = (ei: number) =>
    mutate((l) => ({
      ...l,
      entries: l.entries.map((en, i) => (i !== ei || en.sets.length <= 1 ? en : { ...en, sets: en.sets.slice(0, -1) })),
    }))

  const resetDay = () => {
    if (!window.confirm('この日のトレーニング記録をリセットしますか？')) return
    update((d) => {
      const workouts = { ...d.workouts }
      delete workouts[viewDate]
      return { ...d, workouts }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">トレーニング</h1>
        <button onClick={() => setManage(true)} className="text-accent text-[14px] font-semibold min-h-[44px] px-2">
          種目を管理
        </button>
      </div>
      <DateBar />

      <Card>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[13px] text-sub">{trainDay ? 'トレーニング予定日' : '予定外の日（休養日）'}</span>
          <span className="tnum text-[13px]">
            <b className="text-[22px]">{prog.done}</b>
            <span className="text-sub"> / {prog.total} セット</span>
          </span>
        </div>
        <Bar value={prog.total ? prog.done / prog.total : 0} color="#ff4d6d" />
      </Card>

      {log.entries.length === 0 && <Empty>種目がありません。「種目を管理」から追加してください</Empty>}

      {log.entries.map((en, ei) => {
        const last = lastWeightFor(data, en.exerciseId, en.name, viewDate)
        const doneN = en.sets.filter((s) => s.done).length
        return (
          <Card key={en.exerciseId + ei}>
            <Title right={<span className="tnum text-[12px] text-sub">{doneN}/{en.sets.length}</span>}>{en.name}</Title>
            <div className="grid grid-cols-[28px_1fr_1fr_52px] gap-x-2 gap-y-2 items-center text-[11px] text-sub mb-1">
              <span>SET</span>
              <span>重量(kg)</span>
              <span>回数</span>
              <span className="text-center">完了</span>
            </div>
            <div className="space-y-2">
              {en.sets.map((st, si) => (
                <SetRow
                  key={`${viewDate}-${en.exerciseId}-${si}`}
                  index={si}
                  set={st}
                  hint={last}
                  onChange={(p) => patchSet(ei, si, p)}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => addSet(ei)} className="flex-1 min-h-[44px] rounded-xl bg-card2 border border-line text-[13px]">
                ＋ セット追加
              </button>
              <button
                onClick={() => removeSet(ei)}
                disabled={en.sets.length <= 1}
                className="flex-1 min-h-[44px] rounded-xl bg-card2 border border-line text-[13px] disabled:opacity-40"
              >
                － セット削除
              </button>
            </div>
          </Card>
        )
      })}

      {data.workouts[viewDate] && (
        <Btn variant="ghost" onClick={resetDay} className="w-full">
          この日の記録をリセット
        </Btn>
      )}

      <ExerciseManager
        open={manage}
        onClose={() => setManage(false)}
        exercises={data.exercises}
        onSave={saveExercise}
        onDelete={deleteExercise}
      />
    </div>
  )
}

function SetRow({ index, set, hint, onChange }: { index: number; set: SetEntry; hint: number | null; onChange: (p: Partial<SetEntry>) => void }) {
  const [w, setW] = useState(set.weight?.toString() ?? '')
  const [r, setR] = useState(set.reps?.toString() ?? '')
  useEffect(() => {
    setW(set.weight?.toString() ?? '')
    setR(set.reps?.toString() ?? '')
  }, [set.weight, set.reps])

  const wp = parseNum(w, '重量', 0, 1000)
  const rp = parseNum(r, '回数', 0, 999)
  const box = (bad: boolean) =>
    `w-full min-h-[48px] rounded-xl bg-card2 border px-3 outline-none tnum text-center ${bad ? 'border-[#ff453a]' : 'border-line focus:border-accent'}`

  return (
    <div className="grid grid-cols-[28px_1fr_1fr_52px] gap-x-2 items-center">
      <span className="text-sub tnum text-[13px]">{index + 1}</span>
      <input
        inputMode="decimal"
        value={w}
        placeholder={hint !== null ? String(hint) : '0'}
        aria-label={`セット${index + 1}の重量`}
        onChange={(e) => {
          setW(e.target.value)
          const p = parseNum(e.target.value, '重量', 0, 1000)
          if (!p.error) onChange({ weight: p.value })
        }}
        className={box(!!wp.error)}
      />
      <input
        inputMode="numeric"
        value={r}
        placeholder="10"
        aria-label={`セット${index + 1}の回数`}
        onChange={(e) => {
          setR(e.target.value)
          const p = parseNum(e.target.value, '回数', 0, 999)
          if (!p.error) onChange({ reps: p.value === null ? null : Math.round(p.value) })
        }}
        className={box(!!rp.error)}
      />
      <button
        role="checkbox"
        aria-checked={set.done}
        aria-label={`セット${index + 1}を完了`}
        onClick={() => onChange({ done: !set.done })}
        className={`min-h-[48px] rounded-xl border text-xl font-bold ${set.done ? 'bg-accent border-accent text-black' : 'bg-card2 border-line text-transparent'}`}
      >
        ✓
      </button>
    </div>
  )
}

function ExerciseManager({
  open,
  onClose,
  exercises,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  onSave: (e: Exercise) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState<{ id: string | null; name: string; sets: string; reps: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = () => {
    if (!editing) return
    const errs: Record<string, string> = {}
    const name = editing.name.trim()
    if (!name) errs.name = '種目名を入力してください'
    else if (name.length > 50) errs.name = '種目名は50文字以内にしてください'
    const s = parseNum(editing.sets, 'セット数', 1, 20, { required: true })
    const r = parseNum(editing.reps, '回数', 1, 200, { required: true })
    if (s.error) errs.sets = s.error
    if (r.error) errs.reps = r.error
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSave({ id: editing.id ?? newId(), name, sets: Math.round(s.value!), reps: Math.round(r.value!) })
    setEditing(null)
  }

  return (
    <Sheet open={open} onClose={() => { setEditing(null); onClose() }} title="種目の管理">
      {editing ? (
        <div className="space-y-4">
          <Field label="種目名" type="text" inputMode="text" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} error={errors.name} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="セット数" inputMode="numeric" value={editing.sets} onChange={(v) => setEditing({ ...editing, sets: v })} error={errors.sets} />
            <Field label="目標回数" inputMode="numeric" value={editing.reps} onChange={(v) => setEditing({ ...editing, reps: v })} error={errors.reps} />
          </div>
          <p className="text-[12px] text-sub">変更は今日以降のトレーニングに反映されます。過去の記録は変わりません。</p>
          <div className="flex gap-3">
            <Btn onClick={save} className="flex-1">保存する</Btn>
            <Btn variant="ghost" onClick={() => setEditing(null)}>戻る</Btn>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-line/60">
            {exercises.map((e) => (
              <li key={e.id} className="flex items-center gap-2 py-2">
                <button
                  onClick={() => { setErrors({}); setEditing({ id: e.id, name: e.name, sets: String(e.sets), reps: String(e.reps) }) }}
                  className="flex-1 text-left min-h-[48px]"
                >
                  <p className="text-[15px] font-medium">{e.name}</p>
                  <p className="text-[12px] text-sub tnum">{e.reps}回 × {e.sets}セット</p>
                </button>
                <button
                  onClick={() => window.confirm(`「${e.name}」を削除しますか？`) && onDelete(e.id)}
                  aria-label={`${e.name}を削除`}
                  className="w-11 h-11 text-sub"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
          {exercises.length === 0 && <Empty>種目がありません</Empty>}
          <Btn onClick={() => { setErrors({}); setEditing({ id: null, name: '', sets: '3', reps: '10' }) }} className="w-full">
            ＋ 種目を追加
          </Btn>
        </div>
      )}
    </Sheet>
  )
}
