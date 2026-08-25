import { MainTask } from "../types/task";
import { getStatusFromBuffer } from "../utils/calculations";
import { Box, Button, Checkbox, Chip, LinearProgress, List, ListItem, ListItemButton, ListItemText, Paper, Stack, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

export type { MainTask } from "../types/task";

type MonitoringPhaseProps = {
  task: MainTask;
  onToggleSubtask?: (subtaskId: string, isDone: boolean) => void;
  onOpenPanel?: (mode: "yellow" | "red", task: MainTask) => void;
};

export default function MonitoringPhase({
  task,
  onToggleSubtask,
  onOpenPanel,
}: MonitoringPhaseProps) {
  const status = getStatusFromBuffer(task.bufferPercentage);
  const progress =
    task.totalSubtasks === 0
      ? 0
      : (task.completedSubtasks / task.totalSubtasks) * 100
  ;
  const color = status === "green" ? "success" : status === "yellow" ? "warning" : "error";
  const label = status === "green" ? "順調" : status === "yellow" ? "要注意" : "要トリアージ";

  return (
    <Box component="section">
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 2 }}>
        <Box><Typography variant="h2">実行タスク</Typography><Typography variant="body2" color="text.secondary">完了すると残工数とバッファが即時に再計算されます。</Typography></Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip color={color} label={label} size="small" />
          {status !== "green" && onOpenPanel && <Button color={color} variant="contained" startIcon={<AutoAwesomeRoundedIcon />} onClick={() => onOpenPanel(status, task)}>AIと立て直す</Button>}
        </Stack>
      </Stack>
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 2, bgcolor: "#fafbfe" }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}><Typography variant="body2" fontWeight={700}>全体進捗</Typography><Typography variant="body2" color="text.secondary">{task.completedSubtasks} / {task.totalSubtasks} 完了</Typography></Stack>
          <LinearProgress variant="determinate" value={progress} color={color} sx={{ height: 8, borderRadius: 10 }} />
        </Box>
        <List disablePadding>
          {task.subtasks.map((sub) => (
            <ListItem key={sub.id} disablePadding divider>
              <ListItemButton component="label">
              <Checkbox
                checked={sub.isDone}
                onChange={(e) => onToggleSubtask?.(sub.id, e.target.checked)}
              />
              <ListItemText primary={sub.title} secondary={sub.isDone ? "完了" : "未完了"} slotProps={{ primary: { sx: { fontWeight: 650, textDecoration: sub.isDone ? "line-through" : "none" } } }} />
              <Chip label={`${sub.estimatedHours}h`} size="small" variant="outlined" />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
