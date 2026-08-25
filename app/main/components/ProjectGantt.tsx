import { Box, Stack, Typography } from "@mui/material";
import type { SubTask } from "@/types/task";

type Props = { subtasks: SubTask[]; createdAt: string; deadline: string };

const formatDate = (date: Date) => new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(date);

export default function ProjectGantt({ subtasks, createdAt, deadline }: Props) {
  const start = new Date(createdAt);
  const end = new Date(`${deadline}T23:59:59`);
  const totalHours = Math.max(subtasks.reduce((sum, task) => sum + task.estimatedHours, 0), 1);
  const taskPositions = subtasks.map((task, index) => ({
    task,
    left: subtasks.slice(0, index).reduce((sum, item) => sum + item.estimatedHours, 0),
  }));

  return (
    <Box sx={{ overflowX: "auto", pb: 1 }}>
      <Box sx={{ minWidth: 660 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ ml: 28, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">開始 {formatDate(start)}</Typography>
          <Typography variant="caption" color="text.secondary">期日 {formatDate(end)}</Typography>
        </Stack>
        <Stack spacing={1.25}>
          {taskPositions.map(({ task, left: consumedHours }) => {
            const width = Math.max((task.estimatedHours / totalHours) * 100, 4);
            const left = (consumedHours / totalHours) * 100;
            return (
              <Stack key={task.id} direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 208, flexShrink: 0, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 650, textDecoration: task.isDone ? "line-through" : "none", color: task.isDone ? "text.secondary" : "text.primary" }}>{task.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{task.estimatedHours}時間</Typography>
                </Box>
                <Box sx={{ position: "relative", flex: 1, height: 30, borderRadius: 1, bgcolor: "#f0f2f7", backgroundImage: "linear-gradient(90deg, rgba(70,80,100,.08) 1px, transparent 1px)", backgroundSize: "25% 100%" }}>
                  <Box sx={{ position: "absolute", left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, height: "100%", borderRadius: 1, bgcolor: task.isDone ? "#7d8aa5" : "primary.main", opacity: task.isDone ? .65 : 1 }} />
                </Box>
              </Stack>
            );
          })}
        </Stack>
        {subtasks.length === 0 && <Typography color="text.secondary">表示できるタスクがありません。</Typography>}
      </Box>
    </Box>
  );
}
