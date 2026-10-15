import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { todayStr } from './dates'
import { defaultData, newId, sanitize } from './validate'
import type { AppData, Exercise, TabKey, WorkoutEntry } from './types'

const KEY = 'bodyos:v1'

function load(): AppData {
  const today = todayStr()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return sanitize(JSON.parse(raw), today)
  } catch {
    /* 壊れていたら初期データで起動 */
  }
  return defaultData(today)
}

interface Ctx {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
  replaceAll: (d: AppData) => void
  today: string
  viewDate: string
  setViewDate: (d: string) => void
  tab: TabKey
  setTab: (t: TabKey) => void
  saveError: string | null
  saveExercise: (ex: Exercise) => void
  deleteExercise: (id: string) => void
}

const StoreCtx = createContext<Ctx | null>(null)

export function useStore(): Ctx {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('StoreProvider がありません')
  return c
}

function emptySets(ex: Exercise): WorkoutEntry['sets'] {
  return Array.from({ length: ex.sets }, () => ({ weight: null, reps: ex.reps, done: false }))
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)
  const [today, setToday] = useState(todayStr())
  const [viewDate, setViewDate] = useState(todayStr())
  const [tab, setTab] = useState<TabKey>('home')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
      setSaveError(null)
    } catch {
      setSaveError('保存できませんでした。ストレージの空き容量を確認し、設定からバックアップを取ってください')
    }
  }, [data])

  // 日付をまたいだら「今日」を更新
  useEffect(() => {
    const refresh = () => setToday(todayStr())
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), [])
  const replaceAll = useCallback((d: AppData) => setData(d), [])

  // 種目の変更は今日以降の保存済みログにだけ反映（過去の記録は残す）
  const saveExercise = useCallback(
    (ex: Exercise) =>
      setData((d) => {
        const exists = d.exercises.some((e) => e.id === ex.id)
        const exercises = exists ? d.exercises.map((e) => (e.id === ex.id ? ex : e)) : [...d.exercises, ex]
        const workouts = { ...d.workouts }
        const t = todayStr()
        for (const [date, log] of Object.entries(workouts)) {
          if (date < t) continue
          let entries = log.entries
          if (exists) {
            entries = entries.map((en) => {
              if (en.exerciseId !== ex.id) return en
              let sets = en.sets
              if (sets.length > ex.sets) {
                const keep = sets.slice(0, ex.sets)
                const extraDone = sets.slice(ex.sets).filter((s) => s.done)
                sets = [...keep, ...extraDone]
              } else if (sets.length < ex.sets) {
                sets = [...sets, ...emptySets({ ...ex, sets: ex.sets - sets.length })]
              }
              return { ...en, name: ex.name, sets }
            })
          } else {
            entries = [...entries, { exerciseId: ex.id, name: ex.name, sets: emptySets(ex) }]
          }
          workouts[date] = { ...log, entries }
        }
        return { ...d, exercises, workouts }
      }),
    [],
  )

  const deleteExercise = useCallback(
    (id: string) =>
      setData((d) => {
        const workouts = { ...d.workouts }
        const t = todayStr()
        for (const [date, log] of Object.entries(workouts)) {
          if (date < t) continue
          workouts[date] = {
            ...log,
            entries: log.entries.filter((en) => en.exerciseId !== id || en.sets.some((s) => s.done)),
          }
        }
        return { ...d, exercises: d.exercises.filter((e) => e.id !== id), workouts }
      }),
    [],
  )

  const value = useMemo<Ctx>(
    () => ({ data, update, replaceAll, today, viewDate, setViewDate, tab, setTab, saveError, saveExercise, deleteExercise }),
    [data, update, replaceAll, today, viewDate, tab, saveError, saveExercise, deleteExercise],
  )
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export { newId }
