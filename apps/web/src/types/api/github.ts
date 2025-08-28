import { ApiResponse } from '@/utils/api'

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  private: boolean
  owner: {
    login: string
    avatar_url: string
  }
  updated_at: string
  language: string | null
  stargazers_count: number
  size: number
}

export interface FormattedRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  isPrivate: boolean
  owner: {
    login: string
    avatarUrl: string
  }
  updatedAt: string
  language: string | null
  stars: number
  size: number
}

export interface ReposResponse {
  repos: FormattedRepo[]
  total: number
}

// Type étendu pour les réponses d'API qui peuvent nécessiter une reconnexion
export interface ApiResponseWithReauth<T> extends ApiResponse<T> {
  requiresReauth?: boolean
}
