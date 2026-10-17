"use client";

import { useParams } from "next/navigation";
import ProjectDetailView from "@/components/ProjectDetailView";
import { useProjectDetail } from "@/lib/hooks/useProjectDetail";
import { Alert, CircularProgress, Container, Stack, Typography } from "@mui/material";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    project,
    status,
    histories,
    loading,
    error,
    panelMode,
    setPanelMode,
    toggleSubtask,
    resizeSubtask,
    requestTriage,
    applyProposal,
    addHistory,
  } = useProjectDetail(id);

  if (loading) {
    return (
      <Stack component="main" minHeight="100vh" alignItems="center" justifyContent="center" spacing={2}>
        <CircularProgress />
        <Typography color="text.secondary">プロジェクトを読み込んでいます</Typography>
      </Stack>
    );
  }

  if (error || !project || !status) {
    return (
      <Container component="main" sx={{ py: 8 }}>
        <Alert severity="error">{error || "プロジェクトが見つかりません"}</Alert>
      </Container>
    );
  }

  return (
    <ProjectDetailView
      project={project}
      status={status}
      histories={histories}
      panelMode={panelMode}
      onToggleSubtask={toggleSubtask}
      onResizeSubtask={resizeSubtask}
      onOpenPanel={setPanelMode}
      onClosePanel={() => setPanelMode("none")}
      onTriage={requestTriage}
      onApplyProposal={applyProposal}
      onAddHistory={addHistory}
    />
  );
}
