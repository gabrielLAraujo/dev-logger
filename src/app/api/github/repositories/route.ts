import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  } | null;
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  score: number;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Busca o token do GitHub do usuário
    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userEmail: session.user.email,
      },
    });

    if (!userSettings?.githubToken) {
      return NextResponse.json(
        { error: 'Token do GitHub não encontrado' },
        { status: 401 }
      );
    }

    // Verifica se há um parâmetro de organização na URL
    const { searchParams } = new URL(request.url);
    const organization = searchParams.get('organization');

    // Buscar repositórios do usuário
    const userReposResponse = await fetch('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${userSettings.githubToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userReposResponse.ok) {
      throw new Error('Erro ao buscar repositórios do usuário');
    }

    const userRepos: GitHubRepository[] = await userReposResponse.json();

    // Buscar repositórios da organização, se especificada
    let orgRepos: GitHubRepository[] = [];
    if (organization) {
      const orgReposResponse = await fetch(`https://api.github.com/orgs/${organization}/repos`, {
        headers: {
          Authorization: `Bearer ${userSettings.githubToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (orgReposResponse.ok) {
        orgRepos = await orgReposResponse.json();
      }
    }

    // Combinar e remover duplicatas
    const allRepos = [...userRepos, ...orgRepos];
    const uniqueRepos = allRepos.filter((repo, index, self) =>
      index === self.findIndex((r) => r.id === repo.id)
    );

    return NextResponse.json(uniqueRepos);
  } catch (error) {
    console.error('Erro ao buscar repositórios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar repositórios' },
      { status: 500 }
    );
  }
} 