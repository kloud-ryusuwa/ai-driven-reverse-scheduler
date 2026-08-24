import crypto from "crypto";
import { hoursUntilDeadline } from "./buffer";
import { toProjectSummary } from "./buffer";
import type { Evaluation, History, ProjectRecord, SubTask } from "./types";

declare global {
  var __ADS_STORE:
    | {
        projects: ProjectRecord[];
        histories: History[];
        evaluations: Evaluation[];
      }
    | undefined;
}

const store = globalThis.__ADS_STORE ?? {
  projects: [],
  histories: [],
  evaluations: [],
};
globalThis.__ADS_STORE = store;

export const generateId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export function createProject(input: {
  title: string;
  deadline: string;
  initialTotalHours: number;
  subtasks: { title: string; estimatedHours: number }[];
}): ProjectRecord {
  const now = new Date().toISOString();
  const projectId = generateId("proj");

  const project: ProjectRecord = {
    id: projectId,
    title: input.title,
    deadline: input.deadline,
    initialRemainingTime: hoursUntilDeadline(input.deadline),
    initialTotalHours: input.initialTotalHours,
    subtasks: input.subtasks.map((s) => ({
      id: generateId("sub"),
      projectId,
      title: s.title,
      estimatedHours: s.estimatedHours,
      isDone: false,
    })),
    createdAt: now,
    updatedAt: now,
  };

  store.projects.push(project);
  return project;
}

export function listProjects(statusFilter?: string): ProjectRecord[] {
  const records = [...store.projects];
  if (!statusFilter) return records;
  return records.filter((p) => toProjectSummary(p).status === statusFilter);
}

export function getProject(id: string): ProjectRecord | undefined {
  return store.projects.find((p) => p.id === id);
}

export function updateProject(
  id: string,
  patch: { title?: string; deadline?: string }
): ProjectRecord | undefined {
  const project = getProject(id);
  if (!project) return undefined;

  if (patch.title !== undefined) {
    project.title = patch.title;
  }
  if (patch.deadline !== undefined) {
    project.deadline = patch.deadline;
    // 計画時点（作成日）から新しい期日までの時間を再計算
    project.initialRemainingTime = hoursUntilDeadline(
      patch.deadline,
      new Date(project.createdAt)
    );
  }

  project.updatedAt = new Date().toISOString();
  return project;
}

export function deleteProject(id: string): boolean {
  const before = store.projects.length;
  store.projects = store.projects.filter((p) => p.id !== id);
  const deleted = store.projects.length < before;

  if (deleted) {
    const historyIds = store.histories
      .filter((h) => h.projectId === id)
      .map((h) => h.id);
    store.histories = store.histories.filter((h) => h.projectId !== id);
    store.evaluations = store.evaluations.filter(
      (e) => !historyIds.includes(e.historyId)
    );
  }

  return deleted;
}

export function getSubtasks(projectId: string): SubTask[] {
  const project = getProject(projectId);
  return project ? [...project.subtasks] : [];
}

export function createSubtask(
  projectId: string,
  input: { title: string; estimatedHours: number }
): SubTask | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;

  const subtask: SubTask = {
    id: generateId("sub"),
    projectId,
    title: input.title,
    estimatedHours: input.estimatedHours,
    isDone: false,
  };

  project.subtasks.push(subtask);
  project.updatedAt = new Date().toISOString();
  return subtask;
}

export function updateSubtask(
  projectId: string,
  subtaskId: string,
  patch: { title?: string; estimatedHours?: number; isDone?: boolean }
): SubTask | undefined {
  const project = getProject(projectId);
  if (!project) return undefined;

  const subtask = project.subtasks.find((s) => s.id === subtaskId);
  if (!subtask) return undefined;

  if (patch.title !== undefined) subtask.title = patch.title;
  if (patch.estimatedHours !== undefined)
    subtask.estimatedHours = patch.estimatedHours;
  if (patch.isDone !== undefined) subtask.isDone = patch.isDone;

  project.updatedAt = new Date().toISOString();
  return subtask;
}

export function deleteSubtask(projectId: string, subtaskId: string): boolean {
  const project = getProject(projectId);
  if (!project) return false;

  const before = project.subtasks.length;
  project.subtasks = project.subtasks.filter((s) => s.id !== subtaskId);
  const deleted = project.subtasks.length < before;
  if (deleted) {
    project.updatedAt = new Date().toISOString();
  }
  return deleted;
}

export function getHistories(projectId: string): History[] {
  return store.histories.filter((h) => h.projectId === projectId);
}

export function getHistory(id: string): History | undefined {
  return store.histories.find((h) => h.id === id);
}

export function createHistory(
  projectId: string,
  content: string
): History | undefined {
  if (!getProject(projectId)) return undefined;

  const history: History = {
    id: generateId("hist"),
    projectId,
    timestamp: new Date().toISOString(),
    content,
  };

  store.histories.push(history);
  return history;
}

export function getEvaluation(historyId: string): Evaluation | undefined {
  return store.evaluations.find((e) => e.historyId === historyId);
}

export function createEvaluation(
  historyId: string,
  input: {
    triageAccuracy: number;
    psychologicalRelief: number;
    feasibility: number;
    comment?: string;
  }
): Evaluation | undefined {
  const existingIndex = store.evaluations.findIndex(
    (e) => e.historyId === historyId
  );

  const evaluation: Evaluation = {
    id: generateId("eval"),
    historyId,
    triageAccuracy: input.triageAccuracy,
    psychologicalRelief: input.psychologicalRelief,
    feasibility: input.feasibility,
    comment: input.comment,
  };

  if (existingIndex >= 0) {
    evaluation.id = store.evaluations[existingIndex].id;
    store.evaluations[existingIndex] = evaluation;
  } else {
    store.evaluations.push(evaluation);
  }

  return evaluation;
}
