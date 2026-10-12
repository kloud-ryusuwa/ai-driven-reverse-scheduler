import { beforeEach, describe, expect, it } from "vitest";
import { getDemoNow, getDemoSettings, updateDemoSettings } from "@/lib/demo";

function resetDemoSettings() {
  const settings = getDemoSettings();
  settings.now = null;
}

describe("demo settings", () => {
  beforeEach(() => {
    resetDemoSettings();
  });

  describe("getDemoNow", () => {
    it("now が未設定の場合は実際の現在日時を返す", () => {
      const before = new Date().getTime();
      const now = getDemoNow().getTime();
      const after = new Date().getTime();
      expect(now).toBeGreaterThanOrEqual(before);
      expect(now).toBeLessThanOrEqual(after);
    });

    it("now が設定されている場合はその日時を返す", () => {
      const fixed = "2026-09-01T12:00:00.000Z";
      updateDemoSettings({ now: fixed });
      expect(getDemoNow().toISOString()).toBe(fixed);
    });
  });

  describe("updateDemoSettings", () => {
    it("now を更新できる", () => {
      updateDemoSettings({ now: "2026-08-15T00:00:00.000Z" });
      expect(getDemoNow().toISOString()).toBe("2026-08-15T00:00:00.000Z");
    });

    it("model を更新できる", () => {
      updateDemoSettings({ model: "custom-model" });
      expect(getDemoSettings().model).toBe("custom-model");
    });
  });
});
