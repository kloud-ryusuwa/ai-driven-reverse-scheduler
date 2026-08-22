```mermaid

erDiagram
    PROJECTS ||--o{ SUB_TASKS : "has (1:N)"
    PROJECTS ||--o{ HISTORIES : "logs (1:N)"
    HISTORIES ||--o| EVALUATIONS : "receives (1:0..1)"

    PROJECTS {
        string id PK "プロジェクト(MainTask)ID"
        string title "最終目標"
        string deadline "絶対期日"
        float initial_remaining_time "計画時の残り時間 (T_init)"
        float initial_total_hours "初期生総工数 (E_total)"
        string status "現在のステータス"
    }

    SUB_TASKS {
        string id PK "サブタスクID"
        string project_id FK "紐づくプロジェクトID"
        string title "タスク名"
        float estimated_hours "生の想定工数"
        boolean is_done "完了フラグ"
    }

    HISTORIES {
        string id PK "履歴ID"
        string project_id FK "紐づくプロジェクトID"
        datetime timestamp "AI提案日時"
        string content "提案・Drop内容"
    }

    EVALUATIONS {
        string id PK "評価ID"
        string history_id FK "紐づく履歴ID"
        int triage_accuracy "トリアージ的確度(1-5)"
        int psychological_relief "心理的救済度(1-5)"
        int feasibility "実現可能性(1-5)"
        string comment "ユーザー所感(任意)"
    }
    ```