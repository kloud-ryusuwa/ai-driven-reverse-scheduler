import Link from "next/link";
import { ProjectSummary } from "@/lib/types";
import { getStatusFromBuffer } from "@/utils/calculations";

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
      ? { label: "順調", bg: "bg-green-100", text: "text-green-700" }
      : status === "yellow"
      ? { label: "警告", bg: "bg-yellow-100", text: "text-yellow-700" }
      : { label: "危機", bg: "bg-red-100", text: "text-red-700" };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div>
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-bold mb-2 ${statusBadge.bg} ${statusBadge.text}`}
          >
            {statusBadge.label}
          </span>
          <h3 className="text-lg font-bold text-gray-800">{project.title}</h3>
          <p className="text-sm text-gray-500">期日: {project.deadline}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-700">
            バッファ {project.bufferPercentage}%
          </p>
          <p className="text-xs text-gray-500">
            {project.completedSubtasks}/{project.totalSubtasks} 完了
          </p>
        </div>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Link>
  );
}
