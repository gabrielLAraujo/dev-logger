'use client';

import { Commit } from '@prisma/client';

interface CommitCardProps {
  commit: Commit & {
    project: {
      name: string;
    };
  };
}

export default function CommitCard({ commit }: CommitCardProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {commit.message}
          </h3>
          <a 
            href={commit.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            Ver no GitHub
          </a>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          <p>Projeto: {commit.project.name}</p>
          <p>Autor: {commit.authorName}</p>
          <p>SHA: {commit.sha.substring(0, 7)}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {new Date(commit.authorDate).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
} 