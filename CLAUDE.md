# CLAUDE.md

無駄遣いを防ぐための家計簿Webアプリ（PWA）。詳しい仕様と計画は [docs/mvp-spec.md](docs/mvp-spec.md) を参照。

## 進め方
- 説明・コードコメント・コミットメッセージはすべて日本語で書く。
- 各ステップの終わりにユウに確認を取ってから次のステップへ進む。
- push の前には必ずユウに確認する。
- `npm run build` が通ることを確認してからコミットする。

## 技術構成
- Vite + React + TypeScript、`vite-plugin-pwa` でPWA化。
- iPhoneのSafariで「ホーム画面に追加」して使う。ネイティブiOSアプリ（Swift/Xcode）は使わない（Macがないため）。
- データはブラウザ内（IndexedDB または localStorage）に保存する。ログイン・サーバーは使わない。
- 公開は GitHub Pages。`vite.config.ts` の `base` は `/household-account-book/`。main へのpushで GitHub Actions がデプロイする。
- テストは Vitest。計算ロジックは純粋な関数に分けてテストを書く。

## 仕様上の大事な決まり
- 評価は「必要／微妙／無駄」の3段階。
- 固定費カテゴリ（通信費、ローン、電気・水道代、貯金、サブスク）は評価を自動で「必要」にし、入力時の評価選択を省く。あとから変更できる。
- 「あと使える金額」は、月の予算から固定費を引いた「自由に使えるお金」を基準に計算する。
- 入力は片手で3タップ（金額 → カテゴリ → 評価）で終わることを最優先にする。
- レイアウトはスマホ向け（最大幅480px程度）で、iPhoneのセーフエリア（`env(safe-area-inset-*)`）を考慮する。

## ブランチ
- `main`：公開用（push すると GitHub Pages にデプロイされる）
- `develop`：開発の統合用
- 作業は `feature/*` ブランチで行い、develop へPRを出す。
