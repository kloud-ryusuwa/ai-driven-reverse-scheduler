"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import IntakePhase from "@/components/IntakePhase";
import ProjectCard from "@/components/ProjectCard";
import type { ProjectSummary } from "@/lib/types";
import { Alert, Box, CircularProgress, Container, Stack, Typography } from "@mui/material";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sortedProjects = useMemo(() => {
    const order = { red: 0, yellow: 1, green: 2 } as const;
    return [...projects].sort((a, b) => order[a.status] - order[b.status] || new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "プロジェクト一覧の取得に失敗しました");
      }
      const data = await res.json();
      setProjects(data.projects ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // マウント時にプロジェクト一覧を取得する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjects();
  }, []);

  const handleStartNewProject = (taskName: string, deadline: string) => {
    const params = new URLSearchParams();
    params.set("task", taskName);
    params.set("deadline", deadline);
    router.push(`/projects/new?${params.toString()}`);
  };

  return (
    <Box component="main" sx={{ minHeight: "100vh" }}>
      <Container maxWidth="lg">
        <Box sx={{ minHeight: { xs: "calc(100vh - 64px)", md: "100vh" }, display: "flex", alignItems: "center", py: 3 }}><Box sx={{ width: "100%" }}><IntakePhase onNext={handleStartNewProject} /></Box></Box>

        <Box component="section" sx={{ pb: 6 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 2 }}><Box><Typography variant="h2">進行中のプロジェクト</Typography><Typography variant="body2" color="text.secondary">危機状態のプロジェクトから確認してください。</Typography></Box><Typography variant="body2" color="text.secondary">{projects.length} 件</Typography></Stack>

          {loading ? (
            <Stack alignItems="center" py={6} spacing={1}><CircularProgress size={28} /><Typography color="text.secondary">読み込み中</Typography></Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : projects.length === 0 ? (
            <Box sx={{ p: 5, bgcolor: "background.paper", border: "1px dashed #cbd2df", borderRadius: 3, textAlign: "center" }}><Typography fontWeight={700}>まだプロジェクトがありません</Typography><Typography variant="body2" color="text.secondary">上のフォームに最初のゴールを入力してください。</Typography></Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
              {sortedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
