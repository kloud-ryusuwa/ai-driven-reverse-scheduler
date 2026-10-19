import type { Clock } from "./clock";
import { DemoClock } from "./clock";
import { generateId } from "./id";
import { InMemoryStoreRepository } from "./repositories/inMemoryStore";
import type { IStoreRepository } from "./repositories/types";
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

type StoreState = {
  projects: ProjectRecord[];
  histories: History[];
  evaluations: Evaluation[];
};

function createStoreState(): StoreState {
  const existing = globalThis.__ADS_STORE;
  if (existing) return existing as StoreState;
  const state = { projects: [], histories: [], evaluations: [] };
  globalThis.__ADS_STORE = state;
  return state;
}

function buildStoreApi(repository: IStoreRepository) {
  return {
    createProject: (input: {
      title: string;
      deadline: string;
      initialTotalHours: number;
      subtasks: { title: string; estimatedHours: number }[];
    }): ProjectRecord => repository.createProject(input),

    listProjects: (statusFilter?: string): ProjectRecord[] =>
      repository.listProjects(statusFilter),

    getProject: (id: string): ProjectRecord | undefined =>
      repository.getProject(id),

    updateProject: (
      id: string,
      patch: { title?: string; deadline?: string }
    ): ProjectRecord | undefined => repository.updateProject(id, patch),

    deleteProject: (id: string): boolean => repository.deleteProject(id),

    getSubtasks: (projectId: string): SubTask[] =>
      repository.getSubtasks(projectId),

    createSubtask: (
      projectId: string,
      input: { title: string; estimatedHours: number }
    ): SubTask | undefined => repository.createSubtask(projectId, input),

    updateSubtask: (
      projectId: string,
      subtaskId: string,
      patch: { title?: string; estimatedHours?: number; isDone?: boolean }
    ): SubTask | undefined =>
      repository.updateSubtask(projectId, subtaskId, patch),

    deleteSubtask: (projectId: string, subtaskId: string): boolean =>
      repository.deleteSubtask(projectId, subtaskId),

    getHistories: (projectId: string): History[] =>
      repository.getHistories(projectId),

    getHistory: (id: string): History | undefined => repository.getHistory(id),

    createHistory: (
      projectId: string,
      content: string
    ): History | undefined => repository.createHistory(projectId, content),

    getEvaluation: (historyId: string): Evaluation | undefined =>
      repository.getEvaluation(historyId),

    createEvaluation: (
      historyId: string,
      input: {
        triageAccuracy: number;
        psychologicalRelief: number;
        feasibility: number;
        comment?: string;
      }
    ): Evaluation | undefined => repository.createEvaluation(historyId, input),
  };
}

export function createStore(clock: Clock, state?: StoreState) {
  const store = state ?? createStoreState();
  const repository: IStoreRepository = new InMemoryStoreRepository(
    store,
    clock
  );
  return buildStoreApi(repository);
}

// Next.js アプリケーション用のシングルトン: デモ時計を注入
const appStore = createStore(new DemoClock());

export { generateId };

export const createProject = appStore.createProject;
export const listProjects = appStore.listProjects;
export const getProject = appStore.getProject;
export const updateProject = appStore.updateProject;
export const deleteProject = appStore.deleteProject;
export const getSubtasks = appStore.getSubtasks;
export const createSubtask = appStore.createSubtask;
export const updateSubtask = appStore.updateSubtask;
export const deleteSubtask = appStore.deleteSubtask;
export const getHistories = appStore.getHistories;
export const getHistory = appStore.getHistory;
export const createHistory = appStore.createHistory;
export const getEvaluation = appStore.getEvaluation;
export const createEvaluation = appStore.createEvaluation;

export { InMemoryStoreRepository };
export type { IStoreRepository };
