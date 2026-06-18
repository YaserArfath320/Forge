import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProjectSummary } from "@/types/project";

interface ProjectCardProps {
    projects: ProjectSummary[];
}

export function ProjectCard({ projects }: ProjectCardProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
                <Link
                    key={project.id}
                    href={`/workspace?id=${project.id}`}
                    className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
                >
                    <div className="mb-4 flex items-center justify-between text-sm text-white/50">
                        <span>{project.messageCount} messages</span>
                        <span>
                            {new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }).format(project.updatedAt)}
                        </span>
                    </div>

                    <h3 className="mb-2 text-xl font-semibold text-white">
                        {project.title ?? "Untitled project"}
                    </h3>

                    <p className="text-sm leading-6 text-white/60">
                        {project.firstPrompt ?? "No prompt available yet."}
                    </p>

                    <div className="mt-5 flex items-center justify-between text-sm text-white/60">
                        <span className="font-medium text-white">Open project</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
