"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import IntakePhase from "@/components/IntakePhase";
import ProjectCard from "@/components/ProjectCard";
import type { ProjectSummary } from "@/lib/types";

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
    <main className="min-h-screen bg-gray-100 p-8 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold">AI-Driven Reverse Scheduler</h1>
          <p className="text-gray-500 mt-2">期日を守る。間に合わないなら、削ろう。</p>
        </header>

        <IntakePhase onNext={handleStartNewProject} />

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">プロジェクト一覧</h2>
            <Link
              href="/projects/new"
              className="text-sm bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
            >
              新規プロジェクト
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-500">読み込み中...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : projects.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
              プロジェクトがありません。上のフォームから目標と期日を入力してください。
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}