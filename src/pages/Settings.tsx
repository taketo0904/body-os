import { useRef, useState } from 'react'
import { Btn, Card, Field, Notice, Title } from '../components/ui'
import { targetCarb } from '../lib/calc'
import { isDateStr, WEEKDAYS } from '../lib/dates'
import { useStore } from '../lib/store'
import type { AppData } from '../lib/types'
import { defaultData, parseBackup, parseNum } from '../lib/validate'

export default function Settings() {
  const { data, update, replaceAll, today } = useStore()
  const s = data.settings
  const [start, setStart] = useState(s.startDate)
  const [tw, setTw] = useState(String(s.targetWeight))
  const [tf, setTf] = useState(String(s.targetBodyFat))
  const [kcal, setKcal] = useState(String(s.kcal))
  const [pro, setPro] = useState(String(s.protein))
  const [fat, setFat] = useState(String(s.fat))
  const [days, setDays] = useState<number[]>(s.trainingDays)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [paste, setPaste] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const carb = targetCarb(Number(kcal) || 0, Number(pro) || 0, Number(fat) || 0)

  const save = () => {
    const errs: Record<string, string> = {}
    if (!isDateStr(start)) errs.start = '開始日を選択してください'
    const a = parseNum(tw, '目標体重', 20, 300, { required: true })
    const b = parseNum(tf, '目標体脂肪率', 1, 70, { required: true })
    const c = parseNum(kcal, 'カロリー目標', 500, 10000, { required: true })
    const p = parseNum(pro, 'タンパク質目標', 0, 1000, { required: true })
    const f = parseNum(fat, '脂質目標', 0, 1000, { required: true })
    if (a.error) errs.tw = a.error
    if (b.error) errs.tf = b.error
    if (c.error) errs.kcal = c.error
    if (p.error) errs.pro = p.error
    if (f.error) errs.fat = f.error
    if (!errs.kcal && !errs.pro && !errs.fat && (p.value! * 4 + f.value! * 9 > c.value!)) {
      errs.kcal = 'PとFのカロリーが目標カロリーを超えています'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    update((d) => ({
      ...d,
      settings: {
        startDate: start,
        targetWeight: a.value!,
        targetBodyFat: b.value!,
        kcal: c.value!,
        protein: p.value!,
        fat: f.value!,
        trainingDays: [...days].sort(),
      },
    }))
    setMsg({ tone: 'ok', text: '設定を保存しました' })
  }

  const toggleDay = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))

  const backupText = () => JSON.stringify({ app: 'body-os', exportedAt: new Date().toISOString(), data }, null, 2)

  const exportJson = () => {
    const blob = new Blob([backupText()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `body-os-backup-${today}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    setMsg({ tone: 'ok', text: 'バックアップファイルを書き出しました' })
  }

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(backupText())
      setMsg({ tone: 'ok', text: 'バックアップをクリップボードにコピーしました' })
    } catch {
      setMsg({ tone: 'error', text: 'コピーできませんでした。ファイルの書き出しを使ってください' })
    }
  }

  const applyImport = (text: string) => {
    let next: AppData
    try {
      next = parseBackup(text, today)
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof Error ? e.message : '読み込みに失敗しました' })
      return
    }
    const n = Object.keys(next.body).length + Object.keys(next.meals).length + Object.keys(next.workouts).length
    if (!window.confirm(`現在のデータをすべて置き換えて復元します（記録 ${n} 件）。よろしいですか？`)) return
    replaceAll(next)
    setStart(next.settings.startDate)
    setTw(String(next.settings.targetWeight))
    setTf(String(next.settings.targetBodyFat))
    setKcal(String(next.settings.kcal))
    setPro(String(next.settings.protein))
    setFat(String(next.settings.fat))
    setDays(next.settings.trainingDays)
    setPaste('')
    setMsg({ tone: 'ok', text: 'データを復元しました' })
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 20 * 1024 * 1024) return setMsg({ tone: 'error', text: 'ファイルが大きすぎます' })
    applyImport(await file.text())
    if (fileRef.current) fileRef.current.value = ''
  }

  const wipe = () => {
    if (!window.confirm('すべての記録と設定を削除します。元に戻せません。バックアップは取りましたか？')) return
    if (!window.confirm('本当に削除しますか？')) return
    replaceAll(defaultData(today))
    setMsg({ tone: 'ok', text: 'すべてのデータを削除しました' })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">設定</h1>

      <Card className="space-y-4">
        <Title>60日プログラム</Title>
        <Field label="開始日" type="date" value={start} onChange={setStart} error={errors.start} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="目標体重" unit="kg" value={tw} onChange={setTw} error={errors.tw} />
          <Field label="目標体脂肪率" unit="%" value={tf} onChange={setTf} error={errors.tf} />
        </div>
      </Card>

      <Card className="space-y-4">
        <Title>栄養目標（1日）</Title>
        <Field label="カロリー" unit="kcal" inputMode="numeric" value={kcal} onChange={setKcal} error={errors.kcal} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="タンパク質" unit="g" value={pro} onChange={setPro} error={errors.pro} />
          <Field label="脂質" unit="g" value={fat} onChange={setFat} error={errors.fat} />
        </div>
        <p className="text-[13px] text-sub">
          炭水化物（自動計算）： <b className="text-white tnum">{carb}g</b>
        </p>
      </Card>

      <Card>
        <Title>トレーニング曜日</Title>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((w, i) => (
            <button
              key={w}
              onClick={() => toggleDay(i)}
              aria-pressed={days.includes(i)}
              className={`min-h-[48px] rounded-xl text-[15px] font-semibold border ${days.includes(i) ? 'bg-accent text-black border-accent' : 'bg-card2 border-line text-sub'}`}
            >
              {w}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-sub mt-2">週{days.length}回</p>
      </Card>

      <Btn onClick={save} className="w-full">
        設定を保存
      </Btn>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <Card className="space-y-3">
        <Title>バックアップ（JSON）</Title>
        <p className="text-[12px] text-sub leading-relaxed">データはこの端末のブラウザ内に保存されます。Safari/Chrome のデータ消去や機種変更に備えて、定期的に書き出してください。</p>
        <div className="grid grid-cols-2 gap-3">
          <Btn onClick={exportJson}>書き出し</Btn>
          <Btn variant="ghost" onClick={copyJson}>コピー</Btn>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Btn variant="ghost" onClick={() => fileRef.current?.click()} className="w-full">
          ファイルから復元
        </Btn>
        <label className="block">
          <span className="block text-[12px] text-sub mb-1.5">または JSON を貼り付けて復元</span>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={3}
            className="w-full rounded-2xl bg-card2 border border-line focus:border-accent outline-none p-3 text-[13px] font-mono"
            placeholder='{"app":"body-os", ...}'
          />
        </label>
        <Btn variant="ghost" disabled={!paste.trim()} onClick={() => applyImport(paste)} className="w-full">
          貼り付けた内容で復元
        </Btn>
      </Card>

      <Card>
        <Title>データの削除</Title>
        <Btn variant="danger" onClick={wipe} className="w-full">
          すべてのデータを削除
        </Btn>
      </Card>

      <p className="text-center text-[11px] text-sub pb-2">BODY OS v1.0</p>
    </div>
  )
}
