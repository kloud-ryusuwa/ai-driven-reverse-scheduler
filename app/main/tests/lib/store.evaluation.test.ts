import { beforeEach, describe, expect, it } from "vitest";
import {
  createEvaluation,
  createHistory,
  createProject,
  deleteProject,
  getEvaluation,
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
    subtasks: [{ title: "構成案作成", estimatedHours: 8 }],
  });

describe("store - evaluations", () => {
  beforeEach(() => {
    resetStore();
    updateDemoSettings({ now: "2026-08-20T09:00:00.000Z" });
  });

  const makeEvaluation = (overrides: Partial<Parameters<typeof createEvaluation>[1]> = {}) => ({
    triageAccuracy: 4,
    psychologicalRelief: 5,
    feasibility: 3,
    comment: "良い提案",
    ...overrides,
  });

  it("評価を作成・取得できる", () => {
    const created = createSampleProject();
    const history = createHistory(created.id, "AI提案を適用")!;
    const evaluation = createEvaluation(history.id, makeEvaluation());
    expect(evaluation?.triageAccuracy).toBe(4);
    expect(evaluation?.comment).toBe("良い提案");
    expect(getEvaluation(history.id)?.id).toBe(evaluation?.id);
  });

  it("同じ履歴に対する評価は上書きされる", () => {
    const created = createSampleProject();
    const history = createHistory(created.id, "AI提案を適用")!;
    const first = createEvaluation(history.id, makeEvaluation({ triageAccuracy: 3 }));
    const second = createEvaluation(history.id, makeEvaluation({ triageAccuracy: 5 }));
    expect(second?.id).toBe(first?.id);
    expect(getEvaluation(history.id)?.triageAccuracy).toBe(5);
  });

  it("存在しない履歴に対しては作成できない", () => {
    expect(createEvaluation("hist_missing", makeEvaluation())).toBeUndefined();
  });

  it("プロジェクト削除時に紐づく評価も削除される", () => {
    const created = createSampleProject();
    const history = createHistory(created.id, "AI提案を適用")!;
    const evaluation = createEvaluation(history.id, makeEvaluation())!;
    deleteProject(created.id);
    expect(getEvaluation(history.id)).toBeUndefined();
  });
});
