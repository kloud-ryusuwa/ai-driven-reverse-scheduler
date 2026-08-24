export type TaskStatus = "green" | "yellow" | "red";

export type SubTask = {
  id: string;
  projectId: string;
  title: string;
  estimatedHours: number;
  isDone: boolean;
};

export type ProjectSummary = {
  id: string;
  title: string;
  deadline: string;
  status: TaskStatus;
  bufferPercentage: number;
  completedSubtasks: number;
  totalSubtasks: number;
};

export type Project = ProjectSummary & {
  initialRemainingTime: number;
  initialTotalHours: number;
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
};

/** 永続化用の生データ（status/bufferPercentage は都度計算） */
export type ProjectRecord = {
  id: string;
  title: string;
  deadline: string;
  initialRemainingTime: number;
  initialTotalHours: number;
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
};

export type AIProposalSubtask = {
  title: string;
  estimatedHours: number;
};

export type AIProposal = {
  title: string;
  totalEstimatedHours: number;
  bufferHours: number;
  effectiveTotalHours: number;
  subtasks: AIProposalSubtask[];
};

export type TriageProposal = {
  type: "drop" | "simplify";
  targetSubtaskIds: string[];
  reason: string;
  newTotalEstimatedHours: number;
  newEffectiveTotalHours: number;
  droppedSubtasks: SubTask[];
};

export type History = {
  id: string;
  projectId: string;
  timestamp: string;
  content: string;
};

export type Evaluation = {
  id: string;
  historyId: string;
  triageAccuracy: number;
  psychologicalRelief: number;
  feasibility: number;
  comment?: string;
};

export type BufferStatus = {
  projectId: string;
  status: TaskStatus;
  bufferPercentage: number;
  remainingTime: number;
  remainingHours: number;
  initialRemainingTime: number;
  initialTotalHours: number;
};
