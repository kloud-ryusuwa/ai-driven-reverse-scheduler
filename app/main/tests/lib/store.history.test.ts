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
    subtasks: [{ title: "構成案作成", estimatedHours: 8 }],
  });

describe("store - histories", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it("履歴を追加・取得できる", () => {
    const created = createSampleProject(store);
    const history = store.createHistory(created.id, "AI提案を適用");
    expect(history).not.toBeUndefined();
    expect(history?.content).toBe("AI提案を適用");
    expect(store.getHistory(history!.id)?.id).toBe(history!.id);
  });

  it("プロジェクトに紐づく履歴一覧を取得できる", () => {
    const created = createSampleProject(store);
    store.createHistory(created.id, "履歴1");
    store.createHistory(created.id, "履歴2");
    expect(store.getHistories(created.id)).toHaveLength(2);
  });

  it("プロジェクト削除時に紐づく履歴も削除される", () => {
    const created = createSampleProject(store);
    const history = store.createHistory(created.id, "変更履歴")!;
    store.deleteProject(created.id);
    expect(store.getHistory(history.id)).toBeUndefined();
    expect(store.getHistories(created.id)).toHaveLength(0);
  });

  it("存在しないプロジェクトには履歴を追加できない", () => {
    expect(store.createHistory("proj_missing", "履歴")).toBeUndefined();
  });
});
