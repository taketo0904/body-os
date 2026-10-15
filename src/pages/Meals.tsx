import { useState } from 'react'
import DateBar from '../components/DateBar'
import { Bar, Btn, Card, Empty, Field, Notice, Sheet, Title } from '../components/ui'
import { freeMealsInWeek, mealTotals, pct, round1, targets } from '../lib/calc'
import { useStore } from '../lib/store'
import { MEAL_SLOTS } from '../lib/types'
import type { Meal, MealSlot } from '../lib/types'
import { newId, parseNum } from '../lib/validate'

interface Form {
  id: string | null
  slot: MealSlot
  name: string
  kcal: string
  protein: string
  fat: string
  carb: string
  free: boolean
}

const blank = (slot: MealSlot): Form => ({ id: null, slot, name: '', kcal: '', protein: '', fat: '', carb: '', free: false })

export default function Meals() {
  const { data, update, viewDate } = useStore()
  const meals = data.meals[viewDate] ?? []
  const tot = mealTotals(meals)
  const tg = targets(data.settings)
  const [form, setForm] = useState<Form | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const freeCount = freeMealsInWeek(data, viewDate)

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f))

  const autoCarb = (f: Form): number | null => {
    const k = Number(f.kcal)
    const p = Number(f.protein || 0)
    const fa = Number(f.fat || 0)
    if (!f.kcal.trim() || ![k, p, fa].every(Number.isFinite)) return null
    return Math.max(0, round1((k - p * 4 - fa * 9) / 4))
  }

  const open = (m?: Meal, slot: MealSlot = 'breakfast') => {
    setErrors({})
    setForm(
      m
        ? { id: m.id, slot: m.slot, name: m.name, kcal: String(m.kcal), protein: String(m.protein), fat: String(m.fat), carb: String(m.carb), free: m.free }
        : blank(slot),
    )
  }

  const save = () => {
    if (!form) return
    const errs: Record<string, string> = {}
    const name = form.name.trim()
    if (!name) errs.name = '食品名を入力してください'
    if (name.length > 100) errs.name = '食品名は100文字以内にしてください'
    const k = parseNum(form.kcal, 'カロリー', 0, 10000, { required: true })
    const p = parseNum(form.protein, 'タンパク質', 0, 1000)
    const f = parseNum(form.fat, '脂質', 0, 1000)
    const c = parseNum(form.carb, '炭水化物', 0, 2000)
    if (k.error) errs.kcal = k.error
    if (p.error) errs.protein = p.error
    if (f.error) errs.fat = f.error
    if (c.error) errs.carb = c.error
    setErrors(errs)
    if (Object.keys(errs).length) return
    const meal: Meal = {
      id: form.id ?? newId(),
      slot: form.slot,
      name,
      kcal: k.value ?? 0,
      protein: p.value ?? 0,
      fat: f.value ?? 0,
      carb: c.value ?? autoCarb(form) ?? 0,
      free: form.free,
    }
    update((d) => {
      const list = d.meals[viewDate] ?? []
      const next = form.id ? list.map((m) => (m.id === form.id ? meal : m)) : [...list, meal]
      return { ...d, meals: { ...d.meals, [viewDate]: next } }
    })
    setForm(null)
  }

  const remove = (id: string) => {
    if (!window.confirm('この食事を削除しますか？')) return
    update((d) => {
      const next = (d.meals[viewDate] ?? []).filter((m) => m.id !== id)
      const meals = { ...d.meals }
      if (next.length) meals[viewDate] = next
      else delete meals[viewDate]
      return { ...d, meals }
    })
    setForm(null)
  }

  const rows: { label: string; v: number; t: number; unit: string; color: string }[] = [
    { label: 'カロリー', v: tot.kcal, t: tg.kcal, unit: 'kcal', color: '#c6ff3d' },
    { label: 'タンパク質', v: tot.protein, t: tg.protein, unit: 'g', color: '#ff4d6d' },
    { label: '脂質', v: tot.fat, t: tg.fat, unit: 'g', color: '#ffb340' },
    { label: '炭水化物（自動計算）', v: tot.carb, t: tg.carb, unit: 'g', color: '#4cc9f0' },
  ]

  const preview = form ? autoCarb(form) : null

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">食事管理</h1>
      <DateBar />

      <Card>
        <Title>目標に対する達成率</Title>
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[13px]">{r.label}</span>
                <span className="tnum text-[13px]">
                  <b className="text-[17px]">{r.v}</b>
                  <span className="text-sub"> / {r.t}{r.unit} ・ {pct(r.v, r.t)}%</span>
                </span>
              </div>
              <Bar value={r.t > 0 ? r.v / r.t : 0} color={r.color} />
            </div>
          ))}
        </div>
        <p className={`text-[12px] mt-4 ${freeCount > 1 ? 'text-[#ff6b61]' : 'text-sub'}`}>
          今週の自由食：{freeCount} / 1回{freeCount > 1 ? '（上限を超えています）' : ''}
        </p>
      </Card>

      {MEAL_SLOTS.map((slot) => {
        const list = meals.filter((m) => m.slot === slot.key)
        const sub = mealTotals(list)
        return (
          <Card key={slot.key}>
            <Title
              right={
                <button onClick={() => open(undefined, slot.key)} className="text-accent text-[14px] font-semibold min-h-[40px] px-2">
                  ＋ 追加
                </button>
              }
            >
              {slot.label}
              {list.length > 0 && <span className="ml-2 text-sub font-normal tnum">{sub.kcal}kcal</span>}
            </Title>
            {list.length === 0 ? (
              <p className="text-sub text-[13px] pb-1">未登録</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {list.map((m) => (
                  <li key={m.id}>
                    <button onClick={() => open(m)} className="w-full text-left py-3 min-h-[56px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-medium">
                          {m.name}
                          {m.free && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-fat/20 text-fat">自由食</span>}
                        </span>
                        <span className="tnum text-[15px] shrink-0">{m.kcal}kcal</span>
                      </div>
                      <p className="text-[12px] text-sub tnum mt-0.5">
                        P {m.protein}g ・ F {m.fat}g ・ C {m.carb}g
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )
      })}

      {meals.length === 0 && <Empty>この日の食事はまだ登録されていません</Empty>}

      <Sheet open={form !== null} onClose={() => setForm(null)} title={form?.id ? '食事を編集' : '食事を追加'}>
        {form && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {MEAL_SLOTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => set({ slot: s.key })}
                  className={`min-h-[44px] rounded-xl text-[14px] font-semibold border ${form.slot === s.key ? 'bg-accent text-black border-accent' : 'bg-card2 border-line'}`}
                >
                  {s.label.replace('食', '')}
                </button>
              ))}
            </div>
            <Field label="食品名" type="text" inputMode="text" value={form.name} onChange={(v) => set({ name: v })} error={errors.name} placeholder="例：鶏むね肉のグリル" />
            <Field label="カロリー" unit="kcal" value={form.kcal} onChange={(v) => set({ kcal: v })} error={errors.kcal} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="タンパク質" unit="g" value={form.protein} onChange={(v) => set({ protein: v })} error={errors.protein} />
              <Field label="脂質" unit="g" value={form.fat} onChange={(v) => set({ fat: v })} error={errors.fat} />
              <Field label="炭水化物" unit="g" value={form.carb} onChange={(v) => set({ carb: v })} error={errors.carb} placeholder={preview !== null ? String(preview) : '自動'} />
            </div>
            <p className="text-[12px] text-sub -mt-2">炭水化物は空欄なら カロリー − P×4 − F×9 から自動計算します</p>
            <label className="flex items-center gap-3 min-h-[48px]">
              <input type="checkbox" checked={form.free} onChange={(e) => set({ free: e.target.checked })} className="w-6 h-6 accent-[#c6ff3d]" />
              <span className="text-[15px]">自由食（週1回）として記録</span>
            </label>
            {form.free && freeCount >= 1 && !data.meals[viewDate]?.some((m) => m.id === form.id && m.free) && (
              <Notice>今週はすでに自由食があります。週1回を超えますが保存はできます。</Notice>
            )}
            <div className="flex gap-3">
              <Btn onClick={save} className="flex-1">
                保存する
              </Btn>
              {form.id && (
                <Btn variant="danger" onClick={() => remove(form.id!)}>
                  削除
                </Btn>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
