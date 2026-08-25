"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MonitoringPhase from "@/components/MonitoringPhase";
import RightPanel from "@/components/RightPanel";
import type { MainTask } from "@/types/task";
import type { BufferStatus, History, Project, TriageProposal } from "@/lib/types";
import { getStatusFromBuffer } from "@/utils/calculations";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<BufferStatus | null>(null);
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panelMode, setPanelMode] = useState<"none" | "yellow" | "red">("none");

  const initialOpenDone = useRef(false);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [projRes, statusRes, histRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/status`),
        fetch(`/api/projects/${id}/histories`),
      ]);
      if (!projRes.ok) {
        const data = await projRes.json();
        throw new Error(data.error || "プロジェクトが見つかりません");
      }
      const projData = (await projRes.json()) as Project;
      const statusData = (await statusRes.json()) as BufferStatus;
      const histData = await histRes.json();
      setProject(projData);
      setStatus(statusData);
      setHistories((histData.histories as History[]) ?? []);
      const s = getStatusFromBuffer(statusData.bufferPercentage);
      if (s !== "green" && !initialOpenDone.current) {
        setPanelMode(s);
        initialOpenDone.current = true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // マウント時・ID変更時にプロジェクト詳細を取得する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleSubtask = async (subtaskId: string, isDone: boolean) => {
    if (!id) return;
    const res = await fetch(`/api/projects/${id}/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone }),
    });
    if (!res.ok) return;
    await loadAll();
  };

  const handleTriage = async (
    mode: "yellow" | "red",
    context: { goal: string; priority?: string }
  ): Promise<TriageProposal | null> => {
    if (!id) return null;
    const res = await fetch(`/api/projects/${id}/triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, context }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "トリアージに失敗しました");
    }
    return data.proposal as TriageProposal;
  };

  const handleApplyProposal = async (proposal: TriageProposal) => {
    if (!id || !project) return;
    if (proposal.type === "drop") {
      for (const sub of proposal.droppedSubtasks) {
        await fetch(`/api/projects/${id}/subtasks/${sub.id}`, {
          method: "DELETE",
        });
      }
    } else if (proposal.targetSubtaskIds.length > 0) {
      const targetId = proposal.targetSubtaskIds[0];
      const target = project.subtasks.find((s) => s.id === targetId);
      if (target) {
        await fetch(`/api/projects/${id}/subtasks/${targetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estimatedHours: target.estimatedHours * 0.5 }),
        });
      }
    }
    await fetch(`/api/projects/${id}/histories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `AI提案を適用: ${proposal.reason}` }),
    });
    await loadAll();
    setPanelMode("none");
  };

  const handleAddHistory = async (content: string) => {
    if (!id) return;
    const res = await fetch(`/api/projects/${id}/histories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const data = (await res.json()) as History;
      setHistories((prev) => [data, ...prev]);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 text-gray-800">
        読み込み中...
      </main>
    );
  }
  if (error || !project || !status) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 text-red-600">
        {error || "プロジェクトが見つかりません"}
      </main>
    );
  }

  const taskForMonitoring: MainTask = {
    id: project.id,
    title: project.title,
    deadline: project.deadline,
    bufferPercentage: status.bufferPercentage,
    completedSubtasks: project.subtasks.filter((s) => s.isDone).length,
    totalSubtasks: project.subtasks.length,
    subtasks: project.subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      isDone: s.isDone,
      estimatedHours: s.estimatedHours,
    })),
  };
  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-800">
      <div className="flex justify-center gap-6 max-w-6xl mx-auto items-start">
        <div
          className={`transition-all duration-300 space-y-6 ${
            panelMode === "none" ? "w-full max-w-3xl" : "flex-1 max-w-2xl"
          }`}
        >
          <header>
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← ダッシュボード
            </Link>
            <h1 className="text-3xl font-bold mt-2">{project.title}</h1>
            <p className="text-gray-500 mt-1">期日: {project.deadline}</p>
          </header>

          <MonitoringPhase
            task={taskForMonitoring}
            onToggleSubtask={handleToggleSubtask}
            onOpenPanel={(mode) => setPanelMode(mode)}
          />
        </div>

        {panelMode !== "none" && (
          <RightPanel
            mode={panelMode}
            task={taskForMonitoring}
            histories={histories}
            onClose={() => setPanelMode("none")}
            onTriage={handleTriage}
            onApplyProposal={handleApplyProposal}
            onAddHistory={handleAddHistory}
          />
        )}
      </div>
    </main>
  );
}
