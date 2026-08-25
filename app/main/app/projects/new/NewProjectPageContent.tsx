"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import IntakePhase from "@/components/IntakePhase";
import PlanningPhase from "@/components/PlanningPhase";
import type { AIProposal } from "@/lib/types";
import { Alert, Box, Breadcrumbs, CircularProgress, Container, Link as MuiLink, Stack, Typography } from "@mui/material";

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
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 3, md: 5 } }}><Container maxWidth="md">
        <Breadcrumbs sx={{ mb: 2 }}><MuiLink component={Link} href="/" underline="hover" color="inherit">プロジェクト</MuiLink><Typography color="text.primary">新規作成</Typography></Breadcrumbs>
        <Box component="header" sx={{ mb: 3 }}><Typography variant="h1">新しいプロジェクト</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>目標と期日を決め、AIの逆算プランをレビューして開始します。</Typography></Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {phase === "intake" && !isLoading && (
          <IntakePhase
            onNext={generateWBS}
            initialTaskName={taskName}
            initialDeadline={deadline}
          />
        )}

        {isLoading && (
          <Stack alignItems="center" spacing={2} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: 6 }}><CircularProgress /><Typography fontWeight={700}>AIが逆算スケジュールを構築しています</Typography><Typography variant="body2" color="text.secondary">タスク分解と安全係数を計算中です。</Typography></Stack>
        )}

        {phase === "planning" && aiProposal && (
          <PlanningPhase
            proposal={aiProposal}
            onApprove={handleApprove}
            onReject={() => setPhase("intake")}
          />
        )}
    </Container></Box>
  );
}
