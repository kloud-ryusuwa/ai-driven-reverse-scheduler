"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import MonitoringPhase from "@/components/MonitoringPhase";
import RightPanel from "@/components/RightPanel";
import type { MainTask } from "@/types/task";
import type { BufferStatus, History, Project, TriageProposal } from "@/lib/types";
import { getStatusFromBuffer } from "@/utils/calculations";
import ProjectGantt from "@/components/ProjectGantt";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";

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

  const handleResizeSubtask = async (subtaskId: string, estimatedHours: number) => {
    const res = await fetch(`/api/projects/${id}/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimatedHours }),
    });
    if (!res.ok) throw new Error("所要時間の更新に失敗しました");
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
      <Stack component="main" minHeight="100vh" alignItems="center" justifyContent="center" spacing={2}><CircularProgress /><Typography color="text.secondary">プロジェクトを読み込んでいます</Typography></Stack>
    );
  }
  if (error || !project || !status) {
    return (
      <Container component="main" sx={{ py: 8 }}><Alert severity="error">{error || "プロジェクトが見つかりません"}</Alert></Container>
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
  const currentStatus = getStatusFromBuffer(status.bufferPercentage);
  const statusMeta = currentStatus === "green"
    ? { label: "順調", color: "success" as const, message: "現在の計画で期日に到達できる見込みです。" }
    : currentStatus === "yellow"
      ? { label: "要注意", color: "warning" as const, message: "余裕が減っています。今のうちに優先度を見直しましょう。" }
      : { label: "危機", color: "error" as const, message: "現行スコープでは期日超過の可能性があります。削減判断が必要です。" };
  const deadlineLabel = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${project.deadline}T00:00:00`));
  const daysLeft = Math.max(0, Math.ceil(status.remainingTime / 24));
  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Stack direction="row" gap={3} alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack component="header" direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
            <Box><Stack direction="row" spacing={1} alignItems="center" sx={{ mb: .5 }}><Chip label={statusMeta.label} color={statusMeta.color} size="small" /><Typography variant="caption" color="text.secondary">LIVE</Typography></Stack><Typography variant="h1">{project.title}</Typography><Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}><CalendarTodayRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} /><Typography variant="body2" color="text.secondary">期日 {deadlineLabel}</Typography></Stack></Box>
          </Stack>

          <Alert severity={statusMeta.color} action={currentStatus !== "green" ? <Button color="inherit" size="small" startIcon={<AutoAwesomeRoundedIcon />} onClick={() => setPanelMode(currentStatus)}>AIに相談</Button> : undefined} sx={{ mb: 2.5 }}>{statusMeta.message}</Alert>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 2.5 }}>
            <Card><CardContent><Typography variant="caption" color="text.secondary">バッファ残存率</Typography><Stack direction="row" alignItems="end" spacing={1}><Typography variant="h4" fontWeight={800}>{Math.round(status.bufferPercentage)}%</Typography><Typography variant="body2" color="text.secondary" sx={{ pb: .4 }}>余裕</Typography></Stack><LinearProgress color={statusMeta.color} variant="determinate" value={Math.max(0, Math.min(status.bufferPercentage, 100))} sx={{ mt: 1.5, height: 6, borderRadius: 4 }} /></CardContent></Card>
            <Card><CardContent><Typography variant="caption" color="text.secondary">期日まで</Typography><Typography variant="h4" fontWeight={800}>{daysLeft}<Typography component="span" variant="body2" color="text.secondary"> 日</Typography></Typography><Typography variant="caption" color="text.secondary">残り {Math.max(0, Math.round(status.remainingTime))} 時間</Typography></CardContent></Card>
            <Card><CardContent><Typography variant="caption" color="text.secondary">未完了の工数</Typography><Typography variant="h4" fontWeight={800}>{status.remainingHours.toFixed(1)}<Typography component="span" variant="body2" color="text.secondary"> 時間</Typography></Typography><Typography variant="caption" color="text.secondary">安全係数 1.2 を別途考慮</Typography></CardContent></Card>
          </Box>

          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Box><Typography variant="h2">逆算ガント</Typography><Typography variant="body2" color="text.secondary">右端のハンドルをドラッグすると所要時間を変更できます。</Typography></Box><Chip label={`${project.subtasks.length} タスク`} size="small" variant="outlined" /></Stack>
            <ProjectGantt subtasks={taskForMonitoring.subtasks} createdAt={project.createdAt} deadline={project.deadline} onResize={handleResizeSubtask} />
          </Paper>

          <MonitoringPhase
            task={taskForMonitoring}
            onToggleSubtask={handleToggleSubtask}
            onOpenPanel={(mode) => setPanelMode(mode)}
          />
        </Box>

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
        </Stack>
      </Container>
    </Box>
  );
}
