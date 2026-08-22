import { useState } from "react";

export default function IntakePhase({ onNext }: { onNext: (task: string, date: string) => void }) {
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-lg font-bold mb-4">新しい目標を追加</h2>
      <div className="flex gap-4">
        <input 
          type="text" 
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="タスク名 (例: 競合リサーチ)" 
          className="flex-1 p-3 border rounded-lg bg-gray-50" 
        />
        <input 
          type="date" 
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="p-3 border rounded-lg bg-gray-50" 
        />
        <button 
          onClick={() => onNext(taskName, deadline)} 
          disabled={!taskName}
          className="bg-black text-white px-6 py-3 rounded-lg font-bold disabled:bg-gray-400"
        >
          AIに計画させる
        </button>
      </div>
    </section>
  );
}