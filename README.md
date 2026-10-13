# 演習ログ｜物理・英語・化学

iPhone向けの、インストールできる演習管理PWAです。以前の「数学91」とは**別のアプリ**です。

## 機能

- 物理・英語・化学の3科目を切り替え
- 各番号に1周目・2周目の独立したチェックボックス
- 各番号に120文字までの一言メモ（入力内容を自動保存）
- 3科目合計／科目別進捗、1周目・2周目、メモ件数
- 科目ごとの項目数を **1〜300** 問で変更可能（初期値は各20問）
- 番号やメモの検索、未完了・2周完了の絞り込み
- ライト／ダークモード、オフライン利用、ホーム画面アイコン
- JSONによるバックアップ・復元

保存には `localStorage` を使用します。数学91とは別のキーを使っているため、同じiPhoneで両方使えます。※サイトデータ削除や端末変更で消える可能性があるため、バックアップを取ってください。

## iPhoneからGitHub Pagesに公開する

**既存の `math91` リポジトリにはアップロードしないこと。** 数学91を残したまま、新しく作ります。

1. GitHubで `study-three` などの名前の新規 **Public** リポジトリを作成。
2. ZIPをiPhoneの「ファイル」アプリで解凍。
3. GitHubの新リポジトリを開き、`Add file → Upload files` で `index.html`、`app.js`、`styles.css`、`sw.js`、`manifest.webmanifest`、`README.md` をアップロードし、`Commit changes` を押す。
4. `icons` フォルダを作成し、その中へ `icon-192.png`、`icon-512.png`、`apple-touch-icon.png`、`favicon-32.png` をアップロード。
   - GitHubの `Add file → Create new file` でファイル名に `icons/.gitkeep` と入力して保存するとフォルダができます。
   - `icons` フォルダの**中にいる状態**で `Upload files` を行ってください。
5. リポジトリの `Settings → Pages` を開き、`Deploy from a branch` → `main` → `/(root)` → `Save`。
6. 公開URL（例 `https://ユーザー名.github.io/study-three/`）をiPhoneの **Safari** で開く。
7. Safariの共有メニューから「ホーム画面に追加」を選ぶ。

GitHub Pagesは `https://` を提供するためService Workerとホーム画面の起動に対応します。

## ファイル構成

```
study-three/
├── index.html
├── app.js
├── styles.css
├── manifest.webmanifest
├── sw.js
├── README.md
├── .nojekyll
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── apple-touch-icon.png
    └── favicon-32.png
```

## 補足

- 初期の問題数は各20問です。アプリの「問題数を変更」からそれぞれ独立して変更できます。
- 問題数を減らしても範囲外のチェック・メモは破棄せず、また増やせば再表示できます。
- バックアップはこのアプリ専用です。数学91のバックアップとは混ぜないでください。
- アプリのURLが異なっても、同じiPhoneのSafariでサイトデータを消すと記録が消える場合があります。
- GitHub Pages上の公開サイトにはソースコードが公開されますが、入力したチェックやメモはGitHubにアップロードされません。
