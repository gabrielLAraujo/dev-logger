import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProjectReport from '@/components/ProjectReport';
import { Project, WorkSchedule } from '@prisma/client';

type ProjectWithRelations = Project & {
  WorkSchedule: WorkSchedule[];
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  const projects = await prisma.project.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      WorkSchedule: true,
    },
  }) as ProjectWithRelations[];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Relatórios</h1>
      <div className="space-y-8">
        {projects.map((project) => (
          <ProjectReport
            key={project.id}
            projectName={project.name}
            WorkSchedule={project.WorkSchedule}
            repositories={project.repositories}
            projectId={project.id}
          />
        ))}
      </div>
    </div>
  );
} 