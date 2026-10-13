# システム設計

## 概要

本ドキュメントは、AI-Driven Reverse Scheduler の現時点のアプリケーション構成と、各ファイル・ディレクトリの責務を定義する。

## 技術スタック

- アプリケーション: Next.js 16（App Router）
- UI: React 19 + MUI 7 + Tailwind 4
- 状態管理: インメモリストア（`globalThis.__ADS_STORE`）
- AI: OpenAI 互換 API（さくらの AI Engine / 環境変数で切り替え）
- テスト: Vitest + jsdom + Testing Library

## ディレクトリ構成

```
app/main/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── demo-settings/        # デモ用現在日時・モデル設定 API
│   │   ├── generate/             # AI による WBS 生成 API
│   │   ├── histories/[historyId]/evaluation/ # 評価 API
│   │   └── projects/[id]/...     # プロジェクト・サブタスク・履歴・トリアージ API
│   ├── globals.css               # グローバルスタイル
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # ダッシュボード
│   ├── projects/[id]/page.tsx    # プロジェクト詳細・監視画面
│   └── projects/new/             # 新規プロジェクト作成
├── components/                   # React コンポーネント
│   ├── AppShell.tsx              # ナビゲーションラップ
│   ├── AppThemeProvider.tsx      # MUI テーマプロバイダー
│   ├── DemoControls.tsx          # デモ用日時・モデル切り替え UI
│   ├── IntakePhase.tsx           # 入力フォーム
│   ├── MonitoringPhase.tsx       # タスク進捗監視
│   ├── NewProjectDialog.tsx      # 新規プロジェクト作成ダイアログ
│   ├── PlanningPhase.tsx         # AI 提案プレビュー
│   ├── ProjectCard.tsx           # ダッシュボード用プロジェクトカード
│   ├── ProjectGantt.tsx          # 逆算ガントチャート
│   └── RightPanel.tsx            # AI サポート・トリアージパネル
├── lib/                          # ドメイン・データアクセス層
│   ├── api.ts                    # API Route 用ユーティリティ
│   ├── buffer.ts                 # CCPM バッファ計算
│   ├── demo.ts                   # デモ用時計・モデル設定
│   ├── id.ts                     # ID 生成ユーティリティ
│   ├── pagination.ts             # ページネーション
│   ├── repositories/             # Repository 層
│   │   ├── inMemoryStore.ts      # インメモリ Repository 実装
│   │   └── types.ts              # Repository インターフェース
│   ├── store.ts                  # インメモリデータストア（Repository へのファサード）
│   └── types.ts                  # ドメイン型定義
├── tests/                        # 自動テスト
├── types/task.ts                 # UI 用レガシー型定義
├── utils/calculations.ts         # ステータス判定のみ
└── vitest.config.ts              # Vitest 設定
```

## 各層の責務

### UI / Pages

#### `app/page.tsx`

ダッシュボードページ。プロジェクト一覧を `/api/projects` から取得し、
`red → yellow → green` の優先度、期日順でソートして `ProjectCard` に渡す。

- 責務: 一覧取得、ローディング/エラー表示、ソート

#### `app/projects/new/page.tsx`

新規プロジェクト作成ページのエントリ。Suspense で `NewProjectPageContent` をラップする。

#### `app/projects/new/NewProjectPageContent.tsx`

目標・期日を入力し、`/api/generate` で WBS を生成、`/api/projects` で保存する。
フェーズ遷移（intake → planning → monitoring）を担当する。

- 責務: フォーム状態管理、AI 生成、承認後の永続化

#### `app/projects/[id]/page.tsx`

プロジェクト詳細・監視画面。プロジェクト、バッファ、履歴を並行取得し、
`MonitoringPhase` / `ProjectGantt` / `RightPanel` を制御する。

- 責務: 詳細データの並行取得、サブタスク完了/工数更新、トリアージ提案の適用、履歴追加

### Components

#### `AppShell.tsx`

アプリ全体のナビゲーションレイアウト。サイドバーと `DemoControls` を含む。

#### `AppThemeProvider.tsx`

MUI のテーマ設定と `CssBaseline` の提供。

#### `DemoControls.tsx`

デモ用の「現在日時」を変更し、バッファ計算やプロジェクト作成に影響を与える UI。
`/api/demo-settings` を読み書きする。

#### `IntakePhase.tsx`

プロジェクト初期設定（Intake）画面のコンポーネント。目標（タイトル）と絶対期日の入力フォームを提供する。

#### `PlanningPhase.tsx`

AI が生成した計画をプレビュー表示するコンポーネント。想定工数、バッファ、サブタスク一覧を表示し、承認または再生成を選択する。

#### `MonitoringPhase.tsx`

タスク進捗とバッファ状況を監視するコンポーネント。タスク一覧、進捗バー、バッファ状態に応じた AI 相談ボタンを表示する。

#### `ProjectCard.tsx`

ダッシュボードでのプロジェクトサマリーカード。ステータスチップ、バッファ率、期日を表示。

#### `ProjectGantt.tsx`

逆算ガントチャート。サブタスクを期日から逆算して表示し、所要時間のドラッグ変更に対応。

#### `RightPanel.tsx`

Yellow / Red 時の AI トリアージパネル。`mode` に応じて重要度入力または削減提案を表示し、履歴の追加と評価もここから行う。

### API Routes

#### `app/api/generate/route.ts`

OpenAI 互換 API にプロンプトを送信し、WBS（タイトル・工数・バッファ・サブタスク）を生成する。
`feedback` と `currentProposal` があれば修正指示として再生成する。

#### `app/api/projects/route.ts`

- `GET`: プロジェクト一覧（ページネーション・ステータスフィルタ付き）
- `POST`: 新規プロジェクト作成

#### `app/api/projects/[id]/route.ts`

- `GET`: プロジェクト詳細
- `PATCH`: プロジェクトのタイトル・期日更新（期日変更時は `initialRemainingTime` も再計算）
- `DELETE`: プロジェクト削除（紐づく履歴・評価も削除）

#### `app/api/projects/[id]/status/route.ts`

- `GET`: 現在のバッファ状態を計算して返す

#### `app/api/projects/[id]/subtasks/[subtaskId]/route.ts`

- `PATCH`: サブタスクのタイトル・工数・完了状態を更新
- `DELETE`: サブタスク削除

#### `app/api/projects/[id]/histories/route.ts`

- `GET`: プロジェクトに紐づく履歴一覧
- `POST`: 履歴追加

#### `app/api/histories/[historyId]/evaluation/route.ts`

- `GET`: 履歴に紐づく評価取得
- `POST`: 評価作成・更新（1 履歴につき 1 評価）

#### `app/api/projects/[id]/triage/route.ts`

Yellow / Red 状態に応じたトリアージ提案を生成する。

- `red`: 未完了サブタスクを大きい順に削減し、超過工数を解消する提案
- `yellow`: 最大工数のサブタスクを 50% 簡略化する提案

#### `app/api/demo-settings/route.ts`

- `GET`: デモ設定（現在日時、使用モデル、利用可能モデル一覧）を返す
- `PATCH`: デモ用現在日時・モデルを更新

### Domain / Lib

#### `lib/store.ts`

インメモリデータストア。`globalThis.__ADS_STORE` にプロジェクト・履歴・評価を保持する。
ID 生成もここで行う。

責務:
- `ProjectRecord` / `History` / `Evaluation` の CRUD
- `listProjects` のステータスフィルタ（計算済みサマリーを参照）
- カスケード削除（プロジェクト削除時に履歴・評価も削除）

注意: 現状ではデータアクセスと軽微なドメインロジック（`initialRemainingTime` の計算など）が混在している。

#### `lib/buffer.ts`

CCPM スタイルのバッファ計算を担当。

- `parseDeadline`: `YYYY-MM-DD` を UTC 0 時の `Date` に変換
- `hoursUntilDeadline`: 指定時点から期日までの残り時間（時間単位）
- `remainingHours`: 未完了サブタスクの工数合計
- `calculateBufferStatus`: バッファ率・ステータスを計算
  - `ePlan = initialTotalHours × 1.2`
  - `bInit = initialRemainingTime - ePlan`
  - `bCurrent = remainingTime - remainingHours × 1.2`
  - `stableBufferBase = max(bInit, ePlan × 0.2, 1)`
  - `bufferPercentage = min(100, round(bCurrent / stableBufferBase × 100))`
- `toProjectSummary`: `ProjectRecord` → サマリー
- `toProject`: `ProjectRecord` → 詳細

#### `lib/demo.ts`

デモ用の「現在日時」および AI モデル名を管理。
`globalThis.__ADRS_DEMO_SETTINGS` に保持し、テスト時には `updateDemoSettings` で時計を固定できる。

#### `lib/pagination.ts`

ページネーション用ユーティリティ。

- `parsePagination`: `?page=` / `?per_page=` をパース（`per_page` は最大 50、不正時は 20）
- `paginate`: 配列を指定ページにスライス

#### `lib/api.ts`

API Route 用の共通ユーティリティ。

- `jsonError`: エラーレスポンス生成
- `resolveParams`: Next.js 16 の動的 `params`（Promise）を解決
- `parseJson`: リクエストボディを JSON としてパース
- `isValidDateString` / `isNonEmptyString` / `isPositiveNumber` / `isIntegerInRange`: 入力検証ヘルパー

#### `utils/calculations.ts`

純粋なステータス判定関数のみを提供。

- `getStatusFromBuffer(percent)`: `>= 50 → green`, `> 0 → yellow`, それ以下 `red`
- `calculateCurrentBuffer`: 未実装の仮置き（`MainTask.bufferPercentage` をそのまま返す）

### Types

#### `lib/types.ts`

ドメイン層・UI 層双方で使用する正規の型定義（single source of truth）。

- `TaskStatus`
- `SubTask`, `ProjectSummary`, `Project`, `ProjectRecord`
- `MainTask`（UI 監視画面用の Project 派生ビュー）
- `AIProposal`, `AIProposalSubtask`
- `TriageProposal`
- `History`, `Evaluation`
- `BufferStatus`

#### `types/task.ts`

互換性維持のための再エクスポートレイヤー。

- `SubTask`, `TaskStatus`, `MainTask` を `@/lib/types` から再エクスポート
- 既存の `import ... from "@/types/task"` を壊さずに移行できるように存続
- 新規コードでは `@/lib/types` を直接参照すること

## データフロー

1. ユーザーが `NewProjectPageContent` で目標と期日を入力
2. `/api/generate` を呼び出し、AI が WBS を生成
3. `PlanningPhase` で生成結果をプレビューし、ユーザーが承認
4. `/api/projects` に POST し、`lib/store.ts` の `createProject` が `ProjectRecord` を作成
   - 作成時に `initialRemainingTime` = 作成時点から期日までの残り時間を記録
5. ダッシュボード `/` または詳細 `/projects/[id]` で `toProjectSummary` / `calculateBufferStatus` を使いステータスを算出
6. ユーザーがサブタスクの完了チェックや工数を更新
7. Yellow / Red 時に `RightPanel` が開き、`/api/projects/[id]/triage` から提案を受け取る
8. 提案適用時はサブタスクを更新し、履歴が追加される
9. 履歴に対して `/api/histories/[historyId]/evaluation` で評価を登録

## テスト

### 方針

- ユニットテスト中心
- `lib/` 以下の純粋関数・ストアを対象
- API Route はヘルパー関数を切り出して単体テスト
- コンポーネントテストは当面保留（リファクタリング後に追加予定）

### 実行

```bash
npm run test      # 単発
npm run test:watch # ウォッチ
npm run test:ui    # UI モード
```

### テストファイル

- `tests/utils/calculations.test.ts`
- `tests/lib/api.test.ts`
- `tests/lib/buffer.test.ts`
- `tests/lib/demo.test.ts`
- `tests/lib/pagination.test.ts`
- `tests/lib/store.test.ts`
- `tests/lib/store.history.test.ts`
- `tests/lib/store.evaluation.test.ts`
- `tests/repositories/inMemoryStore.test.ts`

## 開発日記（設計変遷）

### フェーズ制御

当初は `app/page.tsx` 単一ページ内で `intake` / `planning` / `monitoring` の 3 フェーズを状態遷移で制御していた。

- `intake`: `IntakePhase` で目標・期日を入力
- `planning`: `PlanningPhase` で AI 生成結果をプレビュー
- `monitoring`: `MonitoringPhase` でタスク進捗を監視

その後、新規プロジェクト作成は `/projects/new` ページに、プロジェクト監視は `/projects/[id]` ページに分離されたが、
`NewProjectPageContent` 内部では引き続き intake → planning → monitoring のフェーズ遷移を行っている。

### 型定義の統合

`lib/types.ts` と `types/task.ts` で `SubTask` / `TaskStatus` / `MainTask` が重複定義されていた。
統合により `lib/types.ts` を single source of truth とし、`types/task.ts` は互換性維持のための再エクスポートレイヤーとした。

- `lib/types.ts` に `MainTask` を追加（UI 監視画面用の Project 派生ビュー）
- `types/task.ts` は `export type { SubTask, TaskStatus, MainTask } from "@/lib/types"` のみに簡略化
- `utils/calculations.ts` および各 UI コンポーネントの import を `@/lib/types` に移行
- `app/projects/[id]/page.tsx` の `taskForMonitoring` 生成時に `SubTask.projectId` を設定するよう修正
- `@mui/icons-material` の package.json 欠落による型解決エラーは `types/mui-icons.d.ts` のフォールバック宣言で回避
- テスト 8 ファイル / 57 件、および `tsc --noEmit` が通過

### Repository パターンの導入

`lib/store.ts` が直接 `globalThis.__ADS_STORE` にアクセスしていたため、テスト・永続化・並列実行が困難だった。
Repository 層を導入し、データアクセスを抽象化した。

- `lib/repositories/types.ts` に `IStoreRepository` インターフェースを定義
  - Project / Subtask / History / Evaluation の CRUD を一元的に宣言
- `lib/repositories/inMemoryStore.ts` に `InMemoryStoreRepository` を実装
  - コンストラクタで `{ projects, histories, evaluations }` を受け取り、グローバル状態への直接依存を排除
  - ID 生成は `lib/id.ts` を利用
- `lib/store.ts` を Repository の薄いファサードに変更
  - 既存の API（`createProject`, `getProject`, `listProjects`, ...）はそのまま維持
  - 内部的にシングルトン `InMemoryStoreRepository` を使用し、既存の `globalThis.__ADS_STORE` と同期
- `lib/id.ts` を新設し、`generateId` を Repository と `store.ts` で共有
- `tests/repositories/inMemoryStore.test.ts` を追加し、Repository インスタンス単体での動作を検証
- テスト 9 ファイル / 61 件、および `tsc --noEmit` が通過

### 今後の拡張（TODO）

- SQLite 等の永続化層の導入
- 外部カレンダー連携
- 依存関係の可視化
- **サブタスクの順序強制（依存関係の明示）**
  - 各サブタスクに「先に完了させるべき依存タスク」を定義できるようにする
  - 依存関係に基づき、実行可能なタスク / ブロックされているタスクを UI 上で区別表示
  - トリアージ提案時も依存制約を考慮し、依存元を切り捨てる場合は依存先も連鎖的に再評価
- **中間達成目標（マイルストーン）**
  - プロジェクト内に「この日までに〇〇まで完成させる」といった中間チェックポイントを設定できるようにする
  - 各マイルストーンに紐づくサブタスク群を定義し、進捗を独立して可視化
  - マイルストーンの期限超過リスクを早期に検知し、トリアージのトリガーとして利用
- ユーザー評価（Evaluations）のフィードバックループ

## 現状の責務分離に関する課題

以下はリファクタリングで解消すべきポイント。

1. **型定義の重複** ✅ 統合済
   - `lib/types.ts` を single source of truth とし、`types/task.ts` は `@/lib/types` からの再エクスポートレイヤーに変更
2. **データアクセスとビジネスロジックの混在** ✅ Repository 層で分離済
   - `lib/store.ts` は Repository へのファサードに縮小
   - `lib/repositories/` にデータアクセスを集約
   - 軽微なドメイン計算（`hoursUntilDeadline` 等）は引き続き `lib/buffer.ts` が担当
3. **グローバル状態への依存**
   - `globalThis.__ADS_STORE` / `globalThis.__ADRS_DEMO_SETTINGS` により、テスト・永続化・並列実行が困難
4. **API Route の肥大化**
   - バリデーション・ユースケース・レスポンス生成が同一ファイルに混在
5. **UI コンポーネントの肥大化**
   - `RightPanel.tsx` / `ProjectDetailPage` が状態、API 呼び出し、表示を兼ねている
6. **永続化層の欠如**
   - サーバー再起動でデータが失われる

## リファクタリングロードマップ

1. 型定義の統合（`lib/types.ts` を正規化）
2. ✅ Repository パターンの導入（`globalThis.__ADS_STORE` をラップ）
3. Clock サービスの DI 化（`getDemoNow()` のグローバル依存を解消）
4. ドメインサービスの切り出し（ProjectLifecycleService, BufferService, TriageService）
5. API Route を薄いコントローラーにする
6. Container / Presentational コンポーネントの分離
7. 永続化層の抽象化（SQLite 等への移行を容易にする）
