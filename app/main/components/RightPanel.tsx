import type { useState } from "react";
import type { MainTask } from "../types/task";

export default function RightPanel({ 
  mode,
  task,
  onClose
}: {
  mode: "yellow" | "red";
  task: MainTask;
  onClose: () => void;
}) {
  return (
    <aside className="w-96 h-[calc(100vh-4rem)] flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 sticky top-8 animate-fade-in shrink-0">
      
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h3 className="font-bold text-lg">{mode === "yellow" ? "🟡 AIサポート" : "🔴 AIトリアージ"}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-black">✖</button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
        {mode === "yellow" ? (
          <div className="space-y-4 text-sm">
            <div className="bg-white p-3 rounded-lg border shadow-sm">
              {/* 🌟 3. 受け取った task.title を文章の中に埋め込む */}
              <p>「<strong>{task.title}</strong>」に遅延の兆候があります。スケジュールの再構築のため、このタスクの情報を教えてください。</p>
            </div>
            <input type="text" placeholder="最終目的 (例: プレゼンのため)" className="w-full p-2 border rounded" />
            <select className="w-full p-2 border rounded text-gray-600">
              <option>重要度を選択...</option>
              <option>高 (Must have)</option>
              <option>中 (Should have)</option>
              <option>低 (Could have)</option>
            </select>
            <button className="w-full bg-black text-white py-2 rounded font-bold">送信する</button>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <p className="font-bold text-red-600 mb-1">🚨 破綻の危機を検知しました</p>
              {/* 🌟 3. 受け取った task.title を文章の中に埋め込む */}
              <p>「<strong>{task.title}</strong>」のサブタスクの一部は必須要件ではありません。要件を絞ることでバッファを確保できます。</p>
            </div>
            <button className="w-full bg-red-600 text-white py-2 rounded font-bold shadow-md hover:bg-red-700">提案を受け入れる (要件の簡略化)</button>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        <input type="text" placeholder="AIに質問・要望を送信..." className="w-full p-2 border rounded-full text-sm bg-gray-50" />
      </div>
      <div className="h-48 p-4 border-t-2 border-gray-100 bg-white rounded-b-xl overflow-y-auto">
        <h4 className="font-bold text-sm text-gray-600 mb-3">変更履歴</h4>
        <ul className="text-xs space-y-3 text-gray-500">
          <li className="flex gap-2"><span className="text-gray-400">10/21</span><span>バッファを消費し実質締切を延長</span></li>
          <li className="flex gap-2"><span className="text-gray-400">10/18</span><span>AI提案で装飾タスクをDrop</span></li>
        </ul>
      </div>
    </aside>
  );
}