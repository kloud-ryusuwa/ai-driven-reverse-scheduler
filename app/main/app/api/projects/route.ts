import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/store";
import { toProject, toProjectSummary } from "@/lib/buffer";
import { parsePagination, paginate } from "@/lib/pagination";
import {
  isNonEmptyString,
  isPositiveNumber,
  isValidDateString,
  jsonError,
  parseJson,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const { page, perPage } = parsePagination(searchParams);
  const statusFilter = searchParams.get("status") ?? undefined;

  if (
    statusFilter &&
    statusFilter !== "green" &&
    statusFilter !== "yellow" &&
    statusFilter !== "red"
  ) {
    return jsonError("status は green / yellow / red のいずれかを指定してください", 400);
  }

  const records = listProjects(statusFilter);
  const summaries = records.map(toProjectSummary);
  const result = paginate(summaries, page, perPage);

  return NextResponse.json({
    projects: result.items,
    total: result.total,
    page: result.page,
    per_page: result.per_page,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await parseJson(request);
  } catch {
    return jsonError("リクエストボディのJSONが不正です", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("リクエストボディはオブジェクトである必要があります", 400);
  }

  const { title, deadline, totalEstimatedHours, subtasks } = body as Record<
    string,
    unknown
  >;

  if (!isNonEmptyString(title)) {
    return jsonError("title は必須です", 400);
  }
  if (!isValidDateString(deadline)) {
    return jsonError("deadline は YYYY-MM-DD 形式で必須です", 400);
  }
  if (!isPositiveNumber(totalEstimatedHours)) {
    return jsonError("totalEstimatedHours は 0 より大きい数値が必須です", 400);
  }
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return jsonError("subtasks は 1 件以上の配列が必須です", 400);
  }

  const normalizedSubtasks: { title: string; estimatedHours: number }[] = [];
  for (const s of subtasks) {
    if (typeof s !== "object" || s === null) {
      return jsonError("subtasks の各要素はオブジェクトである必要があります", 400);
    }
    const item = s as Record<string, unknown>;
    if (!isNonEmptyString(item.title)) {
      return jsonError("subtasks[].title は必須です", 400);
    }
    if (!isPositiveNumber(item.estimatedHours)) {
      return jsonError("subtasks[].estimatedHours は 0 より大きい数値が必須です", 400);
    }
    normalizedSubtasks.push({
      title: item.title,
      estimatedHours: item.estimatedHours,
    });
  }

  const record = createProject({
    title,
    deadline,
    initialTotalHours: totalEstimatedHours,
    subtasks: normalizedSubtasks,
  });

  return NextResponse.json(toProject(record), { status: 201 });
}
