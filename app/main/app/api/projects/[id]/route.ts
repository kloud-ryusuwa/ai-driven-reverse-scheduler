import { NextRequest, NextResponse } from "next/server";
import { deleteProject, getProject, updateProject } from "@/lib/store";
import { toProject } from "@/lib/buffer";
import {
  isNonEmptyString,
  isValidDateString,
  jsonError,
  parseJson,
  resolveParams,
  type RouteParams,
} from "@/lib/api";

export async function GET(
  _request: NextRequest,
  context: { params: RouteParams<{ id: string }> }
) {
  const { id } = await resolveParams(context.params);
  const record = getProject(id);

  if (!record) {
    return jsonError("プロジェクトが見つかりません", 404);
  }

  return NextResponse.json(toProject(record));
}

export async function PATCH(
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

  const { title, deadline } = body as Record<string, unknown>;
  const patch: { title?: string; deadline?: string } = {};

  if (title !== undefined) {
    if (!isNonEmptyString(title)) {
      return jsonError("title は空でない文字列である必要があります", 400);
    }
    patch.title = title;
  }

  if (deadline !== undefined) {
    if (!isValidDateString(deadline)) {
      return jsonError("deadline は YYYY-MM-DD 形式である必要があります", 400);
    }
    patch.deadline = deadline;
  }

  const updated = updateProject(id, patch);
  if (!updated) {
    return jsonError("プロジェクトが見つかりません", 404);
  }

  return NextResponse.json(toProject(updated));
}

export async function DELETE(
  _request: NextRequest,
  context: { params: RouteParams<{ id: string }> }
) {
  const { id } = await resolveParams(context.params);
  const deleted = deleteProject(id);

  if (!deleted) {
    return jsonError("プロジェクトが見つかりません", 404);
  }

  return new NextResponse(null, { status: 204 });
}
