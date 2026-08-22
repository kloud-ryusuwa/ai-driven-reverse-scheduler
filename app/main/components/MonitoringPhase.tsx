import {useState} from "react";
import { MainTask } from "../types/task";
import { getStatusFromBuffer } from "../utils/calculations";

export type { MainTask } from "../types/task";

const getDynamicColor = (percent: number, lightness: number = 50) => {
  const hue = Math.max(0, Math.min(120, percent * 1.2));
  return `hsl(${hue}, 85%, ${lightness}%)`;
};

// 🌟 tasks を引数(Props)として受け取るように変更
export default function MonitoringPhase({ 
  tasks, 
  onOpenPanel 
}: { 
  tasks: MainTask[]; 
  onOpenPanel: (mode: "yellow" | "red", task: MainTask) => void 
}) {
  return (
    <section className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold">現在のタスク状況</h2>

      {/* 受け取った tasks をループで回す (中身は変更なし) */}
      {tasks.map((task) => {
        const status = getStatusFromBuffer(task.bufferPercentage);
        const progressWidth = `${(task.completedSubtasks / task.totalSubtasks) * 100}%`;
        const mainColor = getDynamicColor(task.bufferPercentage, 45);
        const bgColor = getDynamicColor(task.bufferPercentage, 96);
        const textColor = getDynamicColor(task.bufferPercentage, 30);

        return (
          <div key={task.id} className="bg-white rounded-xl shadow-sm border-l-4 border-y border-r overflow-hidden relative" style={{ borderLeftColor: mainColor, borderColor: '#e5e7eb', borderLeftWidth: '4px' }}>
            <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: bgColor, borderColor: '#f3f4f6' }}>
              <div>
                <span className="text-xs font-bold px-2 py-1 rounded-full shadow-sm" style={{ backgroundColor: 'white', color: mainColor, border: `1px solid ${mainColor}` }}>
                  {status === "red" ? "🚨 破綻寸前" : status === "yellow" ? "⚠️ 遅延の兆候あり" : "✅ 順調"}
                </span>
                <h3 className="text-lg font-bold mt-2 text-gray-800">{task.title}</h3>
                <p className="text-xs font-bold mt-1" style={{ color: textColor }}>
                  全体のバッファ残量: {task.bufferPercentage}% (進捗: {task.completedSubtasks}/{task.totalSubtasks})
                </p>
              </div>
              
              {status !== "green" && (
                <button onClick={() => onOpenPanel(status as "yellow" | "red", task)} className={`px-4 py-2 rounded-lg font-bold shadow-md transition-all text-white ${status === "red" ? "animate-pulse" : ""}`} style={{ backgroundColor: mainColor }}>
                  {status === "red" ? "AIに救済を求める" : "AIと相談する"}
                </button>
              )}
            </div>

            <div className="w-full bg-gray-100 h-2">
              <div className="h-2 rounded-r-full transition-all duration-500" style={{ width: progressWidth, backgroundColor: mainColor }}></div>
            </div>

            <div className="p-4 space-y-2 bg-white">
              {task.subtasks.map((sub) => (
                <label key={sub.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" defaultChecked={sub.isDone} className="w-4 h-4 cursor-pointer" style={{ accentColor: mainColor }} />
                  <span className={`text-sm ${sub.isDone ? "text-gray-400 line-through" : "font-bold text-gray-800"}`}>{sub.title}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}