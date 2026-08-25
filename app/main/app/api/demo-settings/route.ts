import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getDemoSettings, updateDemoSettings } from "@/lib/demo";

const client = () => new OpenAI({ apiKey: process.env.SAKURA_API_KEY, baseURL: process.env.SAKURA_BASE_URL });

export async function GET() {
  let models: string[] = [];
  try {
    const result = await client().models.list();
    models = result.data.map((model) => model.id).sort();
  } catch {
    models = [getDemoSettings().model];
  }
  return NextResponse.json({ ...getDemoSettings(), models: Array.from(new Set(models)) });
}

export async function PATCH(request: Request) {
  const body = await request.json() as { now?: unknown; model?: unknown };
  if (body.now !== undefined && body.now !== null && (typeof body.now !== "string" || Number.isNaN(Date.parse(body.now)))) {
    return NextResponse.json({ error: "now はISO 8601形式で指定してください" }, { status: 400 });
  }
  if (body.model !== undefined && (typeof body.model !== "string" || !body.model.trim())) {
    return NextResponse.json({ error: "model は空にできません" }, { status: 400 });
  }
  return NextResponse.json(updateDemoSettings({ now: body.now as string | null | undefined, model: typeof body.model === "string" ? body.model : undefined }));
}
