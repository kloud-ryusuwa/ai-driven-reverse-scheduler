import type { Evaluation, History, ProjectRecord, SubTask } from "@/lib/types";

export type CreateProjectInput = {
  title: string;
  deadline: string;
  initialTotalHours: number;
  subtasks: { title: string; estimatedHours: number }[];
};

export type CreateSubtaskInput = {
  title: string;
  estimatedHours: number;
};

export type CreateEvaluationInput = {
  triageAccuracy: number;
  psychologicalRelief: number;
  feasibility: number;
  comment?: string;
};

/**
 * アプリケーションの永続化データへアクセスするための Repository インターフェース。
 * 現状はインメモリ実装だが、将来的に SQLite 等の実装に差し替え可能。
 */
export interface IStoreRepository {
  // Projects
  createProject(input: CreateProjectInput): ProjectRecord;
  listProjects(statusFilter?: string): ProjectRecord[];
  getProject(id: string): ProjectRecord | undefined;
  updateProject(
    id: string,
    patch: { title?: string; deadline?: string }
  ): ProjectRecord | undefined;
  deleteProject(id: string): boolean;

  // Subtasks
  getSubtasks(projectId: string): SubTask[];
  createSubtask(
    projectId: string,
    input: CreateSubtaskInput
  ): SubTask | undefined;
  updateSubtask(
    projectId: string,
    subtaskId: string,
    patch: { title?: string; estimatedHours?: number; isDone?: boolean }
  ): SubTask | undefined;
  deleteSubtask(projectId: string, subtaskId: string): boolean;

  // Histories
  getHistories(projectId: string): History[];
  getHistory(id: string): History | undefined;
  createHistory(projectId: string, content: string): History | undefined;

  // Evaluations
  getEvaluation(historyId: string): Evaluation | undefined;
  createEvaluation(
    historyId: string,
    input: CreateEvaluationInput
  ): Evaluation | undefined;
}
