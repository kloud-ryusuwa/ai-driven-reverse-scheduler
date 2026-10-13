import { hoursUntilDeadline, toProjectSummary } from "@/lib/buffer";
import { getDemoNow } from "@/lib/demo";
import { generateId } from "@/lib/id";
import type {
  CreateEvaluationInput,
  CreateProjectInput,
  CreateSubtaskInput,
  IStoreRepository,
} from "./types";
import type { Evaluation, History, ProjectRecord, SubTask } from "@/lib/types";

type StoreState = {
  projects: ProjectRecord[];
  histories: History[];
  evaluations: Evaluation[];
};

export class InMemoryStoreRepository implements IStoreRepository {
  constructor(private store: StoreState) {}

  // Projects
  createProject(input: CreateProjectInput): ProjectRecord {
    const demoNow = getDemoNow();
    const now = demoNow.toISOString();
    const projectId = generateId("proj");

    const project: ProjectRecord = {
      id: projectId,
      title: input.title,
      deadline: input.deadline,
      initialRemainingTime: hoursUntilDeadline(input.deadline, demoNow),
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

    this.store.projects.push(project);
    return project;
  }

  listProjects(statusFilter?: string): ProjectRecord[] {
    const records = [...this.store.projects];
    if (!statusFilter) return records;
    return records.filter((p) => toProjectSummary(p).status === statusFilter);
  }

  getProject(id: string): ProjectRecord | undefined {
    return this.store.projects.find((p) => p.id === id);
  }

  updateProject(
    id: string,
    patch: { title?: string; deadline?: string }
  ): ProjectRecord | undefined {
    const project = this.getProject(id);
    if (!project) return undefined;

    if (patch.title !== undefined) {
      project.title = patch.title;
    }
    if (patch.deadline !== undefined) {
      project.deadline = patch.deadline;
      project.initialRemainingTime = hoursUntilDeadline(
        patch.deadline,
        new Date(project.createdAt)
      );
    }

    project.updatedAt = getDemoNow().toISOString();
    return project;
  }

  deleteProject(id: string): boolean {
    const before = this.store.projects.length;
    this.store.projects = this.store.projects.filter((p) => p.id !== id);
    const deleted = this.store.projects.length < before;

    if (deleted) {
      const historyIds = this.store.histories
        .filter((h) => h.projectId === id)
        .map((h) => h.id);
      this.store.histories = this.store.histories.filter(
        (h) => h.projectId !== id
      );
      this.store.evaluations = this.store.evaluations.filter(
        (e) => !historyIds.includes(e.historyId)
      );
    }

    return deleted;
  }

  // Subtasks
  getSubtasks(projectId: string): SubTask[] {
    const project = this.getProject(projectId);
    return project ? [...project.subtasks] : [];
  }

  createSubtask(
    projectId: string,
    input: CreateSubtaskInput
  ): SubTask | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    const subtask: SubTask = {
      id: generateId("sub"),
      projectId,
      title: input.title,
      estimatedHours: input.estimatedHours,
      isDone: false,
    };

    project.subtasks.push(subtask);
    project.updatedAt = getDemoNow().toISOString();
    return subtask;
  }

  updateSubtask(
    projectId: string,
    subtaskId: string,
    patch: { title?: string; estimatedHours?: number; isDone?: boolean }
  ): SubTask | undefined {
    const project = this.getProject(projectId);
    if (!project) return undefined;

    const subtask = project.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return undefined;

    if (patch.title !== undefined) subtask.title = patch.title;
    if (patch.estimatedHours !== undefined)
      subtask.estimatedHours = patch.estimatedHours;
    if (patch.isDone !== undefined) subtask.isDone = patch.isDone;

    project.updatedAt = getDemoNow().toISOString();
    return subtask;
  }

  deleteSubtask(projectId: string, subtaskId: string): boolean {
    const project = this.getProject(projectId);
    if (!project) return false;

    const before = project.subtasks.length;
    project.subtasks = project.subtasks.filter((s) => s.id !== subtaskId);
    const deleted = project.subtasks.length < before;
    if (deleted) {
      project.updatedAt = getDemoNow().toISOString();
    }
    return deleted;
  }

  // Histories
  getHistories(projectId: string): History[] {
    return this.store.histories.filter((h) => h.projectId === projectId);
  }

  getHistory(id: string): History | undefined {
    return this.store.histories.find((h) => h.id === id);
  }

  createHistory(projectId: string, content: string): History | undefined {
    if (!this.getProject(projectId)) return undefined;

    const history: History = {
      id: generateId("hist"),
      projectId,
      timestamp: getDemoNow().toISOString(),
      content,
    };

    this.store.histories.push(history);
    return history;
  }

  // Evaluations
  getEvaluation(historyId: string): Evaluation | undefined {
    return this.store.evaluations.find((e) => e.historyId === historyId);
  }

  createEvaluation(
    historyId: string,
    input: CreateEvaluationInput
  ): Evaluation | undefined {
    if (!this.getHistory(historyId)) return undefined;

    const existingIndex = this.store.evaluations.findIndex(
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
      evaluation.id = this.store.evaluations[existingIndex].id;
      this.store.evaluations[existingIndex] = evaluation;
    } else {
      this.store.evaluations.push(evaluation);
    }

    return evaluation;
  }
}
