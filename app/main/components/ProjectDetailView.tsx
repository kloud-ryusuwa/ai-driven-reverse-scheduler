"use client";

import MonitoringPhase from "@/components/MonitoringPhase";
import RightPanel from "@/components/RightPanel";
import ProjectGantt from "@/components/ProjectGantt";
import {
  getDaysLeft,
  getDeadlineLabel,
  getStatusMeta,
  toMainTask,
} from "@/lib/projectViewModel";
import type { BufferStatus, History, Project, TriageProposal } from "@/lib/types";
import { getStatusFromBuffer } from "@/utils/calculations";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export type ProjectDetailViewProps = {
  project: Project;
  status: BufferStatus;
  histories: History[];
  panelMode: "none" | "yellow" | "red";
  onToggleSubtask: (subtaskId: string, isDone: boolean) => void;
  onResizeSubtask: (subtaskId: string, estimatedHours: number) => Promise<void>;
  onOpenPanel: (mode: "yellow" | "red") => void;
  onClosePanel: () => void;
  onTriage: (
    mode: "yellow" | "red",
    context: { goal: string; priority?: string }
  ) => Promise<TriageProposal | null>;
  onApplyProposal: (proposal: TriageProposal) => Promise<void>;
  onAddHistory: (content: string) => Promise<void>;
};

export default function ProjectDetailView({
  project,
  status,
  histories,
  panelMode,
  onToggleSubtask,
  onResizeSubtask,
  onOpenPanel,
  onClosePanel,
  onTriage,
  onApplyProposal,
  onAddHistory,
}: ProjectDetailViewProps) {
  const taskForMonitoring = toMainTask(project, status);
  const currentStatus = getStatusFromBuffer(status.bufferPercentage);
  const statusMeta = getStatusMeta(status.bufferPercentage);
  const deadlineLabel = getDeadlineLabel(project.deadline);
  const daysLeft = getDaysLeft(status.remainingTime);

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: "xl", mx: "auto", px: { xs: 2, md: 3 } }}>
        <Stack direction="row" gap={3} alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack component="header" direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Chip label={statusMeta.label} color={statusMeta.color} size="small" />
                  <Typography variant="caption" color="text.secondary">LIVE</Typography>
                </Stack>
                <Typography variant="h1">{project.title}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <CalendarTodayRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">期日 {deadlineLabel}</Typography>
                </Stack>
              </Box>
            </Stack>

            <Alert severity={statusMeta.color} action={currentStatus !== "green" ? <Button color="inherit" size="small" startIcon={<AutoAwesomeRoundedIcon />} onClick={() => onOpenPanel(currentStatus)}>AIに相談</Button> : undefined} sx={{ mb: 2.5 }}>
              {statusMeta.message}
            </Alert>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 2.5 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">バッファ残存率</Typography>
                  <Stack direction="row" alignItems="end" spacing={1}>
                    <Typography variant="h4" fontWeight={800}>{Math.round(status.bufferPercentage)}%</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ pb: 0.4 }}>余裕</Typography>
                  </Stack>
                  <LinearProgress color={statusMeta.color} variant="determinate" value={Math.max(0, Math.min(status.bufferPercentage, 100))} sx={{ mt: 1.5, height: 6, borderRadius: 4 }} />
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">期日まで</Typography>
                  <Typography variant="h4" fontWeight={800}>{daysLeft}<Typography component="span" variant="body2" color="text.secondary"> 日</Typography></Typography>
                  <Typography variant="caption" color="text.secondary">残り {Math.max(0, Math.round(status.remainingTime))} 時間</Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">未完了の工数</Typography>
                  <Typography variant="h4" fontWeight={800}>{status.remainingHours.toFixed(1)}<Typography component="span" variant="body2" color="text.secondary"> 時間</Typography></Typography>
                  <Typography variant="caption" color="text.secondary">安全係数 1.2 を別途考慮</Typography>
                </CardContent>
              </Card>
            </Box>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h2">逆算ガント</Typography>
                  <Typography variant="body2" color="text.secondary">右端のハンドルをドラッグすると所要時間を変更できます。</Typography>
                </Box>
                <Chip label={`${project.subtasks.length} タスク`} size="small" variant="outlined" />
              </Stack>
              <ProjectGantt subtasks={taskForMonitoring.subtasks} createdAt={project.createdAt} deadline={project.deadline} onResize={onResizeSubtask} />
            </Paper>

            <MonitoringPhase task={taskForMonitoring} onToggleSubtask={onToggleSubtask} onOpenPanel={onOpenPanel} />
          </Box>

          {panelMode !== "none" && (
            <RightPanel mode={panelMode} task={taskForMonitoring} histories={histories} onClose={onClosePanel} onTriage={onTriage} onApplyProposal={onApplyProposal} onAddHistory={onAddHistory} />
          )}
        </Stack>
      </Box>
    </Box>
  );
}
