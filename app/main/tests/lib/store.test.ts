import { beforeEach, describe, expect, it } from "vitest";
import {
  createHistory,
  createProject,
  createSubtask,
  deleteProject,
  deleteSubtask,
  getProject,
  getSubtasks,
  listProjects,
  updateProject,
  updateSubtask,
} from "@/lib/store";
import { updateDemoSettings } from "@/lib/demo";
import type { ProjectRecord } from "@/lib/types";

function resetStore() {
  const store = globalThis.__ADS_STORE;
  if (store) {
    store.projects.length = 0;
    store.histories.length = 0;
    store.evaluations.length = 0;
  }
}

const createSampleProject = (): ProjectRecord =>
  createProject({
    title: "プレゼン資料作成",
    deadline: "2026-09-10",
    initialTotalHours: 80,
    subtasks: [
      { title: "構成案作成", estimatedHours: 8 },
      { title: "スライド作成", estimatedHours: 16 },
    ],
  });

describe("store", () => {
  beforeEach(() => {
    resetStore();
    // createProject が使う現在日時を期日より前に固定
    updateDemoSettings({ now: "2026-08-20T09:00:00.000Z" });
  });

  describe("createProject", () => {
    it("プロジェクトを作成し、サブタスクを紐づける", () => {
      const project = createSampleProject();
      expect(project.title).toBe("プレゼン資料作成");
      expect(project.subtasks).toHaveLength(2);
      expect(project.subtasks[0].projectId).toBe(project.id);
      expect(project.id).toMatch(/^proj_/);
    });

    it("initialRemainingTime に計画時点の残り時間を設定する", () => {
      const project = createSampleProject();
      expect(project.initialRemainingTime).toBeGreaterThan(0);
    });
  });

  describe("listProjects", () => {
    it("すべてのプロジェクトを返す", () => {
      createSampleProject();
      createSampleProject();
      expect(listProjects()).toHaveLength(2);
    });
  });

  describe("getProject", () => {
    it("存在するプロジェクトを取得する", () => {
      const created = createSampleProject();
      const found = getProject(created.id);
      expect(found).not.toBeUndefined();
      expect(found?.id).toBe(created.id);
    });

    it("存在しない場合は undefined を返す", () => {
      expect(getProject("proj_not_exist")).toBeUndefined();
    });
  });

  describe("updateProject", () => {
    it("タイトルを更新できる", () => {
      const created = createSampleProject();
      const updated = updateProject(created.id, { title: "新しいタイトル" });
      expect(updated?.title).toBe("新しいタイトル");
      expect(getProject(created.id)?.title).toBe("新しいタイトル");
    });

    it("期日を更新すると initialRemainingTime が再計算される", () => {
      const created = createSampleProject();
      const oldRemainingTime = created.initialRemainingTime;
      const updated = updateProject(created.id, { deadline: "2026-12-31" });
      expect(updated?.deadline).toBe("2026-12-31");
      expect(updated?.initialRemainingTime).toBeGreaterThan(oldRemainingTime);
    });

    it("存在しないプロジェクトは undefined を返す", () => {
      expect(updateProject("proj_not_exist", { title: "x" })).toBeUndefined();
    });
  });

  describe("deleteProject", () => {
    it("プロジェクトを削除できる", () => {
      const created = createSampleProject();
      expect(deleteProject(created.id)).toBe(true);
      expect(getProject(created.id)).toBeUndefined();
    });
  });

  describe("subtasks", () => {
    it("サブタスクを追加できる", () => {
      const created = createSampleProject();
      const subtask = createSubtask(created.id, { title: "レビュー", estimatedHours: 4 });
      expect(subtask).not.toBeUndefined();
      expect(getSubtasks(created.id)).toHaveLength(3);
    });

    it("サブタスクを更新できる", () => {
      const created = createSampleProject();
      const subtaskId = created.subtasks[0].id;
      const updated = updateSubtask(created.id, subtaskId, { isDone: true });
      expect(updated?.isDone).toBe(true);
    });

    it("サブタスクを削除できる", () => {
      const created = createSampleProject();
      const subtaskId = created.subtasks[0].id;
      expect(deleteSubtask(created.id, subtaskId)).toBe(true);
      expect(getSubtasks(created.id)).toHaveLength(1);
    });
  });
});
