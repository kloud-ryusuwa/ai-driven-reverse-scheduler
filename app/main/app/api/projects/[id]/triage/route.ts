import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/store";
import { calculateBufferStatus } from "@/lib/buffer";
import type { SubTask, TriageProposal } from "@/lib/types";
import { jsonError, parseJson, resolveParams, type RouteParams } from "@/lib/api";

export async function POST(
  request: NextRequest,
  context: { params: RouteParams<{ id: string }> }
) {
  const { id } = await resolveParams(context.params);
  const record = getProject(id);

  if (!record) {
    return jsonError("プロジェクトが見つかりません", 404);
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

  const { mode, context: triageContext } = body as {
    mode?: unknown;
    context?: { goal?: unknown; priority?: unknown };
  };

  if (mode !== "yellow" && mode !== "red") {
    return jsonError("mode は yellow または red のいずれかである必要があります", 400);
  }

  if (!triageContext || typeof triageContext.goal !== "string" || triageContext.goal.trim() === "") {
    return jsonError("context.goal は必須です", 400);
  }

  if (
    triageContext.priority !== undefined &&
    triageContext.priority !== "must" &&
    triageContext.priority !== "should" &&
    triageContext.priority !== "could"
  ) {
    return jsonError("context.priority は must / should / could のいずれかです", 400);
  }

  const status = calculateBufferStatus(record);
  const undone = record.subtasks
    .filter((s) => !s.isDone)
    .sort((a, b) => b.estimatedHours - a.estimatedHours);

  if (undone.length === 0) {
    return jsonError("未完了のサブタスクがないためトリアージできません", 400);
  }

  let proposal: TriageProposal;
  const goalSuffix = `目的「${triageContext.goal}」に照らし合わせ、`;

  if (mode === "red") {
    const remainingTime = status.remainingTime;
    const remHours = status.remainingHours;
    const excess = remHours * 1.2 - remainingTime;

    const toDrop: SubTask[] = [];
    let droppedHours = 0;
    for (const s of undone) {
      toDrop.push(s);
      droppedHours += s.estimatedHours;
      if (droppedHours * 1.2 >= excess) {
        break;
      }
    }

    const newTotalEstimatedHours = remHours - droppedHours;
    proposal = {
      type: "drop",
      targetSubtaskIds: toDrop.map((s) => s.id),
      reason: `${goalSuffix}期限までの猶予（${remainingTime.toFixed(
        1
      )}時間）に対して未完了工数が${(remHours * 1.2).toFixed(
        1
      )}時間あります。${toDrop
        .map((s) => s.title)
        .join("、")}を削除することでスケジュールに収まります。`,
      newTotalEstimatedHours,
      newEffectiveTotalHours: newTotalEstimatedHours * 1.2,
      droppedSubtasks: toDrop,
    };
  } else {
    const target = undone[0];
    const reduction = target.estimatedHours * 0.5;
    const newTotalEstimatedHours = status.remainingHours - reduction;

    proposal = {
      type: "simplify",
      targetSubtaskIds: [target.id],
      reason: `${goalSuffix}バッファが残り少なくなっています。${target.title}を簡略化（工数50%削減）することで余裕を確保できます。`,
      newTotalEstimatedHours,
      newEffectiveTotalHours: newTotalEstimatedHours * 1.2,
      droppedSubtasks: [],
    };
  }

  return NextResponse.json({ proposal });
}
