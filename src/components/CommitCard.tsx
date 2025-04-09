'use client';

import { Commit } from '@prisma/client';

interface CommitCardProps {
  commit: Commit;
}

export default function CommitCard({ commit }: CommitCardProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {commit.message}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {commit.type}
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          <p>Repositório: {commit.repository}</p>
          <p>Branch: {commit.branch}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {new Date(commit.createdAt).toLocaleDateString('pt-BR')}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {commit.filesChanged} arquivos alterados
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 