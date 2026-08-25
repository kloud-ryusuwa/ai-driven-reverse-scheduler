import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Next.js 16 の Route Handler では動的 params は常に Promise で渡される。
export type RouteParams<T> = Promise<T>;

export async function resolveParams<T>(params: RouteParams<T>): Promise<T> {
  return await params;
}

export async function parseJson<T>(req: Request): Promise<T> {
  return (await req.json()) as T;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value) && value > 0;
}

export function isIntegerInRange(
  value: unknown,
  min: number,
  max: number
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}
