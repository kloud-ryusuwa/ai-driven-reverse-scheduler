"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import IntakePhase from "@/components/IntakePhase";
import ProjectCard from "@/components/ProjectCard";
import type { ProjectSummary } from "@/lib/types";
import { Alert, Box, Button, CircularProgress, Container, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Stack component="header" direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-end" }} spacing={2} sx={{ mb: 3.5 }}>
          <Box><Typography variant="overline" color="primary" fontWeight={800}>AI-DRIVEN REVERSE SCHEDULER</Typography><Typography variant="h1">締切から、仕事を設計する。</Typography><Typography color="text.secondary" sx={{ mt: .75 }}>余裕を可視化し、間に合わないときはAIとスコープを削る。</Typography></Box>
          <Button component={Link} href="/projects/new" variant="contained" startIcon={<AddRoundedIcon />}>新規プロジェクト</Button>
        </Stack>

        <IntakePhase onNext={handleStartNewProject} />

        <Box component="section" sx={{ mt: 5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: 2 }}><Box><Typography variant="h2">進行中のプロジェクト</Typography><Typography variant="body2" color="text.secondary">危機状態のプロジェクトから確認してください。</Typography></Box><Typography variant="body2" color="text.secondary">{projects.length} 件</Typography></Stack>

          {loading ? (
            <Stack alignItems="center" py={6} spacing={1}><CircularProgress size={28} /><Typography color="text.secondary">読み込み中</Typography></Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : projects.length === 0 ? (
            <Box sx={{ p: 5, bgcolor: "background.paper", border: "1px dashed #cbd2df", borderRadius: 3, textAlign: "center" }}><Typography fontWeight={700}>まだプロジェクトがありません</Typography><Typography variant="body2" color="text.secondary">上のフォームに最初のゴールを入力してください。</Typography></Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
