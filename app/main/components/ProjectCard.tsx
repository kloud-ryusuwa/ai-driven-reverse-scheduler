import Link from "next/link";
import { ProjectSummary } from "@/lib/types";
import { getStatusFromBuffer } from "@/utils/calculations";
import { Box, Card, CardActionArea, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

type ProjectCardProps = {
  project: ProjectSummary;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const status = getStatusFromBuffer(project.bufferPercentage);
  const progress =
    project.totalSubtasks === 0
      ? 0
      : (project.completedSubtasks / project.totalSubtasks) * 100;

  const statusBadge =
    status === "green"
      ? { label: "順調", color: "success" as const }
      : status === "yellow"
      ? { label: "要注意", color: "warning" as const }
      : { label: "危機", color: "error" as const };

  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea component={Link} href={`/projects/${project.id}`} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box sx={{ minWidth: 0 }}><Chip label={statusBadge.label} color={statusBadge.color} size="small" sx={{ mb: 1.25 }} /><Typography variant="h6" fontWeight={750} noWrap>{project.title}</Typography><Typography variant="body2" color="text.secondary">期日 {new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(new Date(`${project.deadline}T00:00:00`))}</Typography></Box>
            <ArrowForwardRoundedIcon color="action" />
          </Stack>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, mb: .75 }}><Typography variant="caption" color="text.secondary">進捗 {project.completedSubtasks}/{project.totalSubtasks}</Typography><Typography variant="caption" fontWeight={750}>バッファ {Math.round(project.bufferPercentage)}%</Typography></Stack>
          <LinearProgress variant="determinate" value={progress} color={statusBadge.color} sx={{ height: 7, borderRadius: 8 }} />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
