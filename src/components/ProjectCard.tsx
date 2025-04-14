'use client';

import Link from 'next/link';
import { Project } from '@prisma/client';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900">
          <Link href={`/projects/${project.id}`} className="hover:text-indigo-600">
            {project.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-gray-500">{project.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {project.status}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Criado em {new Date(project.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
} 