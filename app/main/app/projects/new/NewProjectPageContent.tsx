"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import IntakePhase from "@/components/IntakePhase";
import PlanningPhase from "@/components/PlanningPhase";
import type { AIProposal } from "@/lib/types";

export default function NewProjectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<"intake" | "planning">("intake");
  const [isLoading, setIsLoading] = useState(false);
  const [aiProposal, setAiProposal] = useState<AIProposal | null>(null);
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const taskParam = searchParams.get("task") ?? "";
    const deadlineParam = searchParams.get("deadline") ?? "";
    // クエリパラメータからフォームの初期値を同期する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTaskName(taskParam);
    setDeadline(deadlineParam);
  }, [searchParams]);

  const generateWBS = async (name: string, date: string) => {
    if (!date) {
      setError("期日を選択してください");
      return;
    }
    setTaskName(name);
    setDeadline(date);
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: name, deadline: date }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AIの計画作成に失敗しました");
      }

      setAiProposal(data);
      setPhase("planning");
    } catch (err) {
      console.error("API呼び出しエラー:", err);
      setError(err instanceof Error ? err.message : "AIの計画作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!aiProposal) return;
    if (!deadline) {
      setError("期日が設定されていないため保存できません");
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aiProposal.title,
          deadline,
          totalEstimatedHours: aiProposal.totalEstimatedHours,
          subtasks: aiProposal.subtasks,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "プロジェクトの保存に失敗しました");
      }

      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "プロジェクトの保存に失敗しました");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-800">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← ダッシュボード
          </Link>
          <h1 className="text-3xl font-bold mt-2">新しいプロジェクト</h1>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {phase === "intake" && !isLoading && (
          <IntakePhase
            onNext={generateWBS}
            initialTaskName={taskName}
            initialDeadline={deadline}
          />
        )}

        {isLoading && (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center animate-pulse font-bold text-blue-600">
            🧠 さくらのAIが逆算スケジュールを構築中...
          </div>
        )}

        {phase === "planning" && aiProposal && (
          <PlanningPhase
            proposal={aiProposal}
            onApprove={handleApprove}
            onReject={() => setPhase("intake")}
          />
        )}
      </div>
    </main>
  );
}
