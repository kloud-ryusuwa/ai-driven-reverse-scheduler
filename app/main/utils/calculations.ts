// utils/calculations.ts
import { MainTask, TaskStatus } from "@/lib/types";

/**
 * 🌟 バッファ残量からステータスを判定する関数
 */
export const getStatusFromBuffer = (percent: number): TaskStatus => {
  if (percent >= 50) return "green";
  if (percent > 0) return "yellow";
  return "red";
};

/**

 */
export const calculateCurrentBuffer = (task: MainTask): number => {
  // TODO: ここに日付計算と工数計算のロジックを書く予定
  return task.bufferPercentage; 
};
