export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description?: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  default_branch: string;
  owner: GitHubUser;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name?: string;
  email?: string;
  type: 'User' | 'Organization';
}

export interface GitHubApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  success: boolean;
}

export interface GitHubAuthResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubRepoListResponse {
  repos: GitHubRepo[];
  total_count: number;
  has_more: boolean;
}
