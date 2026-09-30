# 食関連教科書ライブラリ

職関連をはじめ、食に関するテーマを**ジャンル別**に学べる教科書です。  
表示形式は [果物インストラクター認定試験対策テキスト](../果物インストラクター/) と同じ **Web 教科書アプリ**（目次・章構成・復習リスト・タグ付き）です。

---

## 公開 URL（いつでも閲覧）

- **本番（Vercel）**: https://food-text.vercel.app  
- **食育ジャンル直接**: https://food-text.vercel.app/#shokuiku  
- **GitHub**: https://github.com/sonotarenrakusenyo-gif/food-text  

スマホのブラウザで開き、ホーム画面に追加するとアプリのように使えます（果物インストラクター版と同じ使い方）。

---

## 使い方

1. 上記 URL を開く（ローカルなら **`index.html`** をダブルクリックでも可）
2. トップで **カテゴリ → ジャンル**（例：職関連 → 食育）を選ぶ
3. 章・項目を読み、覚えたいところは **「☆ 復習リストに追加」**
4. 右上 **「⭐ 復習リスト」** で横断復習（ジャンル混在可）

### URL 例（ブックマーク用）

| 画面 | ハッシュ |
|------|----------|
| ジャンル一覧 | `index.html` |
| 食育教科書トップ | `index.html#shokuiku` |
| 第 1 章 | `index.html#shokuiku/ch1` |
| 項目 | `index.html#shokuiku/ch1/ch1-1` |

---

## カテゴリ・ジャンル

### 職関連

| ジャンル | Web 教科書 | Markdown（原稿・印刷用） |
|----------|------------|---------------------------|
| **食育** | [index.html#shokuiku](./index.html#shokuiku) | [グルメフェス MC 食育ハンドブック](./職関連/食育/グルメフェスMC食育ハンドブック.md) |

---

## ファイル構成

```
フードテキスト/
├── index.html                 … 教科書アプリ（入口）
├── css/style.css              … 教科書風スタイル
├── js/
│   ├── library.js             … カテゴリ・ジャンル定義
│   ├── content-shokuiku.js    … 食育コンテンツ（章・項目データ）
│   ├── app.js                 … ナビ・復習リスト
│   └── furigana.js            … 専門用語ふりがな
├── config/genres.json         … ジャンル登録（Markdown パス連携）
└── 職関連/食育/               … Markdown 原稿
```

---

## ジャンルを追加するとき

1. `js/content-<ジャンルID>.js` に `TEXTBOOK` データを追加（`content-shokuiku.js` をコピーして編集）
2. `js/library.js` の `genres` と `TEXTBOOKS` に登録
3. `index.html` で新しい `content-*.js` を読み込む
4. `config/genres.json` とこの README の表を更新

---

## ローカルサーバー（任意）

```bash
cd "/Users/ruka/Documents/フードテキスト"
python3 -m http.server 8080
```

ブラウザで http://localhost:8080 を開いてください。
