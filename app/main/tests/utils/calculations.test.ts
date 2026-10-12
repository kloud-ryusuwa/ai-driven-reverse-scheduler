import { describe, expect, it } from "vitest";
import { getStatusFromBuffer } from "@/utils/calculations";

describe("getStatusFromBuffer", () => {
  it("50%以上は green", () => {
    expect(getStatusFromBuffer(50)).toBe("green");
    expect(getStatusFromBuffer(100)).toBe("green");
    expect(getStatusFromBuffer(51)).toBe("green");
  });

  it("0%超〜50%未満は yellow", () => {
    expect(getStatusFromBuffer(49)).toBe("yellow");
    expect(getStatusFromBuffer(1)).toBe("yellow");
  });

  it("0%以下は red", () => {
    expect(getStatusFromBuffer(0)).toBe("red");
    expect(getStatusFromBuffer(-10)).toBe("red");
  });
});
