import { isDateStr } from './dates'
import { MEAL_SLOTS } from './types'
import type { AppData, BodyRecord, Exercise, Meal, MealSlot, SetEntry, Settings, WorkoutLog } from './types'

/** 範囲チェック。空欄は null（任意項目）。範囲外・数値でない場合は例外メッセージ文字列を返す */
export function parseNum(
  raw: string,
  label: string,
  min: number,
  max: number,
  opts: { required?: boolean } = {},
): { value: number | null; error?: string } {
  const t = raw.trim().replace(/,/g, '')
  if (t === '') return opts.required ? { value: null, error: `${label}を入力してください` } : { value: null }
  const n = Number(t)
  if (!Number.isFinite(n)) return { value: null, error: `${label}は数値で入力してください` }
  if (n < min || n > max) return { value: null, error: `${label}は${min}〜${max}の範囲で入力してください` }
  return { value: n }
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const DEFAULT_EXERCISES = (): Exercise[] => [
  { id: newId(), name: 'チェストプレス', sets: 3, reps: 10 },
  { id: newId(), name: 'プレスダウン', sets: 3, reps: 10 },
  { id: newId(), name: 'ラットプルダウン', sets: 3, reps: 10 },
  { id: newId(), name: 'ケーブルカール', sets: 3, reps: 10 },
  { id: newId(), name: 'レッグプレス', sets: 3, reps: 10 },
]

export function defaultSettings(today: string): Settings {
  return {
    startDate: today,
    targetWeight: 65,
    targetBodyFat: 15,
    kcal: 2000,
    protein: 130,
    fat: 30,
    trainingDays: [1, 3, 5],
  }
}

export function defaultData(today: string): AppData {
  return {
    version: 1,
    settings: defaultSettings(today),
    body: {},
    meals: {},
    workouts: {},
    exercises: DEFAULT_EXERCISES(),
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function num(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null
}

function numOr(v: unknown, min: number, max: number, fallback: number): number {
  return num(v, min, max) ?? fallback
}

/** 外部から来た JSON（localStorage・インポート）を安全な形に整える。壊れた要素は捨てる */
export function sanitize(raw: unknown, today: string): AppData {
  if (!isObj(raw)) throw new Error('BODY OS のバックアップ形式ではありません')
  const base = defaultData(today)

  const s = isObj(raw.settings) ? raw.settings : {}
  const days = Array.isArray(s.trainingDays)
    ? Array.from(new Set(s.trainingDays.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))).sort()
    : base.settings.trainingDays
  const settings: Settings = {
    startDate: isDateStr(s.startDate) ? s.startDate : base.settings.startDate,
    targetWeight: numOr(s.targetWeight, 20, 300, base.settings.targetWeight),
    targetBodyFat: numOr(s.targetBodyFat, 1, 70, base.settings.targetBodyFat),
    kcal: numOr(s.kcal, 500, 10000, base.settings.kcal),
    protein: numOr(s.protein, 0, 1000, base.settings.protein),
    fat: numOr(s.fat, 0, 1000, base.settings.fat),
    trainingDays: days,
  }

  const body: Record<string, BodyRecord> = {}
  if (isObj(raw.body)) {
    for (const [date, v] of Object.entries(raw.body)) {
      if (!isDateStr(date) || !isObj(v)) continue
      body[date] = {
        date,
        weight: num(v.weight, 20, 300),
        bodyFat: num(v.bodyFat, 1, 70),
        sleep: num(v.sleep, 0, 24),
        memo: typeof v.memo === 'string' ? v.memo.slice(0, 1000) : '',
      }
    }
  }

  const slots = MEAL_SLOTS.map((m) => m.key as string)
  const meals: Record<string, Meal[]> = {}
  if (isObj(raw.meals)) {
    for (const [date, list] of Object.entries(raw.meals)) {
      if (!isDateStr(date) || !Array.isArray(list)) continue
      const out: Meal[] = []
      for (const m of list) {
        if (!isObj(m) || typeof m.name !== 'string' || !slots.includes(m.slot as string)) continue
        out.push({
          id: typeof m.id === 'string' && m.id ? m.id : newId(),
          slot: m.slot as MealSlot,
          name: m.name.slice(0, 100),
          kcal: numOr(m.kcal, 0, 10000, 0),
          protein: numOr(m.protein, 0, 1000, 0),
          fat: numOr(m.fat, 0, 1000, 0),
          carb: numOr(m.carb, 0, 2000, 0),
          free: m.free === true,
        })
      }
      if (out.length) meals[date] = out
    }
  }

  const exercises: Exercise[] = []
  if (Array.isArray(raw.exercises)) {
    for (const e of raw.exercises) {
      if (!isObj(e) || typeof e.name !== 'string' || !e.name.trim()) continue
      exercises.push({
        id: typeof e.id === 'string' && e.id ? e.id : newId(),
        name: e.name.slice(0, 50),
        sets: Math.round(numOr(e.sets, 1, 20, 3)),
        reps: Math.round(numOr(e.reps, 1, 200, 10)),
      })
    }
  }

  const workouts: Record<string, WorkoutLog> = {}
  if (isObj(raw.workouts)) {
    for (const [date, log] of Object.entries(raw.workouts)) {
      if (!isDateStr(date) || !isObj(log) || !Array.isArray(log.entries)) continue
      const entries: WorkoutLog['entries'] = []
      for (const en of log.entries) {
        if (!isObj(en) || typeof en.name !== 'string' || !Array.isArray(en.sets)) continue
        const sets: SetEntry[] = en.sets.filter(isObj).map((st) => ({
          weight: num(st.weight, 0, 1000),
          reps: num(st.reps, 0, 999),
          done: st.done === true,
        }))
        entries.push({ exerciseId: typeof en.exerciseId === 'string' ? en.exerciseId : newId(), name: en.name.slice(0, 50), sets })
      }
      workouts[date] = { date, entries }
    }
  }

  return {
    version: 1,
    settings,
    body,
    meals,
    workouts,
    exercises: Array.isArray(raw.exercises) ? exercises : base.exercises,
  }
}

export function parseBackup(text: string, today: string): AppData {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('JSONとして読み込めませんでした')
  }
  // エクスポートは { app, data } 形式。素の AppData も許容
  const payload = isObj(json) && isObj(json.data) ? json.data : json
  return sanitize(payload, today)
}
