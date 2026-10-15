# BODY OS

60日間のボディメイクを管理する個人用 Web アプリ（iPhone / Chrome 向け PWA）。
React + TypeScript + Vite + Tailwind CSS + Recharts。データはブラウザの localStorage に保存されます。

## 機能

- ダッシュボード：DAY 表示、進捗率、体重・体脂肪、PFC 達成率、筋トレ状況、記録完了率
- 身体記録：体重・体脂肪率・睡眠・メモ（日付ごとに更新・編集・削除）
- 食事管理：朝・昼・夜・間食、PFC、炭水化物の自動計算、週1回の自由食
- トレーニング：セットごとの重量・回数・完了チェック、種目の追加・編集・削除
- 分析：体重・体脂肪・カロリー・タンパク質・トレ実施率（7 / 30 / 60 日）
- カレンダー：記録の有無を月表示、過去日を選んで記録
- 設定：開始日・目標・PFC・トレ曜日、JSON エクスポート／インポート

## 開発

```bash
npm install
npm run dev        # http://localhost:5173/body-os/
```

## ビルド

```bash
npm run build      # dist/ に出力
npm run preview    # ビルド結果を確認
```

## GitHub Pages で公開する

1. GitHub で `body-os` という名前のリポジトリを作成する（別名にする場合は後述）
2. このフォルダを push する
   ```bash
   git remote add origin https://github.com/<ユーザー名>/body-os.git
   git push -u origin main
   ```
3. GitHub のリポジトリで **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定する
4. `main` に push するたび `.github/workflows/deploy.yml` が自動でビルド・公開する
5. 公開 URL：`https://<ユーザー名>.github.io/body-os/`

リポジトリ名を変える場合：Actions 側は自動で追従します。ローカルのビルドで合わせたいときは `vite.config.ts` の既定値 `/body-os/` を変更するか、`VITE_BASE=/新しい名前/ npm run build` を使います。

## iPhone で使う

Chrome で公開 URL を開き、共有メニューの「ホーム画面に追加」を選ぶとアプリのように起動できます。

## データについて

- 記録は端末のブラウザ内にだけ保存され、サーバーには送信されません
- ブラウザのデータ消去や機種変更に備え、設定画面から定期的に JSON をバックアップしてください
- 復元は現在のデータをすべて置き換えます
