import { describe, expect, it } from "vitest";
import { paginate, parsePagination } from "@/lib/pagination";

describe("parsePagination", () => {
  it("省略時は page=1, per_page=20", () => {
    const result = parsePagination(new URLSearchParams());
    expect(result).toEqual({ page: 1, perPage: 20 });
  });

  it("有効な page と per_page をパースする", () => {
    const result = parsePagination(new URLSearchParams("page=3&per_page=30"));
    expect(result).toEqual({ page: 3, perPage: 30 });
  });

  it("per_page が 50 を超えると 20 に戻る", () => {
    expect(parsePagination(new URLSearchParams("per_page=100"))).toEqual({
      page: 1,
      perPage: 20,
    });
  });

  it("無効な値はデフォルトにフォールバックする", () => {
    expect(parsePagination(new URLSearchParams("page=abc&per_page=-5"))).toEqual({
      page: 1,
      perPage: 20,
    });
  });
});

describe("paginate", () => {
  const items = [1, 2, 3, 4, 5];

  it("指定ページのスライスを返す", () => {
    expect(paginate(items, 1, 2)).toEqual({
      items: [1, 2],
      total: 5,
      page: 1,
      per_page: 2,
    });
    expect(paginate(items, 2, 2)).toEqual({
      items: [3, 4],
      total: 5,
      page: 2,
      per_page: 2,
    });
  });

  it("ページが範囲外でも空配列を返す", () => {
    expect(paginate(items, 10, 2)).toEqual({
      items: [],
      total: 5,
      page: 10,
      per_page: 2,
    });
  });
});
