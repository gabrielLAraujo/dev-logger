import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Octokit } from '@octokit/rest';
import { Project, Commit, Prisma } from '@prisma/client';

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    } | null;
  };
}

interface CommitResult {
  repositoryUrl: string;
  commits: GitHubCommit[];
}

async function fetchGitHubCommits(
  token: string,
  repoUrl: string
): Promise<GitHubCommit[]> {
  const octokit = new Octokit({ auth: token });
  const [owner, repo] = repoUrl.split("/").slice(-2);

  const { data } = await octokit.repos.listCommits({
    owner,
    repo,
    per_page: 100,
  });

  return data as GitHubCommit[];
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project || !project.id) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    const projectId = project.id as string;

    const userSettings = await prisma.userSettings.findUnique({
      where: { userEmail: session.user.email },
    });

    if (!userSettings?.githubToken) {
      return NextResponse.json(
        { error: 'Token do GitHub não configurado' },
        { status: 400 }
      );
    }

    const commitResults: CommitResult[] = await Promise.all(
      project.repositories.map(async (repoUrl) => {
        try {
          const commits = await fetchGitHubCommits(
            userSettings.githubToken!,
            repoUrl
          );
          return {
            repositoryUrl: repoUrl,
            commits,
          };
        } catch (error) {
          console.error(
            `Erro ao buscar commits do repositório ${repoUrl}:`,
            error
          );
          return {
            repositoryUrl: repoUrl,
            commits: [],
          };
        }
      })
    );

    const commitsToSave = commitResults.flatMap((result) =>
      result.commits.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        authorName: commit.commit.author?.name || 'Unknown',
        authorEmail: commit.commit.author?.email || 'unknown@email.com',
        authorDate: new Date(commit.commit.author?.date || new Date()),
        htmlUrl: `https://github.com/${commit.sha}`,
        projectId
      }))
    );

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const commit of commitsToSave) {
        await tx.commit.upsert({
          where: {
            sha_projectId: {
              sha: commit.sha,
              projectId: commit.projectId
            }
          },
          update: commit,
          create: commit,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao sincronizar commits:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar commits' },
      { status: 500 }
    );
  }
} 