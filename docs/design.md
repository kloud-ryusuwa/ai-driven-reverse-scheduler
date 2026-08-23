# システム設計

## 概要

本ドキュメントは、AI-Driven Reverse Scheduler のアプリケーション構成と、各ファイル・ディレクトリの役割を定義する。本システムは Next.js（App Router）をベースとしたフロントエンド中心の構成であり、バックエンドは Next.js API Routes と外部 AI API（さくらの AI Engine）を組み合わせて実現する。

## ディレクトリ構成

```
app/main/
├── app/                    # Next.js App Router のルートディレクトリ
│   ├── api/generate/       # AI による WBS 生成 API
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # トップページ（フェーズ制御）
│   └── design.md           # （旧設計メモ）
├── components/             # React コンポーネント
│   ├── IntakePhase.tsx     # 入力フォーム
│   ├── PlanningPhase.tsx   # 計画プレビュー
│   ├── MonitoringPhase.tsx # タスク進捗監視
│   └── RightPanel.tsx      # AI サポート・トリアージパネル
├── types/                  # TypeScript 型定義
│   └── task.ts             # タスク関連の型
├── utils/                  # 汎用ユーティリティ
│   └── calculations.ts     # バッファ計算・ステータス判定
├── public/                 # 静的アセット
├── next.config.ts          # Next.js 設定
├── package.json            # 依存定義
└── tsconfig.json           # TypeScript 設定
```

## ファイル構成と役割

### app/page.tsx

アプリケーションのメインページ。全体の状態管理と画面遷移を担当する。

- フェーズ（`intake` / `planning` / `monitoring`）の制御
- タスクリスト（`tasks`）の管理
- 右パネルの表示制御（`panelMode` / `selectedTask`）
- `generateWBS` 関数で AI API を呼び出し、プランを生成
- `handleApprove` で承認された計画をタスクリストに追加

### app/layout.tsx

Next.js のルートレイアウト。全ページ共通の HTML 構造とフォント設定を定義する。

### app/api/generate/route.ts

Next.js API Route。さくらの AI Engine（OpenAI 互換 API）にプロンプトを送信し、WBS と工数見積もりを生成する。

- 入力: `taskName`, `deadline`
- 出力: `title`, `totalEstimatedHours`, `bufferHours`, `effectiveTotalHours`, `subtasks`
- プロンプト内で 20% バッファの付与を指示

### components/IntakePhase.tsx

プロジェクト初期設定（Intake）画面のコンポーネント。

- 最終目標（タスク名）と絶対期日（Deadline）の入力フォーム
- 入力完了後、`onNext` コールバックで `page.tsx` の `generateWBS` を呼び出す

### components/PlanningPhase.tsx

AI が生成した計画をプレビュー表示するコンポーネント。

- 想定工数、バッファ、実質総工数の表示
- サブタスク一覧の表示
- 「承認」または「修正してやり直す」の選択

### components/MonitoringPhase.tsx

タスク進捗とバッファ状況を監視するコンポーネント。

- タスク一覧の表示
- バッファ残量に応じたステータス判定（Green / Yellow / Red）
- 進捗バーの表示
- Yellow / Red 状態のタスクに対して AI 相談ボタンを表示

### components/RightPanel.tsx

選択されたタスクに対する AI サポート・トリアージパネル。

- Yellow モード: 重要度（Must / Should / Could）の入力と AI 相談
- Red モード: 要件削減（Drop / 簡略化）提案の表示と承認
- 変更履歴（タイムライン）の表示領域を持つ

### types/task.ts

アプリケーション全体で使用する型定義。

- `SubTask`: サブタスクの構造
- `TaskStatus`: タスク状態（`red` / `yellow` / `green`）
- `MainTask`: メインタスク（プロジェクト）の構造

### utils/calculations.ts

バッファ計算とステータス判定のユーティリティ。

- `getStatusFromBuffer`: バッファ残量から Green / Yellow / Red を判定
- `calculateCurrentBuffer`: 残日数と残工数から最新バッファを計算（現状は仮実装）

## データフロー

1. ユーザーが `IntakePhase` で目標と期日を入力
2. `page.tsx` が `app/api/generate/route.ts` を呼び出し、AI が WBS を生成
3. `PlanningPhase` で生成結果をプレビューし、ユーザーが承認
4. 承認された計画が `tasks` 状態に追加され、`MonitoringPhase` に遷移
5. ユーザーがサブタスクの完了チェックを更新
6. バッファ状況に応じて Yellow / Red 判定
7. Yellow / Red 時に `RightPanel` が開き、AI サポートまたはトリアージ提案を受け取る

## 今後の拡張

- 永続化層（SQLite / PostgreSQL）の導入
- 外部カレンダー連携
- 依存関係の可視化
- ユーザー評価（Evaluations）のフィードバックループ
