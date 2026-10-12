import { beforeEach, describe, expect, it } from "vitest";
import { createHistory, createProject, deleteProject, getHistory, getHistories } from "@/lib/store";
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
    subtasks: [{ title: "構成案作成", estimatedHours: 8 }],
  });

describe("store - histories", () => {
  beforeEach(() => {
    resetStore();
    updateDemoSettings({ now: "2026-08-20T09:00:00.000Z" });
  });

  it("履歴を追加・取得できる", () => {
    const created = createSampleProject();
    const history = createHistory(created.id, "AI提案を適用");
    expect(history).not.toBeUndefined();
    expect(history?.content).toBe("AI提案を適用");
    expect(getHistory(history!.id)?.id).toBe(history!.id);
  });

  it("プロジェクトに紐づく履歴一覧を取得できる", () => {
    const created = createSampleProject();
    createHistory(created.id, "履歴1");
    createHistory(created.id, "履歴2");
    expect(getHistories(created.id)).toHaveLength(2);
  });

  it("プロジェクト削除時に紐づく履歴も削除される", () => {
    const created = createSampleProject();
    const history = createHistory(created.id, "変更履歴")!;
    deleteProject(created.id);
    expect(getHistory(history.id)).toBeUndefined();
    expect(getHistories(created.id)).toHaveLength(0);
  });

  it("存在しないプロジェクトには履歴を追加できない", () => {
    expect(createHistory("proj_missing", "履歴")).toBeUndefined();
  });
});
