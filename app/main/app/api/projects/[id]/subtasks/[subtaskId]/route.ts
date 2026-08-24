import { NextRequest, NextResponse } from "next/server";
import { deleteSubtask, updateSubtask } from "@/lib/store";
import {
  isNonEmptyString,
  isPositiveNumber,
  jsonError,
  parseJson,
  resolveParams,
  type RouteParams,
} from "@/lib/api";

export async function PATCH(
  request: NextRequest,
  context: { params: RouteParams<{ id: string; subtaskId: string }> }
) {
  const { id, subtaskId } = await resolveParams(context.params);

  let body: unknown;
  try {
    body = await parseJson(request);
  } catch {
    return jsonError("リクエストボディのJSONが不正です", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("リクエストボディはオブジェクトである必要があります", 400);
  }

  const { title, estimatedHours, isDone } = body as Record<string, unknown>;
  const patch: { title?: string; estimatedHours?: number; isDone?: boolean } =
    {};

  if (title !== undefined) {
    if (!isNonEmptyString(title)) {
      return jsonError("title は空でない文字列である必要があります", 400);
    }
    patch.title = title;
  }

  if (estimatedHours !== undefined) {
    if (!isPositiveNumber(estimatedHours)) {
      return jsonError(
        "estimatedHours は 0 より大きい数値である必要があります",
        400
      );
    }
    patch.estimatedHours = estimatedHours;
  }

  if (isDone !== undefined) {
    if (typeof isDone !== "boolean") {
      return jsonError("isDone は真偽値である必要があります", 400);
    }
    patch.isDone = isDone;
  }

  const updated = updateSubtask(id, subtaskId, patch);
  if (!updated) {
    return jsonError("サブタスクが見つかりません", 404);
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  context: { params: RouteParams<{ id: string; subtaskId: string }> }
) {
  const { id, subtaskId } = await resolveParams(context.params);
  const deleted = deleteSubtask(id, subtaskId);

  if (!deleted) {
    return jsonError("サブタスクが見つかりません", 404);
  }

  return new NextResponse(null, { status: 204 });
}
