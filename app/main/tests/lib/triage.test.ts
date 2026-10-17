import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyTriageProposal, requestTriage } from "@/lib/triage";
import type { Project, SubTask, TriageProposal } from "@/lib/types";

const mockFetch = vi.fn();

describe("triage service", () => {
  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockResponse(ok: boolean, body: unknown) {
    return {
      ok,
      json: async () => body,
    } as Response;
  }

  describe("requestTriage", () => {
    it("トリアージ API を呼び出して提案を返す", async () => {
      const proposal: TriageProposal = {
        type: "drop",
        targetSubtaskIds: [],
        reason: "工数超過",
        newTotalEstimatedHours: 10,
        newEffectiveTotalHours: 12,
        droppedSubtasks: [],
      };
      mockFetch.mockResolvedValueOnce(mockResponse(true, { proposal }));

      const result = await requestTriage("proj_1", "red", { goal: "期日に間に合わせる" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/projects/proj_1/triage",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            mode: "red",
            context: { goal: "期日に間に合わせる" },
          }),
        })
      );
      expect(result).toEqual(proposal);
    });

    it("API エラー時に例外を投げる", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(false, { error: "失敗" }));

      await expect(
        requestTriage("proj_1", "yellow", { goal: "優先度整理" })
      ).rejects.toThrow("失敗");
    });
  });

  describe("applyTriageProposal", () => {
    function makeProject(subtasks: SubTask[]): Project {
      return {
        id: "proj_1",
        title: "テスト",
        deadline: "2026-09-10",
        status: "red",
        bufferPercentage: -10,
        completedSubtasks: 0,
        totalSubtasks: subtasks.length,
        initialRemainingTime: 100,
        initialTotalHours: 50,
        subtasks,
        createdAt: "2026-08-20T09:00:00.000Z",
        updatedAt: "2026-08-20T09:00:00.000Z",
      };
    }

    it("drop 提案で対象サブタスクを削除し履歴を追加する", async () => {
      const dropped: SubTask = {
        id: "sub_2",
        projectId: "proj_1",
        title: "ドロップ対象",
        estimatedHours: 10,
        isDone: false,
      };
      const proposal: TriageProposal = {
        type: "drop",
        targetSubtaskIds: [],
        reason: "優先度低い",
        newTotalEstimatedHours: 20,
        newEffectiveTotalHours: 24,
        droppedSubtasks: [dropped],
      };
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

      await applyTriageProposal("proj_1", proposal, makeProject([dropped]));

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/projects/proj_1/subtasks/sub_2",
        expect.objectContaining({ method: "DELETE" })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/projects/proj_1/histories",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ content: "AI提案を適用: 優先度低い" }),
        })
      );
    });

    it("simplify 提案で対象サブタスクの工数を 50% にし履歴を追加する", async () => {
      const target: SubTask = {
        id: "sub_1",
        projectId: "proj_1",
        title: "簡略化対象",
        estimatedHours: 10,
        isDone: false,
      };
      const proposal: TriageProposal = {
        type: "simplify",
        targetSubtaskIds: ["sub_1"],
        reason: "工数削減",
        newTotalEstimatedHours: 25,
        newEffectiveTotalHours: 30,
        droppedSubtasks: [],
      };
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

      await applyTriageProposal("proj_1", proposal, makeProject([target]));

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/projects/proj_1/subtasks/sub_1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ estimatedHours: 5 }),
        })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/projects/proj_1/histories",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ content: "AI提案を適用: 工数削減" }),
        })
      );
    });
  });
});
