# 無駄遣いストッパー家計簿（household-account-book）

無駄遣いを防ぐための家計簿アプリです。アプリを開いた瞬間に「今月の無駄遣い」と「あと使える金額」が分かることを目指しています。

- iPhoneのSafariで開いて「ホーム画面に追加」して使うWebアプリ（PWA）です。
- データはスマホのブラウザ内に保存します。ログインやサーバーは使いません。
- 仕様と計画は [docs/mvp-spec.md](docs/mvp-spec.md) にまとめています。

公開URL：https://dasuke0117.github.io/household-account-book/

## 使っている技術

- Vite + React + TypeScript
- vite-plugin-pwa（PWA化）
- GitHub Pages（GitHub Actions で自動公開）

## 開発の始め方

[Node.js](https://nodejs.org/)（LTS版）をインストールしておいてください。

```sh
# 依存パッケージのインストール（最初の1回と、package.json が変わったとき）
npm install

# 開発サーバーを起動（http://localhost:5173/household-account-book/ で開く）
npm run dev
```

### iPhoneから試すとき

PCとiPhoneを同じWi-Fiにつないで、次のコマンドで起動します。

```sh
npm run dev -- --host
```

ターミナルに表示される `Network: http://192.168.x.x:5173/household-account-book/` のURLを、iPhoneのSafariで開きます。

- Windowsのファイアウォールの確認画面が出たら「プライベートネットワーク」を許可してください。
- 開発サーバーでは、ホーム画面に追加したときのPWAの動き（オフライン対応など）は確認できません。PWAとしての動きは、公開後のURLで確認します。

### その他のコマンド

```sh
npm run build    # 公開用にビルド（dist フォルダに出力）
npm run preview  # ビルドした結果をローカルで確認
npm run lint     # コードのチェック
```

## GitHub Pages の初回設定

最初に1回だけ、GitHubで次の設定をします。

1. GitHubでこのリポジトリを開く
2. **Settings** → 左メニューの **Pages** を開く
3. **Build and deployment** の **Source** を「**GitHub Actions**」にする

あとは `main` ブランチにpushするたびに、GitHub Actions が自動でビルドして公開します。進み具合はリポジトリの **Actions** タブで確認できます。

## iPhoneでホーム画面に追加する

1. iPhoneの **Safari** で公開URL（https://dasuke0117.github.io/household-account-book/）を開く
2. 画面下の **共有ボタン**（四角から上向きの矢印が出ているアイコン）をタップ
3. メニューを下にスクロールして「**ホーム画面に追加**」をタップ
4. 名前が「家計簿」になっていることを確認して、右上の「**追加**」をタップ

ホーム画面の「家計簿」アイコンから開くと、Safariのアドレスバーがない全画面のアプリとして使えます。

- Safari以外のブラウザ（Chromeなど）からは、うまく追加できないことがあります。
- 新しいバージョンを公開したときは、アプリを開き直すと自動で更新されます。

## ブランチの使い方

- `main`：公開用。pushするとGitHub Pagesに公開されます。
- `develop`：開発用。機能ができたらここにまとめます。
- `feature/*`：作業用。develop から作って、develop にプルリクエストを出します。
