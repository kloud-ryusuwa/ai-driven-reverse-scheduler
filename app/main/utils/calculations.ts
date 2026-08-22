// utils/calculations.ts
import { MainTask, TaskStatus } from "../types/task";

/**
 * 🌟 バッファ残量からステータス（信号の色）を判定する関数
 */
export const getStatusFromBuffer = (percent: number): TaskStatus => {
  if (percent >= 50) return "green";
  if (percent > 0) return "yellow";
  return "red";
};

/**
 * 🌟 今後実装する：残日数と残工数から最新のバッファ(%)を計算する関数
 * （今は一旦、既存の数値をそのまま返す枠組みだけ作っておきます）
 */
export const calculateCurrentBuffer = (task: MainTask): number => {
  // TODO: ここに日付計算と工数計算のガチロジックを書く！
  return task.bufferPercentage; 
};