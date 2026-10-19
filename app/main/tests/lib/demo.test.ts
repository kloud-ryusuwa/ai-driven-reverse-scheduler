import { beforeEach, describe, expect, it } from "vitest";
import { getDemoSettings, updateDemoSettings } from "@/lib/demo";

function resetDemoSettings() {
  const settings = getDemoSettings();
  settings.now = null;
}

describe("demo settings", () => {
  beforeEach(() => {
    resetDemoSettings();
  });

  describe("updateDemoSettings", () => {
    it("now を更新できる", () => {
      updateDemoSettings({ now: "2026-08-15T00:00:00.000Z" });
      expect(getDemoSettings().now).toBe("2026-08-15T00:00:00.000Z");
    });

    it("model を更新できる", () => {
      updateDemoSettings({ model: "custom-model" });
      expect(getDemoSettings().model).toBe("custom-model");
    });
  });
});
