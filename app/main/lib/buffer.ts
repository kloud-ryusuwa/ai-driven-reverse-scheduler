import { getStatusFromBuffer } from "@/utils/calculations";
import type { BufferStatus, Project, ProjectRecord, ProjectSummary, SubTask } from "./types";

export function parseDeadline(deadline: string): Date {
  // YYYY-MM-DD を UTC 0時として扱う
  return new Date(`${deadline}T00:00:00.000Z`);
}

export function hoursUntilDeadline(deadline: string, from = new Date()): number {
  const target = parseDeadline(deadline);
  const diffMs = target.getTime() - from.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

export function remainingHours(subtasks: SubTask[]): number {
  return subtasks.filter((s) => !s.isDone).reduce((sum, s) => sum + s.estimatedHours, 0);
}

export function calculateBufferStatus(record: ProjectRecord, now = new Date()): BufferStatus {
  const remainingTime = hoursUntilDeadline(record.deadline, now);
  const remHours = remainingHours(record.subtasks);

  const ePlan = record.initialTotalHours * 1.2;
  const bInit = record.initialRemainingTime - ePlan;
  const bCurrent = remainingTime - remHours * 1.2;
  // 初期バッファがゼロ付近だと、わずかな工数変更を極端な割合へ
  // 増幅してしまう。計画工数の20%（最低1時間）を安定化幅として使う。
  const stableBufferBase = Math.max(bInit, ePlan * 0.2, 1);
  const bufferPercentage = Math.min(100, Math.round((bCurrent / stableBufferBase) * 100));

  const status = getStatusFromBuffer(bufferPercentage);

  return {
    projectId: record.id,
    status,
    bufferPercentage,
    remainingTime,
    remainingHours: remHours,
    initialRemainingTime: record.initialRemainingTime,
    initialTotalHours: record.initialTotalHours,
  };
}

export function toProjectSummary(record: ProjectRecord): ProjectSummary {
  const status = calculateBufferStatus(record);
  const completedSubtasks = record.subtasks.filter((s) => s.isDone).length;

  return {
    id: record.id,
    title: record.title,
    deadline: record.deadline,
    status: status.status,
    bufferPercentage: status.bufferPercentage,
    completedSubtasks,
    totalSubtasks: record.subtasks.length,
  };
}

export function toProject(record: ProjectRecord): Project {
  return {
    ...toProjectSummary(record),
    initialRemainingTime: record.initialRemainingTime,
    initialTotalHours: record.initialTotalHours,
    subtasks: record.subtasks,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
