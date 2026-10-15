import { addDays, diffDays, parseDate, weekStart } from './dates'
import type { AppData, Meal, Settings, WorkoutLog } from './types'

export const PROGRAM_DAYS = 60

export interface Macros {
  kcal: number
  protein: number
  fat: number
  carb: number
}

export const round1 = (n: number) => Math.round(n * 10) / 10

export function targetCarb(kcal: number, protein: number, fat: number): number {
  return Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
}

export function targets(s: Settings): Macros {
  return { kcal: s.kcal, protein: s.protein, fat: s.fat, carb: targetCarb(s.kcal, s.protein, s.fat) }
}

export function mealTotals(meals: Meal[] | undefined): Macros {
  const t: Macros = { kcal: 0, protein: 0, fat: 0, carb: 0 }
  for (const m of meals ?? []) {
    t.kcal += m.kcal
    t.protein += m.protein
    t.fat += m.fat
    t.carb += m.carb
  }
  return { kcal: Math.round(t.kcal), protein: round1(t.protein), fat: round1(t.fat), carb: round1(t.carb) }
}

export function pct(value: number, target: number): number {
  return target > 0 ? Math.round((value / target) * 100) : 0
}

/** 1始まりの日数。開始前は 0 以下 */
export function programDay(s: Settings, date: string): number {
  return diffDays(date, s.startDate) + 1
}

export function isTrainingDay(s: Settings, date: string): boolean {
  return s.trainingDays.includes(parseDate(date).getDay())
}

export function progressOf(log: WorkoutLog | undefined): { done: number; total: number } {
  let done = 0
  let total = 0
  for (const e of log?.entries ?? []) {
    for (const st of e.sets) {
      total += 1
      if (st.done) done += 1
    }
  }
  return { done, total }
}

/** 保存済みログ、なければ種目テンプレートから作った仮ログ（未保存） */
export function getWorkoutLog(data: AppData, date: string): WorkoutLog {
  const stored = data.workouts[date]
  if (stored) return stored
  return {
    date,
    entries: data.exercises.map((ex) => ({
      exerciseId: ex.id,
      name: ex.name,
      sets: Array.from({ length: ex.sets }, () => ({ weight: null, reps: ex.reps, done: false })),
    })),
  }
}

export function hasBody(data: AppData, date: string): boolean {
  const b = data.body[date]
  return !!b && (b.weight !== null || b.bodyFat !== null || b.sleep !== null || b.memo !== '')
}

export function hasMeal(data: AppData, date: string): boolean {
  return (data.meals[date]?.length ?? 0) > 0
}

export function trainedDay(data: AppData, date: string): boolean {
  return progressOf(data.workouts[date]).done > 0
}

export type TrainState = 'none' | 'partial' | 'done'

export function trainState(data: AppData, date: string): TrainState {
  const { done, total } = progressOf(data.workouts[date])
  if (done === 0) return 'none'
  return done >= total ? 'done' : 'partial'
}

/** 今日の記録完了率（身体・食事・トレ日ならトレ） */
export function completion(data: AppData, date: string): { done: number; total: number } {
  const items = [hasBody(data, date), hasMeal(data, date)]
  if (isTrainingDay(data.settings, date)) items.push(trainState(data, date) === 'done')
  return { done: items.filter(Boolean).length, total: items.length }
}

/** 日付を含む週（月〜日）の自由食の数 */
export function freeMealsInWeek(data: AppData, date: string): number {
  const start = weekStart(date)
  let n = 0
  for (let i = 0; i < 7; i++) {
    n += (data.meals[addDays(start, i)] ?? []).filter((m) => m.free).length
  }
  return n
}
