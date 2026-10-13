import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryStoreRepository } from "@/lib/repositories/inMemoryStore";
import { updateDemoSettings } from "@/lib/demo";
import type { ProjectRecord } from "@/lib/types";

function createStore() {
  return {
    projects: [] as ProjectRecord[],
    histories: [],
    evaluations: [],
  };
}

function createSampleProject(repo: InMemoryStoreRepository): ProjectRecord {
  return repo.createProject({
    title: "プレゼン資料作成",
    deadline: "2026-09-10",
    initialTotalHours: 80,
    subtasks: [
      { title: "構成案作成", estimatedHours: 8 },
      { title: "スライド作成", estimatedHours: 16 },
    ],
  });
}

describe("InMemoryStoreRepository", () => {
  beforeEach(() => {
    updateDemoSettings({ now: "2026-08-20T09:00:00.000Z" });
  });

  describe("createProject / getProject", () => {
    it("プロジェクトを作成・取得できる", () => {
      const store = createStore();
      const repo = new InMemoryStoreRepository(store);
      const project = createSampleProject(repo);

      expect(repo.getProject(project.id)?.title).toBe("プレゼン資料作成");
      expect(store.projects).toHaveLength(1);
    });
  });

  describe("deleteProject", () => {
    it("プロジェクト削除時に紐づく履歴・評価も削除する", () => {
      const store = createStore();
      const repo = new InMemoryStoreRepository(store);
      const project = createSampleProject(repo);
      const history = repo.createHistory(project.id, "first")!;
      repo.createEvaluation(history.id, {
        triageAccuracy: 5,
        psychologicalRelief: 5,
        feasibility: 5,
      });

      expect(store.histories).toHaveLength(1);
      expect(store.evaluations).toHaveLength(1);

      const deleted = repo.deleteProject(project.id);
      expect(deleted).toBe(true);
      expect(store.projects).toHaveLength(0);
      expect(store.histories).toHaveLength(0);
      expect(store.evaluations).toHaveLength(0);
    });
  });

  describe("createSubtask / updateSubtask / deleteSubtask", () => {
    it("サブタスクのライフサイクルを管理する", () => {
      const store = createStore();
      const repo = new InMemoryStoreRepository(store);
      const project = createSampleProject(repo);

      const sub = repo.createSubtask(project.id, {
        title: "追加タスク",
        estimatedHours: 4,
      })!;
      expect(repo.getSubtasks(project.id)).toHaveLength(3);

      repo.updateSubtask(project.id, sub.id, { isDone: true });
      expect(repo.getSubtasks(project.id)[2].isDone).toBe(true);

      repo.deleteSubtask(project.id, sub.id);
      expect(repo.getSubtasks(project.id)).toHaveLength(2);
    });
  });

  describe("listProjects with statusFilter", () => {
    it("status フィルタが動作する", () => {
      const store = createStore();
      const repo = new InMemoryStoreRepository(store);
      const greenProject = createSampleProject(repo);

      const redProject = repo.createProject({
        title: "緊急プロジェクト",
        deadline: "2026-09-10",
        initialTotalHours: 500,
        subtasks: [{ title: "大量作業", estimatedHours: 500 }],
      });

      expect(repo.listProjects("green")).toHaveLength(1);
      expect(repo.listProjects("green")[0].id).toBe(greenProject.id);

      expect(repo.listProjects("red")).toHaveLength(1);
      expect(repo.listProjects("red")[0].id).toBe(redProject.id);

      expect(repo.listProjects()).toHaveLength(2);
    });
  });
});
