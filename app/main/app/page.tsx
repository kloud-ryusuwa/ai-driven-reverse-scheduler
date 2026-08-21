"use client";

import { useState } from "react";
import RightPanel from "../components/RightPanel";
import IntakePhase from "../components/IntakePhase";
import PlanningPhase from "../components/PlanningPhase";
import MonitoringPhase from "../components/MonitoringPhase";

export default function Home() {
  const [panelMode, setPanelMode] = useState<"none" | "yellow" | "red">("none");
  const [phase, setPhase] = useState<"intake" | "planning" | "monitoring">("intake");

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-800 transition-all duration-300">
      <div className="flex justify-center gap-6 max-w-6xl mx-auto items-start">
        
        {/* 左側: メインエリア */}
        <div className={`transition-all duration-300 space-y-6 ${panelMode === "none" ? "w-full max-w-3xl" : "flex-1 max-w-2xl"}`}>
          <header>
            <h1 className="text-3xl font-bold">AI-Driven Reverse Scheduler</h1>
            <p className="text-gray-500 mt-2">間に合わないなら、削ろう。</p>
          </header>

          {/* 常に上部に入力フォームを表示 (消えない) */}
          <IntakePhase onNext={() => setPhase("planning")} />

          {/* AIプランニングプレビュー (提案中のみ表示) */}
          {phase === "planning" && (
            <PlanningPhase 
              onApprove={() => setPhase("monitoring")} 
              onReject={() => setPhase("intake")} 
            />
          )}

          {/* タスク一覧 (承認済みのタスク群) */}
          {phase === "monitoring" && (
            <MonitoringPhase onOpenPanel={(mode) => setPanelMode(mode)} />
          )}
        </div>

        {/* 右側パネル */}
        {panelMode !== "none" && (
          <RightPanel mode={panelMode} onClose={() => setPanelMode("none")} />
        )}

      </div>
    </main>
  );
}