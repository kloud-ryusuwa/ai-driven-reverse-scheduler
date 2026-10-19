import { beforeEach, describe, expect, it } from "vitest";
import { createStore } from "@/lib/store";
import { FixedClock } from "@/lib/clock";
import type { Evaluation, History, ProjectRecord } from "@/lib/types";

const FIXED_NOW = new Date("2026-08-20T09:00:00.000Z");

function createTestStore() {
  const state = {
    projects: [] as ProjectRecord[],
    histories: [] as History[],
    evaluations: [] as Evaluation[],
  };
  return { ...createStore(new FixedClock(FIXED_NOW), state), state };
}

const createSampleProject = (
  store: ReturnType<typeof createTestStore>
): ProjectRecord =>
  store.createProject({
    title: "プレゼン資料作成",
    deadline: "2026-09-10",
    initialTotalHours: 80,
    subtasks: [
      { title: "構成案作成", estimatedHours: 8 },
      { title: "スライド作成", estimatedHours: 16 },
    ],
  });

describe("store", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe("store.createProject", () => {
    it("プロジェクトを作成し、サブタスクを紐づける", () => {
      const project = createSampleProject(store);
      expect(project.title).toBe("プレゼン資料作成");
      expect(project.subtasks).toHaveLength(2);
      expect(project.subtasks[0].projectId).toBe(project.id);
      expect(project.id).toMatch(/^proj_/);
    });

    it("initialRemainingTime に計画時点の残り時間を設定する", () => {
      const project = createSampleProject(store);
      expect(project.initialRemainingTime).toBeGreaterThan(0);
    });
  });

  describe("store.listProjects", () => {
    it("すべてのプロジェクトを返す", () => {
      createSampleProject(store);
      createSampleProject(store);
      expect(store.listProjects()).toHaveLength(2);
    });
  });

  describe("store.getProject", () => {
    it("存在するプロジェクトを取得する", () => {
      const created = createSampleProject(store);
      const found = store.getProject(created.id);
      expect(found).not.toBeUndefined();
      expect(found?.id).toBe(created.id);
    });

    it("存在しない場合は undefined を返す", () => {
      expect(store.getProject("proj_not_exist")).toBeUndefined();
    });
  });

  describe("store.updateProject", () => {
    it("タイトルを更新できる", () => {
      const created = createSampleProject(store);
      const updated = store.updateProject(created.id, { title: "新しいタイトル" });
      expect(updated?.title).toBe("新しいタイトル");
      expect(store.getProject(created.id)?.title).toBe("新しいタイトル");
    });

    it("期日を更新すると initialRemainingTime が再計算される", () => {
      const created = createSampleProject(store);
      const oldRemainingTime = created.initialRemainingTime;
      const updated = store.updateProject(created.id, { deadline: "2026-12-31" });
      expect(updated?.deadline).toBe("2026-12-31");
      expect(updated?.initialRemainingTime).toBeGreaterThan(oldRemainingTime);
    });

    it("存在しないプロジェクトは undefined を返す", () => {
      expect(store.updateProject("proj_not_exist", { title: "x" })).toBeUndefined();
    });
  });

  describe("store.deleteProject", () => {
    it("プロジェクトを削除できる", () => {
      const created = createSampleProject(store);
      expect(store.deleteProject(created.id)).toBe(true);
      expect(store.getProject(created.id)).toBeUndefined();
    });
  });

  describe("subtasks", () => {
    it("サブタスクを追加できる", () => {
      const created = createSampleProject(store);
      const subtask = store.createSubtask(created.id, { title: "レビュー", estimatedHours: 4 });
      expect(subtask).not.toBeUndefined();
      expect(store.getSubtasks(created.id)).toHaveLength(3);
    });

    it("サブタスクを更新できる", () => {
      const created = createSampleProject(store);
      const subtaskId = created.subtasks[0].id;
      const updated = store.updateSubtask(created.id, subtaskId, { isDone: true });
      expect(updated?.isDone).toBe(true);
    });

    it("サブタスクを削除できる", () => {
      const created = createSampleProject(store);
      const subtaskId = created.subtasks[0].id;
      expect(store.deleteSubtask(created.id, subtaskId)).toBe(true);
      expect(store.getSubtasks(created.id)).toHaveLength(1);
    });
  });
});
