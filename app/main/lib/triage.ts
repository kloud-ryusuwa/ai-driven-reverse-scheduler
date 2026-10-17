import type { Project, TriageProposal } from "./types";

export async function requestTriage(
  id: string,
  mode: "yellow" | "red",
  context: { goal: string; priority?: string }
): Promise<TriageProposal> {
  const res = await fetch(`/api/projects/${id}/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, context }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "トリアージに失敗しました");
  }
  return data.proposal as TriageProposal;
}

export async function applyTriageProposal(
  id: string,
  proposal: TriageProposal,
  project: Project
): Promise<void> {
  if (proposal.type === "drop") {
    for (const sub of proposal.droppedSubtasks) {
      await fetch(`/api/projects/${id}/subtasks/${sub.id}`, {
        method: "DELETE",
      });
    }
  } else if (proposal.targetSubtaskIds.length > 0) {
    const targetId = proposal.targetSubtaskIds[0];
    const target = project.subtasks.find((s) => s.id === targetId);
    if (target) {
      await fetch(`/api/projects/${id}/subtasks/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimatedHours: target.estimatedHours * 0.5 }),
      });
    }
  }

  await fetch(`/api/projects/${id}/histories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `AI提案を適用: ${proposal.reason}` }),
  });
}
