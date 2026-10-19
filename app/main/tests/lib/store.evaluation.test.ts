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

describe("store - evaluations", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  const makeEvaluation = (overrides: Partial<Parameters<typeof store.createEvaluation>[1]> = {}) => ({
    triageAccuracy: 4,
    psychologicalRelief: 5,
    feasibility: 3,
    comment: "良い提案",
    ...overrides,
  });

  it("評価を作成・取得できる", () => {
    const created = createSampleProject(store);
    const history = store.createHistory(created.id, "AI提案を適用")!;
    const evaluation = store.createEvaluation(history.id, makeEvaluation());
    expect(evaluation?.triageAccuracy).toBe(4);
    expect(evaluation?.comment).toBe("良い提案");
    expect(store.getEvaluation(history.id)?.id).toBe(evaluation?.id);
  });

  it("同じ履歴に対する評価は上書きされる", () => {
    const created = createSampleProject(store);
    const history = store.createHistory(created.id, "AI提案を適用")!;
    const first = store.createEvaluation(history.id, makeEvaluation({ triageAccuracy: 3 }));
    const second = store.createEvaluation(history.id, makeEvaluation({ triageAccuracy: 5 }));
    expect(second?.id).toBe(first?.id);
    expect(store.getEvaluation(history.id)?.triageAccuracy).toBe(5);
  });

  it("存在しない履歴に対しては作成できない", () => {
    expect(store.createEvaluation("hist_missing", makeEvaluation())).toBeUndefined();
  });

  it("プロジェクト削除時に紐づく評価も削除される", () => {
    const created = createSampleProject(store);
    const history = store.createHistory(created.id, "AI提案を適用")!;
    const evaluation = store.createEvaluation(history.id, makeEvaluation())!;
    store.deleteProject(created.id);
    expect(store.getEvaluation(history.id)).toBeUndefined();
  });
});
