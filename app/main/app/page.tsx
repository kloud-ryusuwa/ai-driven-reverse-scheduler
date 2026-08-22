"use client";

import { useState } from "react";
import RightPanel from "../components/RightPanel";
import IntakePhase from "../components/IntakePhase";
import PlanningPhase from "../components/PlanningPhase";
import MonitoringPhase from "../components/MonitoringPhase";
import { MainTask } from "../types/task";


export default function Home() {
  // パネルと選択されたタスクの管理
  const [panelMode, setPanelMode] = useState<"none" | "yellow" | "red">("none");
  const [selectedTask, setSelectedTask] = useState<MainTask | null>(null);
  const [currentDeadline, setCurrentDeadline] = useState<string>("");

  // 画面遷移とAI連携の管理
  const [phase, setPhase] = useState<"intake" | "planning" | "monitoring">("intake");
  const [isLoading, setIsLoading] = useState(false);
  const [aiProposal, setAiProposal] = useState<any>(null);

  // 🌟 タスクリストの管理 (初期データとしてデモを1件入れています)
  const [tasks, setTasks] = useState<MainTask[]>([
    {
      id: "demo-1",
      title: "既存のプロジェクト進行",
      deadline: "2026-09-01",
      bufferPercentage: 35,
      completedSubtasks: 1,
      totalSubtasks: 2,
      subtasks: [
        { id: "d-sub1", title: "要件定義", isDone: true, estimatedHours: 3 },
        { id: "d-sub2", title: "設計書の作成", isDone: false, estimatedHours: 5 },
      ]
    }
  ]);

  // さくらのAIに計画を立てさせる
  const generateWBS = async (taskName: string, deadline: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName, deadline })
      });
      const data = await res.json();
      setAiProposal(data);
      setPhase("planning");
    } catch (error) {
      console.error("API呼び出しエラー:", error);
      alert("AIの計画作成に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // 承認ボタンが押されたときの処理
  const handleApprove = () => {
    if (!aiProposal) return;
    const safeSubtasks = aiProposal.subtasks || [];

    const newTask: MainTask = {
      id: `task-${Date.now()}`,
      title: aiProposal.title || "新規タスク",
      deadline: currentDeadline, // 👈 ここでさっき覚えた currentDeadline を使う！
      bufferPercentage: 100,
      completedSubtasks: 0,
      totalSubtasks: safeSubtasks.length || 1,
      subtasks: safeSubtasks.map((sub: any, index: number) => ({
        id: `sub-${Date.now()}-${index}`,
        title: sub.title || "名称不明のサブタスク",
        isDone: false,
        estimatedHours: sub.estimatedHours || 1
      }))
    };

    setTasks([newTask, ...tasks]);
    setPhase("monitoring");
    setAiProposal(null);
  };
  // パネルを開く
  const handleOpenPanel = (mode: "yellow" | "red", task: MainTask) => {
    setPanelMode(mode);
    setSelectedTask(task);
  };

  // パネルを閉じる
  const handleClosePanel = () => {
    setPanelMode("none");
    setSelectedTask(null);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-800 transition-all duration-300">
      <div className="flex justify-center gap-6 max-w-6xl mx-auto items-start">
        
        {/* 左側メインエリア */}
        <div className={`transition-all duration-300 space-y-6 ${panelMode === "none" ? "w-full max-w-3xl" : "flex-1 max-w-2xl"}`}>
          
          <header>
            <h1 className="text-3xl font-bold">AI-Driven Reverse Scheduler</h1>
            <p className="text-gray-500 mt-2">間に合わないなら、削ろう。</p>
          </header>

          {/* 入力フォーム (初期 or 一覧画面のみ表示) */}
          {(phase === "intake" || phase === "monitoring") && !isLoading && (
            <IntakePhase onNext={generateWBS} />
          )}

          {/* ロード中 */}
          {isLoading && (
            <div className="bg-white p-6 rounded-xl shadow-sm text-center animate-pulse font-bold text-blue-600">
              🧠 さくらのAIが逆算スケジュールを構築中...
            </div>
          )}

          {/* プラン確認画面 */}
          {phase === "planning" && aiProposal && (
            <PlanningPhase 
              proposal={aiProposal}
              onApprove={handleApprove} // 🌟 ここが正しく紐づいていなかった可能性大
              onReject={() => setPhase("intake")} 
            />
          )}

          {/* タスク一覧画面 */}
          {phase === "monitoring" && (
            <MonitoringPhase tasks={tasks} onOpenPanel={handleOpenPanel} />
          )}

        </div>

        {/* 右側パネル (選択されたタスクがある時だけ表示) */}
        {panelMode !== "none" && selectedTask && (
          <RightPanel 
            mode={panelMode} 
            task={selectedTask} 
            onClose={handleClosePanel} 
          />
        )}

      </div>
    </main>
  );
}