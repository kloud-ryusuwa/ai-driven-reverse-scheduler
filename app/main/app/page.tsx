"use client";

import { useEffect, useMemo, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import type { ProjectSummary } from "@/lib/types";
import { Alert, Box, CircularProgress, Container, Stack, Typography } from "@mui/material";

export default function Home() {
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

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Box component="section" sx={{ pb: 6 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 2 }}><Box><Typography variant="h1">ダッシュボード</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>対応が必要な順に表示しています。</Typography></Box><Typography variant="body2" color="text.secondary">{projects.length} 件</Typography></Stack>

          {loading ? (
            <Stack alignItems="center" py={6} spacing={1}><CircularProgress size={28} /><Typography color="text.secondary">読み込み中</Typography></Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : projects.length === 0 ? (
            <Box sx={{ p: 5, bgcolor: "background.paper", border: "1px dashed #cbd2df", borderRadius: 3, textAlign: "center" }}><Typography fontWeight={700}>まだプロジェクトがありません</Typography><Typography variant="body2" color="text.secondary">左の「新規プロジェクト」から作成してください。</Typography></Box>
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
