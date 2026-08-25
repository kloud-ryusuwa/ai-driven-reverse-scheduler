"use client";

import { useState } from "react";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import type { SubTask } from "@/types/task";

type Props = {
  subtasks: SubTask[];
  createdAt: string;
  deadline: string;
  onResize: (subtaskId: string, estimatedHours: number) => Promise<void>;
};

const formatDate = (date: Date) => new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(date);

export default function ProjectGantt({ subtasks, createdAt, deadline, onResize }: Props) {
  const [drag, setDrag] = useState<{ id: string; startX: number; initialHours: number; hours: number } | null>(null);
  const start = new Date(createdAt);
  const end = new Date(`${deadline}T23:59:59`);
  const hoursFor = (task: SubTask) => drag?.id === task.id ? drag.hours : task.estimatedHours;
  const totalHours = Math.max(subtasks.reduce((sum, task) => sum + hoursFor(task), 0), 1);
  const taskPositions = subtasks.map((task, index) => ({
    task,
    consumed: subtasks.slice(0, index).reduce((sum, item) => sum + hoursFor(item), 0),
  }));
  const dateAt = (hours: number) => new Date(start.getTime() + (end.getTime() - start.getTime()) * hours / totalHours);

  const finishDrag = async () => {
    if (!drag) return;
    const result = drag;
    setDrag(null);
    if (result.hours !== result.initialHours) await onResize(result.id, result.hours);
  };

  return (
    <Box sx={{ overflowX: "auto", pb: 1 }}>
      <Box sx={{ minWidth: 700 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ ml: 30, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">開始 {formatDate(start)}</Typography>
          <Typography variant="caption" color="text.secondary">期日 {formatDate(end)}</Typography>
        </Stack>
        <Stack spacing={1.25}>
          {taskPositions.map(({ task, consumed }) => {
            const hours = hoursFor(task);
            const width = Math.max((hours / totalHours) * 100, 4);
            const left = (consumed / totalHours) * 100;
            return (
              <Stack key={task.id} direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 224, flexShrink: 0, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 650, textDecoration: task.isDone ? "line-through" : "none", color: task.isDone ? "text.secondary" : "text.primary" }}>{task.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDate(dateAt(consumed))} → {formatDate(dateAt(consumed + hours))} · {hours.toFixed(1)}時間</Typography>
                </Box>
                <Box sx={{ position: "relative", flex: 1, height: 34, borderRadius: 1, bgcolor: "#f0f2f7", backgroundImage: "linear-gradient(90deg, rgba(70,80,100,.08) 1px, transparent 1px)", backgroundSize: "25% 100%" }}>
                  <Box sx={{ position: "absolute", left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, minWidth: 24, height: "100%", borderRadius: 1, bgcolor: task.isDone ? "#7d8aa5" : "primary.main", opacity: task.isDone ? .65 : 1 }}>
                    <Tooltip title="ドラッグして所要時間を変更" placement="top">
                      <Box role="slider" tabIndex={0} aria-label={`${task.title}の所要時間`} aria-valuenow={hours}
                        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDrag({ id: task.id, startX: event.clientX, initialHours: task.estimatedHours, hours: task.estimatedHours }); }}
                        onPointerMove={(event) => { if (drag?.id !== task.id) return; const timelineWidth = event.currentTarget.parentElement?.parentElement?.clientWidth ?? 600; const delta = (event.clientX - drag.startX) / timelineWidth * totalHours; setDrag({ ...drag, hours: Math.max(.5, Math.round((drag.initialHours + delta) * 2) / 2) }); }}
                        onPointerUp={() => void finishDrag()} onPointerCancel={() => setDrag(null)}
                        sx={{ position: "absolute", right: -6, top: 3, bottom: 3, width: 13, borderRadius: 5, bgcolor: "common.white", border: "2px solid", borderColor: task.isDone ? "#7d8aa5" : "primary.main", cursor: "ew-resize", touchAction: "none", boxShadow: 1 }} />
                    </Tooltip>
                  </Box>
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
