declare module '@octokit/rest' {
  export class Octokit {
    constructor(options?: {
      auth?: string;
      baseUrl?: string;
      log?: {
        debug: (message: string) => void;
        info: (message: string) => void;
        warn: (message: string) => void;
        error: (message: string) => void;
      };
      request?: {
        timeout: number;
      };
      timeZone?: string;
      [key: string]: any;
    });

    repos: {
      listForAuthenticatedUser(options?: {
        visibility?: 'all' | 'public' | 'private';
        affiliation?: string;
        type?: 'all' | 'owner' | 'public' | 'private' | 'member';
        sort?: 'created' | 'updated' | 'pushed' | 'full_name';
        direction?: 'asc' | 'desc';
        per_page?: number;
        page?: number;
      }): Promise<OctokitResponse<Repository[]>>;
      listCommits(options: {
        owner: string;
        repo: string;
        sha?: string;
        path?: string;
        since?: string;
        until?: string;
        author?: string;
        committer?: string;
        per_page?: number;
        page?: number;
      }): Promise<OctokitResponse<Commit[]>>;
      [key: string]: any;
    };
    [key: string]: any;
  }

  export = Octokit;
} 