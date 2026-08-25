"use client";

import { useState } from "react";
import type { MainTask } from "../types/task";
import type { History, TriageProposal } from "../lib/types";

type RightPanelProps = {
  mode: "yellow" | "red";
  task: MainTask;
  histories: History[];
  onClose: () => void;
  onTriage: (
    mode: "yellow" | "red",
    context: { goal: string; priority?: string }
  ) => Promise<TriageProposal | null>;
  onApplyProposal: (proposal: TriageProposal) => Promise<void>;
  onAddHistory: (content: string) => Promise<void>;
};

const evaluationLabels = [
  { key: "triageAccuracy", label: "的確度" },
  { key: "psychologicalRelief", label: "救済度" },
  { key: "feasibility", label: "実現可能性" },
] as const;

export default function RightPanel({
  mode,
  task,
  histories,
  onClose,
  onTriage,
  onApplyProposal,
  onAddHistory,
}: RightPanelProps) {
  const [goal, setGoal] = useState("");
  const [priority, setPriority] = useState<"" | "must" | "should" | "could">("");
  const [proposal, setProposal] = useState<TriageProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyContent, setHistoryContent] = useState("");

  const [evaluatingHistoryId, setEvaluatingHistoryId] = useState<string | null>(null);
  const [evalForm, setEvalForm] = useState({
    triageAccuracy: 3,
    psychologicalRelief: 3,
    feasibility: 3,
    comment: "",
  });
  const [evalMessage, setEvalMessage] = useState("");

  const handleTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) return;

    setLoading(true);
    setError("");
    const context: { goal: string; priority?: string } = { goal: trimmedGoal };
    if (mode === "yellow" && priority) {
      context.priority = priority;
    }

    try {
      const result = await onTriage(mode, context);
      if (result) {
        setProposal(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "トリアージに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!proposal) return;
    setLoading(true);
    try {
      await onApplyProposal(proposal);
      setProposal(null);
      setGoal("");
      setPriority("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "提案の適用に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = historyContent.trim();
    if (!trimmed) return;
    await onAddHistory(trimmed);
    setHistoryContent("");
  };

  const submitEvaluation = async (historyId: string) => {
    setEvalMessage("");
    const res = await fetch(`/api/histories/${historyId}/evaluation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evalForm),
    });

    if (res.ok) {
      setEvalMessage("評価を保存しました");
      setEvaluatingHistoryId(null);
      setEvalForm({
        triageAccuracy: 3,
        psychologicalRelief: 3,
        feasibility: 3,
        comment: "",
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setEvalMessage(data.error || "評価の保存に失敗しました");
    }
  };
  return (
    <aside className="ai-panel w-96 h-[calc(100vh-4rem)] flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 sticky top-8 animate-fade-in shrink-0" aria-label="AIによる計画立て直し">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h3 className="font-bold text-lg">
          {mode === "yellow" ? "🟡 AIサポート" : "🔴 AIトリアージ"}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-black" aria-label="AIパネルを閉じる">
          ✖
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}

        {proposal ? (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="font-bold text-gray-800 mb-2">
                {proposal.type === "drop" ? "🗑️ 削除提案" : "✂️ 簡略化提案"}
              </p>
              <p className="text-sm text-gray-700 mb-2">{proposal.reason}</p>
              <p className="text-xs text-gray-500">
                新規想定工数: {proposal.newTotalEstimatedHours.toFixed(1)}h /
                実質: {proposal.newEffectiveTotalHours.toFixed(1)}h
              </p>
              {proposal.droppedSubtasks.length > 0 && (
                <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
                  {proposal.droppedSubtasks.map((s) => (
                    <li key={s.id}>{s.title}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={handleApply}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 rounded font-bold shadow-md hover:bg-red-700 disabled:bg-gray-400"
            >
              {loading ? "適用中..." : "提案を適用する"}
            </button>
            <button
              onClick={() => setProposal(null)}
              className="w-full bg-white border border-gray-300 py-2 rounded font-bold text-gray-700 hover:bg-gray-50"
            >
              やり直す
            </button>
          </div>
        ) : (
          <form onSubmit={handleTriage} className="space-y-4 text-sm">
            <div className="bg-white p-3 rounded-lg border shadow-sm">
              <p>
                「<strong>{task.title}</strong>」
                {mode === "yellow"
                  ? "に遅延の兆候があります。スケジュールの再構築のため、タスクの目的を教えてください。"
                  : "のスケジュールが厳しくなっています。目的を絞り込んで、削減可能な要件を特定します。"}
              </p>
            </div>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="最終目的 (例: プレゼンで評価を得る)"
              className="w-full p-2 border rounded"
              required
            />
            {mode === "yellow" && (
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "" | "must" | "should" | "could")
                }
                className="w-full p-2 border rounded text-gray-600"
              >
                <option value="">重要度を選択...</option>
                <option value="must">高 (Must have)</option>
                <option value="should">中 (Should have)</option>
                <option value="could">低 (Could have)</option>
              </select>
            )}
            <button
              type="submit"
              disabled={loading || !goal.trim()}
              className="w-full bg-black text-white py-2 rounded font-bold disabled:bg-gray-400"
            >
              {loading ? "AIと相談中..." : "送信する"}
            </button>
          </form>
        )}

        <div className="border-t pt-4">
          <h4 className="font-bold text-sm text-gray-600 mb-2">
            変更履歴を追加
          </h4>
          <form onSubmit={handleAddHistory} className="flex gap-2">
            <input
              type="text"
              value={historyContent}
              onChange={(e) => setHistoryContent(e.target.value)}
              placeholder="変更内容"
              className="flex-1 p-2 border rounded text-sm"
            />
            <button
              type="submit"
              disabled={!historyContent.trim()}
              className="px-3 py-2 bg-gray-800 text-white rounded text-sm font-bold disabled:bg-gray-400"
            >
              追加
            </button>
          </form>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-bold text-sm text-gray-600 mb-3">変更履歴</h4>
          {histories.length === 0 ? (
            <p className="text-xs text-gray-400">履歴はありません</p>
          ) : (
            <ul className="text-xs space-y-3 text-gray-500">
              {histories.map((h) => (
                <li key={h.id} className="bg-white p-3 rounded border">
                  <div className="flex gap-2">
                    <span className="text-gray-400 shrink-0">
                      {new Date(h.timestamp).toLocaleDateString("ja-JP")}
                    </span>
                    <span>{h.content}</span>
                  </div>
                  {evaluatingHistoryId === h.id ? (
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {evaluationLabels.map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-xs text-gray-400">
                              {label}
                            </label>
                            <select
                              value={evalForm[key]}
                              onChange={(e) =>
                                setEvalForm({
                                  ...evalForm,
                                  [key]: parseInt(e.target.value, 10),
                                })
                              }
                              className="w-full p-1 border rounded"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={evalForm.comment}
                        onChange={(e) =>
                          setEvalForm({ ...evalForm, comment: e.target.value })
                        }
                        placeholder="所感（任意）"
                        className="w-full p-1 border rounded"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitEvaluation(h.id)}
                          className="flex-1 bg-blue-600 text-white py-1 rounded"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEvaluatingHistoryId(null)}
                          className="flex-1 bg-white border py-1 rounded"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEvaluatingHistoryId(h.id);
                        setEvalMessage("");
                      }}
                      className="mt-2 text-blue-600 hover:underline"
                    >
                      評価する
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {evalMessage && (
            <p className="text-xs text-green-600 mt-2">{evalMessage}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
