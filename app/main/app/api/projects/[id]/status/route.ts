import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/store";
import { calculateBufferStatus } from "@/lib/buffer";
import { DemoClock } from "@/lib/clock";
import { jsonError, resolveParams, type RouteParams } from "@/lib/api";

const clock = new DemoClock();

export async function GET(
  _request: NextRequest,
  context: { params: RouteParams<{ id: string }> }
) {
  const { id } = await resolveParams(context.params);
  const record = getProject(id);

  if (!record) {
    return jsonError("プロジェクトが見つかりません", 404);
  }

  return NextResponse.json(calculateBufferStatus(record, clock.now()));
}
