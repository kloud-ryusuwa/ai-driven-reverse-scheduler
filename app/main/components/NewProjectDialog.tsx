"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import IntakePhase from "./IntakePhase";
import PlanningPhase from "./PlanningPhase";
import type { AIProposal } from "@/lib/types";

export default function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [proposal, setProposal] = useState<AIProposal | null>(null);
  const [deadline, setDeadline] = useState("");
  const [taskName, setTaskName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reset = () => { setProposal(null); setDeadline(""); setTaskName(""); setError(""); onClose(); };
  const generate = async (name: string, date: string, feedback?: string, currentProposal?: AIProposal) => {
    setTaskName(name); setDeadline(date); setLoading(true); setError("");
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskName: name, deadline: date, feedback, currentProposal }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "計画を作成できませんでした");
      setProposal(data);
    } catch (err) { setError(err instanceof Error ? err.message : "計画を作成できませんでした"); }
    finally { setLoading(false); }
  };
  const approve = async () => {
    if (!proposal) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: proposal.title, deadline, totalEstimatedHours: proposal.totalEstimatedHours, subtasks: proposal.subtasks }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存できませんでした");
      reset(); router.push(`/projects/${data.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "保存できませんでした"); setLoading(false); }
  };
  return <Dialog open={open} onClose={loading ? undefined : reset} fullWidth maxWidth="md">
    <DialogTitle sx={{ pr: 7 }}>新規プロジェクト<IconButton onClick={reset} disabled={loading} aria-label="閉じる" sx={{ position: "absolute", right: 12, top: 12 }}><CloseRoundedIcon /></IconButton></DialogTitle>
    <DialogContent sx={{ pb: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <Stack alignItems="center" spacing={2} sx={{ py: 8 }}><CircularProgress /><Typography color="text.secondary">AIが計画を作成しています</Typography></Stack>
        : proposal ? <PlanningPhase proposal={proposal} onApprove={approve} onReject={() => setProposal(null)} onRevise={(instruction) => generate(taskName, deadline, instruction, proposal)} />
          : <IntakePhase onNext={generate} />}
    </DialogContent>
  </Dialog>;
}
