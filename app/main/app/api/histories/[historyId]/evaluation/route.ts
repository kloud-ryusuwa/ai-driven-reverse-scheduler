import { NextRequest, NextResponse } from "next/server";
import { createEvaluation, getEvaluation, getHistory } from "@/lib/store";
import {
  isIntegerInRange,
  isNonEmptyString,
  jsonError,
  parseJson,
  resolveParams,
  type RouteParams,
} from "@/lib/api";

export async function GET(
  _request: NextRequest,
  context: { params: RouteParams<{ historyId: string }> }
) {
  const { historyId } = await resolveParams(context.params);

  if (!getHistory(historyId)) {
    return jsonError("履歴が見つかりません", 404);
  }

  const evaluation = getEvaluation(historyId);
  if (!evaluation) {
    return jsonError("評価が見つかりません", 404);
  }

  return NextResponse.json(evaluation);
}

export async function POST(
  request: NextRequest,
  context: { params: RouteParams<{ historyId: string }> }
) {
  const { historyId } = await resolveParams(context.params);

  if (!getHistory(historyId)) {
    return jsonError("履歴が見つかりません", 404);
  }

  let body: unknown;
  try {
    body = await parseJson(request);
  } catch {
    return jsonError("リクエストボディのJSONが不正です", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("リクエストボディはオブジェクトである必要があります", 400);
  }

  const { triageAccuracy, psychologicalRelief, feasibility, comment } =
    body as Record<string, unknown>;

  if (!isIntegerInRange(triageAccuracy, 1, 5)) {
    return jsonError("triageAccuracy は 1 〜 5 の整数が必須です", 400);
  }
  if (!isIntegerInRange(psychologicalRelief, 1, 5)) {
    return jsonError("psychologicalRelief は 1 〜 5 の整数が必須です", 400);
  }
  if (!isIntegerInRange(feasibility, 1, 5)) {
    return jsonError("feasibility は 1 〜 5 の整数が必須です", 400);
  }
  if (comment !== undefined && !isNonEmptyString(comment)) {
    return jsonError("comment は空でない文字列である必要があります", 400);
  }

  const evaluation = createEvaluation(historyId, {
    triageAccuracy,
    psychologicalRelief,
    feasibility,
    comment,
  });

  return NextResponse.json(evaluation, { status: 201 });
}
