# 動画モザイク編集アプリ

ブラウザ上で動画にモザイクとテキストを追加できるWebアプリケーション

## 主な機能

- ✅ 動画のアップロードとプレビュー
- ✅ モザイク領域の追加と編集
- ✅ テキストオーバーレイの追加と編集
- ✅ タイムライン上での時間調整
- ✅ Canvas APIによる動画処理
- ✅ WebM形式での書き出し

## 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **ビルドツール**: Vite 5
- **動画処理**: Canvas API + MediaRecorder API
- **状態管理**: React Context API (useReducer)
- **スタイル**: CSS Modules

## アーキテクチャ

### ディレクトリ構成

```
src/
├── components/          # UIコンポーネント
│   ├── VideoPlayer/    # 動画プレーヤー
│   ├── RegionSelector/ # Canvas上で領域選択
│   ├── Timeline/       # タイムラインとトラック
│   ├── MosaicManager/  # モザイク領域の詳細設定
│   ├── TextOverlayManager/ # テキストの詳細設定
│   └── ExportPanel/    # 書き出しUI
├── context/            # 状態管理
│   └── VideoEditorContext.tsx
├── hooks/              # カスタムフック
│   ├── useCanvasVideoProcessor.ts
│   └── useVideoMetadata.ts
├── utils/              # ユーティリティ
│   ├── canvasVideoProcessing.ts # コア処理エンジン
│   ├── canvasBlur.ts   # ぼかし効果
│   ├── canvasText.ts   # テキスト描画
│   ├── audioExtraction.ts # 音声抽出
│   └── mediaRecorderHelper.ts # 録画管理
└── types/              # 型定義
    ├── mosaic.ts
    ├── textOverlay.ts
    └── video.ts
```

### データフロー

```
動画アップロード
  ↓
VideoEditorContext (グローバル状態)
  ↓
├── VideoPlayer (プレビュー)
├── RegionSelector (Canvas上で領域選択)
├── Timeline (時間調整)
├── MosaicManager (詳細設定)
├── TextOverlayManager (詳細設定)
└── ExportPanel (書き出し)
      ↓
canvasVideoProcessing (動画処理エンジン)
  ↓
├── フレーム抽出
├── ぼかし適用 (canvasBlur)
├── テキスト描画 (canvasText)
├── 音声抽出 (audioExtraction)
└── MediaRecorder (録画)
      ↓
WebM動画出力
```

### 動画処理の仕組み

1. **フレーム抽出**: Video要素から`canvas.drawImage()`でフレームを取得
2. **モザイク適用**: Canvas Filter API (`ctx.filter = 'blur(20px)'`) でぼかし
3. **テキスト描画**: Canvas 2D API (`ctx.fillText()`) でテキストを描画
4. **録画**: `canvas.captureStream()` + `MediaRecorder` でリアルタイム録画
5. **音声保持**: Web Audio APIで元動画から音声トラックを抽出して結合

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## 使い方

### 基本的な流れ

1. 動画ファイルをアップロード
2. VideoPlayer上でドラッグしてモザイク領域を作成
3. テキストを追加してクリックで配置
4. Timelineで表示時間を調整
5. 「動画を書き出す」をクリック

### モザイクの追加

- **新規作成**: VideoPlayer上でドラッグ
- **選択**: モザイク領域をクリック
- **サイズ変更**: 選択中にドラッグ
- **時間調整**: Timelineのハンドルをドラッグ

### テキストの追加

- **新規作成**: TextOverlayManagerで「追加」をクリック
- **位置変更**: テキストを選択してVideoPlayerをクリック
- **内容編集**: TextOverlayManagerのテキストエリアで編集
- **スタイル変更**: フォントサイズ・色を調整

## 開発者向け情報

### 状態管理

Context APIとuseReducerパターンで状態を一元管理しています。すべての状態は`VideoEditorContext`に集約され、アクションベースで更新されます。

### 主要な型定義

```typescript
interface MosaicRegion {
  id: string;
  x: number;          // 0-1の正規化座標
  y: number;
  width: number;
  height: number;
  startTime: number;  // 秒単位
  endTime: number;
  blurStrength?: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;          // 0-1の正規化座標
  y: number;
  startTime: number;
  endTime: number;
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
}

interface VideoMetadata {
  duration: number;   // 秒単位
  width: number;      // ピクセル
  height: number;     // ピクセル
  fps: number;        // フレームレート
  size: number;       // バイト
}
```

### パフォーマンス最適化

- フレームレートに基づく効率的な処理
- 正規化座標（0-1）で解像度非依存
- Canvas `willReadFrequently` オプションの使用
- MediaRecorderによるリアルタイム録画

### ブラウザ互換性

- **Canvas API**: すべてのモダンブラウザ
- **MediaRecorder**: Chrome 47+, Firefox 25+, Safari 14.1+
- **Canvas filters**: Chrome 52+, Firefox 49+, Safari 9.1+
- **canvas.captureStream**: Chrome 51+, Firefox 43+, Safari 11+

推奨ブラウザ: Google Chrome, Firefox, Safari (最新版)

## 主要なファイル解説

### `src/utils/canvasVideoProcessing.ts`
動画処理のコアエンジン。フレームごとにエフェクトを適用してMediaRecorderで録画します。

### `src/utils/canvasBlur.ts`
Canvas Filter APIを使用したぼかし効果の実装。正規化座標からピクセル座標への変換も担当。

### `src/utils/canvasText.ts`
Canvas 2D APIでテキストを描画。背景ボックスやカスタムカラーをサポート。

### `src/context/VideoEditorContext.tsx`
グローバル状態管理。動画ファイル、モザイク領域、テキストオーバーレイ、再生状態などを管理。

### `src/components/RegionSelector/RegionSelector.tsx`
Canvas上でのマウスイベントを処理し、モザイク領域の作成・選択・編集を可能にします。

## ライセンス

MIT
