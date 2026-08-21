import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 🌸 さくらのAI Engineに接続するための設定
const openai = new OpenAI({
  apiKey: process.env.SAKURA_API_KEY,
  baseURL: process.env.SAKURA_BASE_URL, 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskName, deadline } = body;

    if (!taskName) {
      return NextResponse.json({ error: 'タスク名が入力されていません' }, { status: 400 });
    }

    const prompt = `
    あなたはプロのプロジェクトマネージャーです。
    以下の目標（メインタスク）を達成するためのサブタスク（WBS）を分割し、それぞれの想定工数（時間）を見積もってください。
    また、全体の工数に対して20%のバッファを追加し、実質的な総工数を算出してください。

    【入力情報】
    - メインタスク: ${taskName}
    - 絶対期日: ${deadline || '指定なし'}

    以下のJSONフォーマットで返却してください。JSON以外のテキストは一切出力しないでください。
    {
      "title": "メインタスク名",
      "totalEstimatedHours": 10,
      "bufferHours": 2,
      "effectiveTotalHours": 12,
      "subtasks": [
        { "title": "サブタスク1", "estimatedHours": 2 },
        { "title": "サブタスク2", "estimatedHours": 8 }
      ]
    }
    `;

    // 🌸 モデル名をさくらのものに指定
    const response = await openai.chat.completions.create({
      model: 'gpt-oss-120b', // llm-jp-3.1-8x13b-instruct4 に変更してもOKです
      messages: [{ role: 'user', content: prompt }],
      // 互換APIによっては response_format でエラーになることがあるため、
      // 今回はプロンプトの指示（JSON以外のテキストは出力しない）に頼る形にしています。
    });

    // テキストを取り出してJSONとして解釈（パース）する
    const textResponse = response.choices[0].message.content || '{}';
    const result = JSON.parse(textResponse);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Sakura AI API Error:', error);
    return NextResponse.json({ error: 'WBSの生成に失敗しました' }, { status: 500 });
  }
}