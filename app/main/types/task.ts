// プロジェクト全体で使いまわすデータ構造
export type SubTask = {
  id: string;
  title: string;
  isDone: boolean;
  estimatedHours: number; // 🌟 AIが算出した想定工数
};

export type TaskStatus = "red" | "yellow" | "green";

export type MainTask = {
  id: string;
  title: string;
  deadline: string;       // 🌟 絶対期日 (YYYY-MM-DD)
  bufferPercentage: number;
  completedSubtasks: number;
  totalSubtasks: number;
  subtasks: SubTask[];
  extraSubtasksCount?: number;
};