# 動画モザイク編集アプリ

MP4動画にモザイクをかけるWebアプリケーションです。ブラウザ内で完結するため、サーバーへのアップロードは不要です。

## 機能

- 📹 MP4動画のアップロード（ドラッグ&ドロップ対応）
- 🎯 キャンバス上でのモザイク領域の選択
- 📊 複数のモザイク領域を管理
- ⏱️ タイムラインで各モザイクの時間範囲を指定
- 💾 編集済み動画の書き出し

## 技術スタック

- **React 18** - UIフレームワーク
- **TypeScript** - 型安全性
- **Vite** - 高速ビルドツール
- **FFmpeg.wasm** - ブラウザ内動画処理

## セットアップ

### 必要要件

- Node.js 16以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

開発サーバーが起動したら、ブラウザで `http://localhost:5173` を開いてください。

### ビルド

```bash
# 本番環境用にビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## 使い方

### 1. 動画のアップロード

- 画面上部のドラッグ&ドロップエリアにMP4動画をドロップするか、クリックしてファイルを選択します
- 最大100MBまでの動画に対応しています

### 2. モザイク領域の選択

- 動画プレイヤー上でマウスをドラッグして、モザイクをかけたい領域を選択します
- 複数の領域を追加できます
- 既存の領域をクリックすると選択状態になります

### 3. 時間範囲の調整

- タイムライン上で各モザイク領域の開始/終了時刻を調整できます
- ハンドルをドラッグして時間範囲を変更します
- タイムライン上をクリックすると、その時刻にシークします

### 4. モザイク領域の管理

- 右側のパネルで、すべてのモザイク領域を確認できます
- 各領域の詳細（位置、サイズ、時間範囲）が表示されます
- 「削除」ボタンで不要な領域を削除できます

### 5. 動画の書き出し

- 「モザイク動画を書き出す」ボタンをクリックします
- FFmpegがブラウザ内で動画を処理します（数分かかる場合があります）
- 処理完了後、「ダウンロード」ボタンで動画を保存できます

## プロジェクト構造

```
src/
├── components/           # UIコンポーネント
│   ├── VideoUploader/    # 動画アップロード
│   ├── VideoPlayer/      # 動画再生
│   ├── RegionSelector/   # モザイク領域選択
│   ├── Timeline/         # タイムライン
│   ├── MosaicManager/    # モザイク領域管理
│   └── ExportPanel/      # 書き出しパネル
├── context/              # グローバル状態管理
│   └── VideoEditorContext.tsx
├── hooks/                # カスタムフック
│   ├── useFFmpeg.ts      # FFmpeg.wasm統合
│   └── useVideoMetadata.ts
├── utils/                # ユーティリティ
│   ├── ffmpegCommands.ts # FFmpegコマンド生成
│   ├── videoProcessing.ts
│   └── timeFormatting.ts
├── types/                # TypeScript型定義
│   ├── mosaic.ts
│   └── video.ts
├── App.tsx               # メインアプリ
└── main.tsx              # エントリーポイント
```

## 重要な注意事項

### ブラウザ互換性

FFmpeg.wasmは`SharedArrayBuffer`を使用するため、以下のHTTPヘッダーが必要です：

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Vite開発サーバーではこれらのヘッダーが自動的に設定されます。

### 本番環境デプロイ

本番環境でデプロイする場合、サーバー側でこれらのヘッダーを設定する必要があります。

#### Netlify

`netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

#### Vercel

`vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        }
      ]
    }
  ]
}
```

### パフォーマンス

- ブラウザ内での動画処理は時間がかかります（数分程度）
- 大きな動画ファイル（100MB以上）は避けてください
- Chrome または Edge ブラウザを推奨します

## トラブルシューティング

### FFmpegが読み込めない

- ブラウザがSharedArrayBufferをサポートしているか確認してください
- HTTPSまたはlocalhostで実行されているか確認してください
- ブラウザのコンソールでエラーメッセージを確認してください

### 動画処理が遅い

- 動画の解像度を下げてみてください
- モザイク領域の数を減らしてみてください
- より高性能なマシンを使用してください

### メモリ不足エラー

- より小さい動画ファイルを使用してください
- ブラウザのタブを閉じてメモリを解放してください

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
# video-edit-app
