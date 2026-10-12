import { describe, expect, it } from "vitest";
import {
  calculateBufferStatus,
  hoursUntilDeadline,
  parseDeadline,
  remainingHours,
  toProject,
  toProjectSummary,
} from "@/lib/buffer";
import type { ProjectRecord, SubTask } from "@/lib/types";

const DEADLINE = "2026-09-10";
const CREATED_AT = "2026-09-05T00:00:00.000Z"; // 期日の 120時間前

const createRecord = (overrides: Partial<ProjectRecord> = {}): ProjectRecord => ({
  id: "proj_1",
  title: "プレゼン資料作成",
  deadline: DEADLINE,
  initialRemainingTime: 120,
  initialTotalHours: 80,
  subtasks: [],
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...overrides,
});

const createSubtasks = (...hours: number[]): SubTask[] =>
  hours.map((h, i) => ({
    id: `sub_${i}`,
    projectId: "proj_1",
    title: `タスク${i + 1}`,
    estimatedHours: h,
    isDone: false,
  }));

describe("parseDeadline", () => {
  it("YYYY-MM-DD を UTC 0時の Date に変換する", () => {
    const date = parseDeadline("2026-09-10");
    expect(date.toISOString()).toBe("2026-09-10T00:00:00.000Z");
  });
});

describe("hoursUntilDeadline", () => {
  it("期日までの残り時間を時間単位で返す", () => {
    const from = new Date("2026-09-09T00:00:00.000Z");
    expect(hoursUntilDeadline("2026-09-10", from)).toBe(24);
  });

  it("期日を過ぎている場合は 0 を返す", () => {
    const from = new Date("2026-09-11T00:00:00.000Z");
    expect(hoursUntilDeadline("2026-09-10", from)).toBe(0);
  });
});

describe("remainingHours", () => {
  it("未完了サブタスクの工数合計を返す", () => {
    const subtasks = createSubtasks(2, 3, 5);
    subtasks[0].isDone = true;
    expect(remainingHours(subtasks)).toBe(8);
  });

  it("全完了の場合は 0 を返す", () => {
    const subtasks = createSubtasks(2, 3);
    subtasks.forEach((s) => (s.isDone = true));
    expect(remainingHours(subtasks)).toBe(0);
  });
});

describe("calculateBufferStatus", () => {
  it("計画時点ではバッファ 100%・green となる", () => {
    // initialTotalHours=80 → ePlan=96, initialRemainingTime=120 → bInit=24
    // 計画時点（createdAt）を now にすると remainingTime=120, remHours=80
    // bCurrent = 120 - 80*1.2 = 24
    // stableBufferBase = max(24, 96*0.2=19.2, 1) = 24
    // bufferPercentage = min(100, round(24/24*100)) = 100
    const record = createRecord({ subtasks: createSubtasks(80) });
    const status = calculateBufferStatus(record, new Date(CREATED_AT));

    expect(status.status).toBe("green");
    expect(status.bufferPercentage).toBe(100);
    expect(status.remainingTime).toBeCloseTo(120, 0);
    expect(status.remainingHours).toBe(80);
  });

  it("進捗が遅れていると yellow または red になる", () => {
    const record = createRecord({ subtasks: createSubtasks(80) });
    // 期日まで 48h、残工数 80h のまま
    // bCurrent = 48 - 96 = -48
    // stableBufferBase = 24
    // bufferPercentage = round(-48/24*100) = -200 → red
    const status = calculateBufferStatus(record, new Date("2026-09-08T00:00:00.000Z"));

    expect(status.status).toBe("red");
    expect(status.bufferPercentage).toBeLessThanOrEqual(0);
  });

  it("サブタスクを完了するとバッファが改善する", () => {
    const subtasks = createSubtasks(40, 40);
    const record = createRecord({ subtasks });

    // 期日まで 72h、残工数 80h の状態
    const now = new Date("2026-09-07T00:00:00.000Z");
    const before = calculateBufferStatus(record, now);
    expect(before.remainingHours).toBe(80);

    // 半分完了
    subtasks[0].isDone = true;
    const after = calculateBufferStatus(record, now);
    expect(after.remainingHours).toBe(40);
    expect(after.bufferPercentage).toBeGreaterThan(before.bufferPercentage);
  });

  it("初期バッファが 0 の計画でも安定化幅により計算が破綻しない", () => {
    // initialTotalHours=100, initialRemainingTime=120 → ePlan=120, bInit=0
    const record = createRecord({
      subtasks: createSubtasks(100),
      initialTotalHours: 100,
    });
    const status = calculateBufferStatus(record, new Date(CREATED_AT));
    // stableBufferBase = max(0, 120*0.2=24, 1) = 24
    // bCurrent = 120 - 100*1.2 = 0
    // bufferPercentage = round(0/24*100) = 0
    expect(Number.isFinite(status.bufferPercentage)).toBe(true);
    expect(status.bufferPercentage).toBe(0);
    expect(status.status).toBe("red");
  });

  it("期日を過ぎると remainingTime は 0 になる", () => {
    const record = createRecord({ subtasks: createSubtasks(10) });
    const status = calculateBufferStatus(record, new Date("2026-09-11T00:00:00.000Z"));
    expect(status.remainingTime).toBe(0);
  });
});

describe("toProjectSummary", () => {
  it("ProjectRecord からサマリーを導出する", () => {
    const record = createRecord({ subtasks: createSubtasks(30, 50) });
    const summary = toProjectSummary(record);

    expect(summary.id).toBe("proj_1");
    expect(summary.title).toBe("プレゼン資料作成");
    expect(summary.completedSubtasks).toBe(0);
    expect(summary.totalSubtasks).toBe(2);
    expect(summary.status).toBeOneOf(["green", "yellow", "red"]);
  });

  it("完了数を正しくカウントする", () => {
    const subtasks = createSubtasks(30, 50);
    subtasks[0].isDone = true;
    const summary = toProjectSummary(createRecord({ subtasks }));
    expect(summary.completedSubtasks).toBe(1);
    expect(summary.totalSubtasks).toBe(2);
  });
});

describe("toProject", () => {
  it("ProjectRecord から詳細情報を含む Project を導出する", () => {
    const record = createRecord({ subtasks: createSubtasks(10) });
    const project = toProject(record);

    expect(project.initialRemainingTime).toBe(120);
    expect(project.initialTotalHours).toBe(80);
    expect(project.subtasks).toHaveLength(1);
    expect(project.createdAt).toBe(record.createdAt);
  });
});
