import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CommitCard from '@/components/CommitCard';
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function CommitsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/');
  }

  const commits = await prisma.commit.findMany({
    where: {
      user: {
        email: session.user.email
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meus Commits</h1>
        </div>

        {commits.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum commit</h3>
            <p className="mt-1 text-sm text-gray-500">
              Seus commits aparecerão aqui quando você começar a fazer commits em seus projetos.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {commits.map((commit) => (
              <CommitCard key={commit.id} commit={commit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 