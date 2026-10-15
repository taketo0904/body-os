export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'breakfast', label: '朝食' },
  { key: 'lunch', label: '昼食' },
  { key: 'dinner', label: '夕食' },
  { key: 'snack', label: '間食' },
]

export interface Settings {
  startDate: string
  targetWeight: number
  targetBodyFat: number
  kcal: number
  protein: number
  fat: number
  /** 0=日 … 6=土 */
  trainingDays: number[]
}

export interface BodyRecord {
  date: string
  weight: number | null
  bodyFat: number | null
  sleep: number | null
  memo: string
}

export interface Meal {
  id: string
  slot: MealSlot
  name: string
  kcal: number
  protein: number
  fat: number
  carb: number
  /** 週1回の自由食 */
  free: boolean
}

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
}

export interface SetEntry {
  weight: number | null
  reps: number | null
  done: boolean
}

export interface WorkoutEntry {
  exerciseId: string
  name: string
  sets: SetEntry[]
}

export interface WorkoutLog {
  date: string
  entries: WorkoutEntry[]
}

export interface AppData {
  version: 1
  settings: Settings
  body: Record<string, BodyRecord>
  meals: Record<string, Meal[]>
  workouts: Record<string, WorkoutLog>
  exercises: Exercise[]
}

export type TabKey = 'home' | 'body' | 'meal' | 'train' | 'analysis' | 'calendar' | 'settings'
