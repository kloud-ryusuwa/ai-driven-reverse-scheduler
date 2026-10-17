import { describe, expect, it } from "vitest";
import {
  getDeadlineLabel,
  getDaysLeft,
  getStatusMeta,
  toMainTask,
} from "@/lib/projectViewModel";
import type { BufferStatus, Project } from "@/lib/types";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj_1",
    title: "プレゼン資料作成",
    deadline: "2026-09-10",
    status: "green",
    bufferPercentage: 80,
    completedSubtasks: 0,
    totalSubtasks: 2,
    initialRemainingTime: 504,
    initialTotalHours: 80,
    subtasks: [
      {
        id: "sub_1",
        projectId: "proj_1",
        title: "構成案作成",
        estimatedHours: 8,
        isDone: false,
      },
      {
        id: "sub_2",
        projectId: "proj_1",
        title: "スライド作成",
        estimatedHours: 16,
        isDone: true,
      },
    ],
    createdAt: "2026-08-20T09:00:00.000Z",
    updatedAt: "2026-08-20T09:00:00.000Z",
    ...overrides,
  };
}

function makeStatus(overrides: Partial<BufferStatus> = {}): BufferStatus {
  return {
    projectId: "proj_1",
    status: "green",
    bufferPercentage: 80,
    remainingTime: 504,
    remainingHours: 8,
    initialRemainingTime: 504,
    initialTotalHours: 80,
    ...overrides,
  };
}

describe("projectViewModel", () => {
  describe("toMainTask", () => {
    it("Project と BufferStatus から MainTask を生成する", () => {
      const project = makeProject();
      const status = makeStatus();
      const mainTask = toMainTask(project, status);

      expect(mainTask.id).toBe(project.id);
      expect(mainTask.title).toBe(project.title);
      expect(mainTask.bufferPercentage).toBe(status.bufferPercentage);
      expect(mainTask.completedSubtasks).toBe(1);
      expect(mainTask.totalSubtasks).toBe(2);
      expect(mainTask.subtasks).toHaveLength(2);
      expect(mainTask.subtasks[0].projectId).toBe(project.id);
    });
  });

  describe("getStatusMeta", () => {
    it("green のとき順調ラベルを返す", () => {
      const meta = getStatusMeta(80);
      expect(meta.label).toBe("順調");
      expect(meta.color).toBe("success");
      expect(meta.message).toContain("期日に到達できる");
    });

    it("yellow のとき要注意ラベルを返す", () => {
      const meta = getStatusMeta(25);
      expect(meta.label).toBe("要注意");
      expect(meta.color).toBe("warning");
    });

    it("red のとき危機ラベルを返す", () => {
      const meta = getStatusMeta(-10);
      expect(meta.label).toBe("危機");
      expect(meta.color).toBe("error");
    });
  });

  describe("getDeadlineLabel", () => {
    it("日本語書式で日付を返す", () => {
      expect(getDeadlineLabel("2026-09-10")).toBe("2026年9月10日");
    });
  });

  describe("getDaysLeft", () => {
    it("残り時間を 24 で割って切り上げた非負整数を返す", () => {
      expect(getDaysLeft(48)).toBe(2);
      expect(getDaysLeft(47)).toBe(2);
      expect(getDaysLeft(-5)).toBe(0);
    });
  });
});
