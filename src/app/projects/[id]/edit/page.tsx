import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import EditProjectForm from '@/components/EditProjectForm';

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      user: {
        email: session.user.email,
      },
    },
    include: {
      WorkSchedule: true,
    },
  });

  if (!project) {
    redirect('/projects');
  }

  return <EditProjectForm project={project} />;
} 