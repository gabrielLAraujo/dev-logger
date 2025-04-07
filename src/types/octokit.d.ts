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
      listCommits(params: {
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
      }): Promise<{
        data: Array<{
          sha: string;
          node_id: string;
          commit: {
            message: string;
            author: {
              name: string;
              email: string;
              date: string;
            };
            committer: {
              name: string;
              email: string;
              date: string;
            };
          };
          url: string;
          html_url: string;
          comments_url: string;
          [key: string]: any;
        }>;
        status: number;
        headers: {
          [key: string]: string;
        };
      }>;
      [key: string]: any;
    };
    [key: string]: any;
  }
} 