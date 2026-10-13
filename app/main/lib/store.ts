import type { Evaluation, History, ProjectRecord, SubTask } from "./types";
import { InMemoryStoreRepository } from "./repositories/inMemoryStore";
import type { IStoreRepository } from "./repositories/types";
import { generateId } from "./id";

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

const repository: IStoreRepository = new InMemoryStoreRepository(store);

export { generateId };

export const createProject = (input: {
  title: string;
  deadline: string;
  initialTotalHours: number;
  subtasks: { title: string; estimatedHours: number }[];
}): ProjectRecord => repository.createProject(input);

export const listProjects = (statusFilter?: string): ProjectRecord[] =>
  repository.listProjects(statusFilter);

export const getProject = (id: string): ProjectRecord | undefined =>
  repository.getProject(id);

export const updateProject = (
  id: string,
  patch: { title?: string; deadline?: string }
): ProjectRecord | undefined => repository.updateProject(id, patch);

export const deleteProject = (id: string): boolean =>
  repository.deleteProject(id);

export const getSubtasks = (projectId: string): SubTask[] =>
  repository.getSubtasks(projectId);

export const createSubtask = (
  projectId: string,
  input: { title: string; estimatedHours: number }
): SubTask | undefined => repository.createSubtask(projectId, input);

export const updateSubtask = (
  projectId: string,
  subtaskId: string,
  patch: { title?: string; estimatedHours?: number; isDone?: boolean }
): SubTask | undefined => repository.updateSubtask(projectId, subtaskId, patch);

export const deleteSubtask = (projectId: string, subtaskId: string): boolean =>
  repository.deleteSubtask(projectId, subtaskId);

export const getHistories = (projectId: string): History[] =>
  repository.getHistories(projectId);

export const getHistory = (id: string): History | undefined =>
  repository.getHistory(id);

export const createHistory = (
  projectId: string,
  content: string
): History | undefined => repository.createHistory(projectId, content);

export const getEvaluation = (historyId: string): Evaluation | undefined =>
  repository.getEvaluation(historyId);

export const createEvaluation = (
  historyId: string,
  input: {
    triageAccuracy: number;
    psychologicalRelief: number;
    feasibility: number;
    comment?: string;
  }
): Evaluation | undefined => repository.createEvaluation(historyId, input);

export { InMemoryStoreRepository };
export type { IStoreRepository };
