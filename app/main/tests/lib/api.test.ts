import { describe, expect, it } from "vitest";
import {
  isIntegerInRange,
  isNonEmptyString,
  isPositiveNumber,
  isValidDateString,
  jsonError,
  parseJson,
  resolveParams,
} from "@/lib/api";

describe("jsonError", () => {
  it("指定したメッセージとステータスで JSON レスポンスを返す", async () => {
    const res = jsonError("bad request", 400);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad request" });
  });
});

describe("resolveParams", () => {
  it("Promise 化された params を解決する", async () => {
    const params = Promise.resolve({ id: "proj_1" });
    expect(await resolveParams(params)).toEqual({ id: "proj_1" });
  });
});

describe("parseJson", () => {
  it("リクエストボディを JSON としてパースする", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });
    expect(await parseJson(req)).toEqual({ name: "test" });
  });
});

describe("isValidDateString", () => {
  it("YYYY-MM-DD 形式の有効な日付を許容する", () => {
    expect(isValidDateString("2026-12-31")).toBe(true);
  });

  it("無効な日付文字列を拒否する", () => {
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("2026/12/31")).toBe(false);
    expect(isValidDateString("")).toBe(false);
    expect(isValidDateString(null)).toBe(false);
    expect(isValidDateString(20261231)).toBe(false);
  });
});

describe("isNonEmptyString", () => {
  it("空でない文字列を許容する", () => {
    expect(isNonEmptyString("hello")).toBe(true);
    expect(isNonEmptyString("  hello  ")).toBe(true);
  });

  it("空または非文字列を拒否する", () => {
    expect(isNonEmptyString("")).toBe(false);
    expect(isNonEmptyString("   ")).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
  });
});

describe("isPositiveNumber", () => {
  it("正の数値を許容する", () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0.5)).toBe(true);
  });

  it("0 以下または非数値を拒否する", () => {
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber("1")).toBe(false);
    expect(isPositiveNumber(NaN)).toBe(false);
  });
});

describe("isIntegerInRange", () => {
  it("範囲内の整数を許容する", () => {
    expect(isIntegerInRange(3, 1, 5)).toBe(true);
    expect(isIntegerInRange(1, 1, 5)).toBe(true);
    expect(isIntegerInRange(5, 1, 5)).toBe(true);
  });

  it("範囲外または非整数を拒否する", () => {
    expect(isIntegerInRange(0, 1, 5)).toBe(false);
    expect(isIntegerInRange(6, 1, 5)).toBe(false);
    expect(isIntegerInRange(2.5, 1, 5)).toBe(false);
  });
});
