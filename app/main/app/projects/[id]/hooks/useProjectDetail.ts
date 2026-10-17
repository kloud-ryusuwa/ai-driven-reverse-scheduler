"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BufferStatus, History, Project, TriageProposal } from "@/lib/types";
import { getStatusFromBuffer } from "@/utils/calculations";

export async function requestTriage(
  id: string,
  mode: "yellow" | "red",
  context: { goal: string; priority?: string }
): Promise<TriageProposal> {
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
}

export async function applyTriageProposal(
  id: string,
  proposal: TriageProposal,
  project: Project
): Promise<void> {
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
}

export function useProjectDetail(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<BufferStatus | null>(null);
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panelMode, setPanelMode] = useState<"none" | "yellow" | "red">("none");

  const initialOpenDone = useRef(false);

  const loadAll = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
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
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const toggleSubtask = useCallback(
    async (subtaskId: string, isDone: boolean) => {
      if (!id) return;
      const res = await fetch(`/api/projects/${id}/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone }),
      });
      if (!res.ok) return;
      await loadAll();
    },
    [id, loadAll]
  );

  const resizeSubtask = useCallback(
    async (subtaskId: string, estimatedHours: number) => {
      if (!id) return;
      const res = await fetch(`/api/projects/${id}/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimatedHours }),
      });
      if (!res.ok) throw new Error("所要時間の更新に失敗しました");
      await loadAll();
    },
    [id, loadAll]
  );

  const handleRequestTriage = useCallback(
    async (
      mode: "yellow" | "red",
      context: { goal: string; priority?: string }
    ): Promise<TriageProposal | null> => {
      if (!id) return null;
      return requestTriage(id, mode, context);
    },
    [id]
  );

  const handleApplyProposal = useCallback(
    async (proposal: TriageProposal) => {
      if (!id || !project) return;
      await applyTriageProposal(id, proposal, project);
      await loadAll();
      setPanelMode("none");
    },
    [id, project, loadAll]
  );

  const addHistory = useCallback(
    async (content: string) => {
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
    },
    [id]
  );

  return {
    project,
    status,
    histories,
    loading,
    error,
    panelMode,
    setPanelMode,
    loadAll,
    toggleSubtask,
    resizeSubtask,
    requestTriage: handleRequestTriage,
    applyProposal: handleApplyProposal,
    addHistory,
  };
}
