import { NextRequest, NextResponse } from "next/server";
import { createHistory, getHistories, getProject } from "@/lib/store";
import { parsePagination, paginate } from "@/lib/pagination";
import {
  isNonEmptyString,
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

  const result = paginate(getHistories(id), page, perPage);

  return NextResponse.json({
    histories: result.items,
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

  const { content } = body as Record<string, unknown>;
  if (!isNonEmptyString(content)) {
    return jsonError("content は必須です", 400);
  }

  const history = createHistory(id, content);
  if (!history) {
    return jsonError("プロジェクトが見つかりません", 404);
  }

  return NextResponse.json(history, { status: 201 });
}
