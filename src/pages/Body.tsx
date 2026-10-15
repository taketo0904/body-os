import { useEffect, useState } from 'react'
import DateBar from '../components/DateBar'
import { Btn, Card, Empty, Field, Notice, Title } from '../components/ui'
import { formatJa, shortMD } from '../lib/dates'
import { useStore } from '../lib/store'
import { parseNum } from '../lib/validate'

export default function Body() {
  const { data, update, viewDate, setViewDate } = useStore()
  const rec = data.body[viewDate]
  const [weight, setWeight] = useState('')
  const [fat, setFat] = useState('')
  const [sleep, setSleep] = useState('')
  const [memo, setMemo] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setWeight(rec?.weight?.toString() ?? '')
    setFat(rec?.bodyFat?.toString() ?? '')
    setSleep(rec?.sleep?.toString() ?? '')
    setMemo(rec?.memo ?? '')
    setErrors({})
  }, [viewDate, rec])

  useEffect(() => setSaved(false), [viewDate])

  const save = () => {
    const w = parseNum(weight, '体重', 20, 300)
    const f = parseNum(fat, '体脂肪率', 1, 70)
    const sl = parseNum(sleep, '睡眠時間', 0, 24)
    const errs: Record<string, string> = {}
    if (w.error) errs.weight = w.error
    if (f.error) errs.fat = f.error
    if (sl.error) errs.sleep = sl.error
    if (w.value === null && f.value === null && sl.value === null && memo.trim() === '' && !Object.keys(errs).length) {
      errs.form = '1つ以上入力してください'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    update((d) => ({
      ...d,
      body: { ...d.body, [viewDate]: { date: viewDate, weight: w.value, bodyFat: f.value, sleep: sl.value, memo: memo.trim().slice(0, 1000) } },
    }))
    setSaved(true)
  }

  const remove = (date: string) => {
    if (!window.confirm(`${formatJa(date)}の身体記録を削除しますか？`)) return
    update((d) => {
      const body = { ...d.body }
      delete body[date]
      return { ...d, body }
    })
  }

  const history = Object.values(data.body).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">身体記録</h1>
      <DateBar />
      <Card className="space-y-4">
        <Title>{rec ? '記録を編集' : '新しい記録'}</Title>
        <div className="grid grid-cols-2 gap-3">
          <Field label="体重" unit="kg" value={weight} onChange={setWeight} error={errors.weight} placeholder="65.0" />
          <Field label="体脂肪率" unit="%" value={fat} onChange={setFat} error={errors.fat} placeholder="18.0" />
        </div>
        <Field label="睡眠時間" unit="時間" value={sleep} onChange={setSleep} error={errors.sleep} placeholder="7.5" />
        <label className="block">
          <span className="block text-[12px] text-sub mb-1.5">メモ</span>
          <textarea
            value={memo}
            maxLength={1000}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="w-full rounded-2xl bg-card2 border border-line focus:border-accent outline-none p-4"
            placeholder="体調・気づいたこと"
          />
        </label>
        {errors.form && <Notice tone="error">{errors.form}</Notice>}
        {saved && <Notice tone="ok">保存しました</Notice>}
        <div className="flex gap-3">
          <Btn onClick={save} className="flex-1">
            {rec ? '更新する' : '保存する'}
          </Btn>
          {rec && (
            <Btn variant="danger" onClick={() => remove(viewDate)}>
              削除
            </Btn>
          )}
        </div>
      </Card>

      <Card>
        <Title>これまでの記録</Title>
        {history.length === 0 ? (
          <Empty>まだ記録がありません</Empty>
        ) : (
          <ul className="divide-y divide-line/60">
            {history.slice(0, 60).map((h) => (
              <li key={h.date} className="py-3 flex items-center gap-3">
                <button onClick={() => setViewDate(h.date)} className="flex-1 text-left min-h-[44px]">
                  <p className="text-[13px] text-sub">{shortMD(h.date)}（{formatJa(h.date).slice(-2, -1)}）</p>
                  <p className="tnum text-[15px]">
                    {h.weight !== null ? `${h.weight}kg` : '--'} ・ {h.bodyFat !== null ? `${h.bodyFat}%` : '--'} ・ 睡眠 {h.sleep !== null ? `${h.sleep}h` : '--'}
                  </p>
                  {h.memo && <p className="text-[12px] text-sub truncate">{h.memo}</p>}
                </button>
                <button onClick={() => remove(h.date)} aria-label="削除" className="w-11 h-11 text-sub">
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
