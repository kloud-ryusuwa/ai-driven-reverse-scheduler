# API 仕様

## 共通仕様

- リクエスト・レスポンス形式は `application/json` とする。
- **認証**: MVP では認証を行わない。将来的にセッションクッキー等を導入する場合は、該当エンドポイントを「要」に変更する。
- 日付・日時は原則 ISO 8601 形式の文字列を使用する（`deadline` は `YYYY-MM-DD`）。
- エラーレスポンス:

```json
{
  "error": "エラーメッセージ"
}
```

- ページネーション（一覧系）

```
GET /api/projects?page=1&per_page=20
```

| 名前 | 型 | 備考 |
|---|---|---|
| page | int | 省略時 1 |
| per_page | int | 省略時 20。**50 を超える値を指定すると 50 ではなく 20 になる** |

```json
{
  "items": [...],
  "total": 123,
  "page": 1,
  "per_page": 20
}
```

> 現状、SSE 等のリアルタイム配信は行わない。

## バッファ計算

`docs/specs.md`・`docs/要件定義書.md` の計算式を API でもそのまま適用する。

- $E_{total}$: 初期の生総工数（= `initialTotalHours`）
- $T_{init}$: 計画時の残り時間（時間、= `initialRemainingTime`）
- $E_{remain}$: 未完了サブタスクの想定工数合計
- $T_{current}$: 現在時点での期日までの残り時間（時間）

1. $E_{plan} = E_{total} \times 1.2$
2. $B_{init} = T_{init} - E_{plan}$
3. $B_{current} = T_{current} - (E_{remain} \times 1.2)$
4. $B_{base} = \max(B_{init}, E_{plan} \times 0.2, 1)$
5. $BufferRate = (B_{current} / B_{base}) \times 100$

`B_base` は表示の安定化に使う基準幅（時間）である。初期バッファが0または極端に小さい計画でも、わずかな工数変更によって残存率が0%から100%へ不連続に変化しないよう、初期計画工数の20%または1時間を下限とする。上限は100%とし、負の値は切り捨てず危機の度合いとしてそのまま返す。

ステータス閾値:

| バッファ残存率 | ステータス |
|---|---|
| 50% 以上 | `green` |
| 0% 超 〜 50% 未満 | `yellow` |
| 0% 以下 | `red` |

## データオブジェクト定義

### ProjectSummary オブジェクト

```json
{
  "id": "proj_01J8...",
  "title": "プレゼン資料作成",
  "deadline": "2026-09-10",
  "status": "green",
  "bufferPercentage": 65,
  "completedSubtasks": 2,
  "totalSubtasks": 5
}
```

### Project オブジェクト（詳細）

`ProjectSummary` に加えて以下を含む。

```json
{
  "id": "proj_01J8...",
  "title": "プレゼン資料作成",
  "deadline": "2026-09-10",
  "status": "green",
  "bufferPercentage": 65,
  "completedSubtasks": 2,
  "totalSubtasks": 5,
  "initialRemainingTime": 120,
  "initialTotalHours": 80,
  "subtasks": [ /* SubTask オブジェクトの配列 */ ],
  "createdAt": "2026-08-20T09:00:00Z",
  "updatedAt": "2026-08-22T10:00:00Z"
}
```

`status` は `bufferPercentage` から動的に決まる（`green` / `yellow` / `red`）。`completedSubtasks` / `totalSubtasks` は `subtasks` から導出される。

### SubTask オブジェクト

```json
{
  "id": "sub_01J8...",
  "projectId": "proj_01J8...",
  "title": "構成案作成",
  "estimatedHours": 4,
  "isDone": false
}
```

### AIProposal オブジェクト

`/api/generate` のレスポンス。フロントエンドで承認後、`POST /api/projects` のペイロードとしても使われる。

```json
{
  "title": "プレゼン資料作成",
  "totalEstimatedHours": 10,
  "bufferHours": 2,
  "effectiveTotalHours": 12,
  "subtasks": [
    { "title": "構成案作成", "estimatedHours": 2 },
    { "title": "スライド作成", "estimatedHours": 6 },
    { "title": "レビュー", "estimatedHours": 2 }
  ]
}
```

### BufferStatus オブジェクト

```json
{
  "projectId": "proj_01J8...",
  "status": "green",
  "bufferPercentage": 65,
  "remainingTime": 96,
  "remainingHours": 28.8,
  "initialRemainingTime": 120,
  "initialTotalHours": 80
}
```

- `remainingTime`: 期日までの残り時間（時間）
- `remainingHours`: 未完了タスクの想定工数合計（生の値）

### TriageProposal オブジェクト

```json
{
  "type": "drop",
  "targetSubtaskIds": ["sub_01J8..."],
  "reason": "装飾作業は必須要件ではないため削除しても目的は達成できます。",
  "newTotalEstimatedHours": 8,
  "newEffectiveTotalHours": 9.6,
  "droppedSubtasks": [ /* SubTask オブジェクト */ ]
}
```

`type` は `drop`（完全削除）または `simplify`（簡略化）のいずれか。

### History オブジェクト

```json
{
  "id": "hist_01J8...",
  "projectId": "proj_01J8...",
  "timestamp": "2026-08-22T10:00:00Z",
  "content": "AI提案で装飾タスクをDrop"
}
```

### Evaluation オブジェクト

```json
{
  "id": "eval_01J8...",
  "historyId": "hist_01J8...",
  "triageAccuracy": 4,
  "psychologicalRelief": 5,
  "feasibility": 3,
  "comment": "提案通りに進められそう"
}
```

## エンドポイント一覧

### デモ設定

ハッカソンでのデモ専用機能。設定は単一のアプリケーションプロセス内で共有され、プロセスを再起動すると初期値へ戻る。

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/demo-settings` | 現在の日時・モデル設定とOpenAI互換APIのモデル一覧を取得 |
| PATCH | `/api/demo-settings` | デモ用の現在日時・利用モデルを変更 |

```json
// GET Response 200
{
  "now": "2026-08-25T12:00:00.000Z",
  "model": "gpt-oss-120b",
  "models": ["gpt-oss-120b", "llm-jp-3.1-8x13b-instruct4"]
}
```

`now`を`null`にすると実際の現在日時を使用する。モデル一覧を取得できない場合は、現在選択中のモデルだけを返す。

```json
// PATCH Request
{
  "now": "2026-08-26T09:00:00.000Z",
  "model": "gpt-oss-120b"
}
```

### AI / WBS 生成

| Method | Path | 説明 | 認証 |
|---|---|---|---|
| POST | `/api/generate` | 目標と期日から WBS（サブタスク一覧）を生成 | 不要 |

#### WBS 生成
- POST `/api/generate`

AI に目標（メインタスク）と絶対期日を渡し、サブタスクと工数見積もりを生成する。

| 名前 | 型 | 備考 |
|---|---|---|
| taskName | string | **必須**。最終目標 |
| deadline | string | 絶対期日（`YYYY-MM-DD`）。省略可 |

```json
// Request
{
  "taskName": "プレゼン資料作成",
  "deadline": "2026-09-10"
}
```

```json
// Response 200
{
  "title": "プレゼン資料作成",
  "totalEstimatedHours": 10,
  "bufferHours": 2,
  "effectiveTotalHours": 12,
  "subtasks": [
    { "title": "構成案作成", "estimatedHours": 2 },
    { "title": "スライド作成", "estimatedHours": 6 },
    { "title": "レビュー", "estimatedHours": 2 }
  ]
}
```

### プロジェクト

| Method | Path | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/projects` | プロジェクト一覧 | 不要 |
| POST | `/api/projects` | 承認された計画からプロジェクトを作成 | 不要 |
| GET | `/api/projects/:id` | プロジェクト詳細 | 不要 |
| PATCH | `/api/projects/:id` | プロジェクト情報を更新 | 不要 |
| DELETE | `/api/projects/:id` | プロジェクトを削除 | 不要 |

#### プロジェクト一覧
- GET `/api/projects`

| 名前 | 型 | 備考 |
|---|---|---|
| status | string | `green` / `yellow` / `red` で絞り込み（省略時は全件） |
| page | int | 省略時 1 |
| per_page | int | 省略時 20 |

```json
// Response 200
{
  "projects": [ /* ProjectSummary オブジェクトの配列 */ ],
  "total": 12,
  "page": 1,
  "per_page": 20
}
```

#### プロジェクト作成
- POST `/api/projects`

`/api/generate` の結果に `deadline` を加えた形で送信する。

| 名前 | 型 | 備考 |
|---|---|---|
| title | string | **必須**。最終目標 |
| deadline | string | **必須**。絶対期日（`YYYY-MM-DD`） |
| totalEstimatedHours | number | **必須**。生の総工数 |
| subtasks | array | **必須**。`{ title, estimatedHours }` の配列 |

```json
// Request
{
  "title": "プレゼン資料作成",
  "deadline": "2026-09-10",
  "totalEstimatedHours": 10,
  "subtasks": [
    { "title": "構成案作成", "estimatedHours": 2 },
    { "title": "スライド作成", "estimatedHours": 6 },
    { "title": "レビュー", "estimatedHours": 2 }
  ]
}
```

```json
// Response 201
{
  "id": "proj_01J8...",
  "title": "プレゼン資料作成",
  "deadline": "2026-09-10",
  "status": "green",
  "bufferPercentage": 100,
  "completedSubtasks": 0,
  "totalSubtasks": 3,
  "initialRemainingTime": 168,
  "initialTotalHours": 10,
  "subtasks": [
    { "id": "sub_01J8...", "projectId": "proj_01J8...", "title": "構成案作成", "estimatedHours": 2, "isDone": false },
    ...
  ],
  "createdAt": "2026-08-24T10:00:00Z",
  "updatedAt": "2026-08-24T10:00:00Z"
}
```

#### プロジェクト詳細
- GET `/api/projects/:id`

```json
// Response 200
{ /* Project オブジェクト */ }
```

#### プロジェクト更新
- PATCH `/api/projects/:id`

| 名前 | 型 | 備考 |
|---|---|---|
| title | string | 最終目標 |
| deadline | string | 絶対期日（`YYYY-MM-DD`） |

```json
// Response 200
{ /* 更新後の Project オブジェクト */ }
```

#### プロジェクト削除
- DELETE `/api/projects/:id`

```json
// Response 204
// （本文なし）
```

### サブタスク

| Method | Path | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/projects/:id/subtasks` | サブタスク一覧 | 不要 |
| POST | `/api/projects/:id/subtasks` | サブタスク追加 | 不要 |
| PATCH | `/api/projects/:id/subtasks/:subtaskId` | サブタスク更新 | 不要 |
| DELETE | `/api/projects/:id/subtasks/:subtaskId` | サブタスク削除 | 不要 |

#### サブタスク一覧
- GET `/api/projects/:id/subtasks`

ページネーションに対応。

```json
// Response 200
{
  "subtasks": [ /* SubTask オブジェクトの配列 */ ],
  "total": 5,
  "page": 1,
  "per_page": 20
}
```

#### サブタスク追加
- POST `/api/projects/:id/subtasks`

| 名前 | 型 | 備考 |
|---|---|---|
| title | string | **必須**。タスク名 |
| estimatedHours | number | **必須**。想定工数 |

```json
// Request
{
  "title": "資料添付作成",
  "estimatedHours": 1.5
}
```

```json
// Response 201
{
  "id": "sub_01J8...",
  "projectId": "proj_01J8...",
  "title": "資料添付作成",
  "estimatedHours": 1.5,
  "isDone": false
}
```

#### サブタスク更新
- PATCH `/api/projects/:id/subtasks/:subtaskId`

| 名前 | 型 | 備考 |
|---|---|---|
| title | string | タスク名 |
| estimatedHours | number | 想定工数 |
| isDone | boolean | 完了フラグ |

```json
// Request
{ "isDone": true }
```

```json
// Response 200
{ /* 更新後の SubTask オブジェクト */ }
```

#### サブタスク削除
- DELETE `/api/projects/:id/subtasks/:subtaskId`

```json
// Response 204
// （本文なし）
```

### バッファ・ステータス

| Method | Path | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/projects/:id/status` | 現在のバッファ残存率とステータスを取得 | 不要 |

#### ステータス取得
- GET `/api/projects/:id/status`

`status` および `bufferPercentage` はリクエスト時点で再計算される。

```json
// Response 200
{
  "projectId": "proj_01J8...",
  "status": "yellow",
  "bufferPercentage": 35,
  "remainingTime": 72,
  "remainingHours": 28.8,
  "initialRemainingTime": 120,
  "initialTotalHours": 80
}
```

### AI トリアージ

| Method | Path | 説明 | 認証 |
|---|---|---|---|
| POST | `/api/projects/:id/triage` | Yellow / Red 状態のプロジェクトに対し、AI がスコープ削減・簡略化を提案 | 不要 |

#### トリアージ提案
- POST `/api/projects/:id/triage`

| 名前 | 型 | 備考 |
|---|---|---|
| mode | string | `yellow` または `red` |
| context.goal | string | 最終目的 |
| context.priority | string | `must` / `should` / `could`（Yellow 相談時） |

```json
// Request
{
  "mode": "red",
  "context": {
    "goal": "プレゼン資料を完成させ、発表で評価を得る",
    "priority": "must"
  }
}
```

```json
// Response 200
{
  "proposal": {
    "type": "drop",
    "targetSubtaskIds": ["sub_01J8..."],
    "reason": "アニメーション作成は聴衆の理解に直接関係しないため削除可能です。",
    "newTotalEstimatedHours": 8,
    "newEffectiveTotalHours": 9.6,
    "droppedSubtasks": [ /* SubTask オブジェクト */ ]
  }
}
```

> 本エンドポイントは**提案のみ**を返す。実際の反映は、クライアントが承認後に `PATCH /api/projects/:id/subtasks/:subtaskId` または `DELETE /api/projects/:id/subtasks/:subtaskId` を呼び出し、必要に応じて `POST /api/projects/:id/histories` で履歴を記録すること。

### 履歴

| Method | Path | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/projects/:id/histories` | プロジェクトの変更履歴一覧 | 不要 |
| POST | `/api/projects/:id/histories` | 変更履歴を追加 | 不要 |

#### 履歴一覧
- GET `/api/projects/:id/histories`

ページネーションに対応。

```json
// Response 200
{
  "histories": [ /* History オブジェクトの配列 */ ],
  "total": 8,
  "page": 1,
  "per_page": 20
}
```

#### 履歴追加
- POST `/api/projects/:id/histories`

| 名前 | 型 | 備考 |
|---|---|---|
| content | string | **必須**。変更内容 |

```json
// Request
{
  "content": "AI提案で装飾タスクをDrop"
}
```

```json
// Response 201
{
  "id": "hist_01J8...",
  "projectId": "proj_01J8...",
  "timestamp": "2026-08-22T10:00:00Z",
  "content": "AI提案で装飾タスクをDrop"
}
```

### 評価

| Method | Path | 説明 | 認証 |
|---|---|---|---|
| POST | `/api/histories/:historyId/evaluation` | 履歴に対するユーザー評価を作成 | 不要 |
| GET | `/api/histories/:historyId/evaluation` | 評価を取得 | 不要 |

#### 評価作成
- POST `/api/histories/:historyId/evaluation`

| 名前 | 型 | 備考 |
|---|---|---|
| triageAccuracy | int | **必須**。トリアージ的確度（1〜5） |
| psychologicalRelief | int | **必須**。心理的救済度（1〜5） |
| feasibility | int | **必須**。実現可能性（1〜5） |
| comment | string | ユーザー所感（任意） |

```json
// Request
{
  "triageAccuracy": 4,
  "psychologicalRelief": 5,
  "feasibility": 3,
  "comment": "提案通りに進められそう"
}
```

```json
// Response 201
{
  "id": "eval_01J8...",
  "historyId": "hist_01J8...",
  "triageAccuracy": 4,
  "psychologicalRelief": 5,
  "feasibility": 3,
  "comment": "提案通りに進められそう"
}
```

#### 評価取得
- GET `/api/histories/:historyId/evaluation`

```json
// Response 200
{ /* Evaluation オブジェクト */ }
```

## 補足

- `id` はすべて文字列（UUID / ULID / CUID 等）を想定する。
- 工数（`estimatedHours` 等）は小数を含む数値（時間）を扱う。
- 認証を導入する場合、`POST /api/projects` 等の更新系を「要」に変更し、`401 Unauthorized` を返す。
- 現状の実装 (`app/main/app/api/generate/route.ts`) は `/api/generate` のみを提供している。本仕様は `docs/database.md`・`docs/design.md`・`docs/要件定義書.md` を基に、SQLite 等で永続化した際の API 像として定義している。
