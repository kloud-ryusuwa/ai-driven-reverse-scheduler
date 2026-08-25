import { useEffect, useState } from "react";

type IntakePhaseProps = {
  onNext: (task: string, date: string) => void;
  initialTaskName?: string;
  initialDeadline?: string;
};

export default function IntakePhase({
  onNext,
  initialTaskName = "",
  initialDeadline = "",
}: IntakePhaseProps) {
  const [taskName, setTaskName] = useState(initialTaskName);
  const [deadline, setDeadline] = useState(initialDeadline);

  useEffect(() => {
    // クエリパラメータ等の初期値が変わったらフォームを同期する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTaskName(initialTaskName);
    setDeadline(initialDeadline);
  }, [initialTaskName, initialDeadline]);

  const handleSubmit = () => {
    if (!taskName.trim()) return;
    onNext(taskName.trim(), deadline);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-lg font-bold mb-4">新しい目標を追加</h2>
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={handleKeyDown}
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
          onClick={handleSubmit}
          disabled={!taskName.trim()}
          className="bg-black text-white px-6 py-3 rounded-lg font-bold disabled:bg-gray-400 hover:bg-gray-800 transition-colors"
        >
          AIに計画させる
        </button>
      </div>
    </section>
  );
}