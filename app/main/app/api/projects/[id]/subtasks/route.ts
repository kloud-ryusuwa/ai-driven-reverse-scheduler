import { NextRequest, NextResponse } from "next/server";
import { createSubtask, getProject, getSubtasks } from "@/lib/store";
import { parsePagination, paginate } from "@/lib/pagination";
import {
  isNonEmptyString,
  isPositiveNumber,
  jsonError,
  parseJson,
  resolveParams,
  type RouteParams,
} from "@/lib/api";

export async function GET(
  request: NextRequest,
  context: { params: RouteParams<{ id: string }> }
) {
  const { id } = await resolveParams(context.params);
  const { page, perPage } = parsePagination(request.nextUrl.searchParams);

  if (!getProject(id)) {
    return jsonError("プロジェクトが見つかりません", 404);
  }

  const result = paginate(getSubtasks(id), page, perPage);

  return NextResponse.json({
    subtasks: result.items,
    total: result.total,
    page: result.page,
    per_page: result.per_page,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: RouteParams<{ id: string }> }
) {
  const { id } = await resolveParams(context.params);

  let body: unknown;
  try {
    body = await parseJson(request);
  } catch {
    return jsonError("リクエストボディのJSONが不正です", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("リクエストボディはオブジェクトである必要があります", 400);
  }

  const { title, estimatedHours } = body as Record<string, unknown>;

  if (!isNonEmptyString(title)) {
    return jsonError("title は必須です", 400);
  }
  if (!isPositiveNumber(estimatedHours)) {
    return jsonError("estimatedHours は 0 より大きい数値が必須です", 400);
  }

  const subtask = createSubtask(id, { title, estimatedHours });
  if (!subtask) {
    return jsonError("プロジェクトが見つかりません", 404);
  }

  return NextResponse.json(subtask, { status: 201 });
}
