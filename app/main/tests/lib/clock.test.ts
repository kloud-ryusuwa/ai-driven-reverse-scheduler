import { beforeEach, describe, expect, it } from "vitest";
import { DemoClock, FixedClock, SystemClock } from "@/lib/clock";
import { getDemoSettings, updateDemoSettings } from "@/lib/demo";

function resetDemoSettings() {
  const settings = getDemoSettings();
  settings.now = null;
}

describe("SystemClock", () => {
  it("現在時刻を返す", () => {
    const clock = new SystemClock();
    const before = new Date().getTime();
    const now = clock.now().getTime();
    const after = new Date().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });
});

describe("FixedClock", () => {
  it("固定された日時を返す", () => {
    const fixed = new Date("2026-08-20T09:00:00.000Z");
    const clock = new FixedClock(fixed);
    expect(clock.now().toISOString()).toBe(fixed.toISOString());
  });
});

describe("DemoClock", () => {
  beforeEach(() => {
    resetDemoSettings();
  });

  it("now が未設定の場合は実際の現在時時刻を返す", () => {
    const clock = new DemoClock();
    const before = new Date().getTime();
    const now = clock.now().getTime();
    const after = new Date().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });

  it("now が設定されている場合はその日時を返す", () => {
    const fixed = "2026-09-01T12:00:00.000Z";
    updateDemoSettings({ now: fixed });
    const clock = new DemoClock();
    expect(clock.now().toISOString()).toBe(fixed);
  });
});
