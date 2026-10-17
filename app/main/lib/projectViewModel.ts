import type { AlertColor } from "@mui/material";
import type { BufferStatus, MainTask, Project } from "./types";
import { getStatusFromBuffer } from "@/utils/calculations";

export function toMainTask(project: Project, _status: BufferStatus): MainTask {
  const completedSubtasks = project.subtasks.filter((s) => s.isDone).length;
  return {
    id: project.id,
    title: project.title,
    deadline: project.deadline,
    bufferPercentage: _status.bufferPercentage,
    completedSubtasks,
    totalSubtasks: project.subtasks.length,
    subtasks: project.subtasks.map((s) => ({
      id: s.id,
      projectId: project.id,
      title: s.title,
      isDone: s.isDone,
      estimatedHours: s.estimatedHours,
    })),
  };
}

export function getStatusMeta(bufferPercentage: number): {
  label: string;
  color: AlertColor;
  message: string;
} {
  const status = getStatusFromBuffer(bufferPercentage);
  switch (status) {
    case "green":
      return {
        label: "順調",
        color: "success",
        message: "現在の計画で期日に到達できる見込みです。",
      };
    case "yellow":
      return {
        label: "要注意",
        color: "warning",
        message: "余裕が減っています。今のうちに優先度を見直しましょう。",
      };
    case "red":
      return {
        label: "危機",
        color: "error",
        message: "現行スコープでは期日超過の可能性があります。削減判断が必要です。",
      };
  }
}

export function getDeadlineLabel(deadline: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${deadline}T00:00:00`));
}

export function getDaysLeft(remainingTime: number): number {
  return Math.max(0, Math.ceil(remainingTime / 24));
}
