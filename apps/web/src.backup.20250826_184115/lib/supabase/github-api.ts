import { SupabaseClient } from '@supabase/supabase-js'
import { callGitHubAPI } from './token-utils'

/**
 * Interface pour un dépôt GitHub
 */
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

/**
 * Interface pour un dépôt formaté
 */
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

/**
 * Wrapper pour les appels GitHub API avec gestion automatique des tokens
 */
export class GitHubAPI {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Récupère la liste des dépôts de l'utilisateur
   * @param options - Options de récupération (tri, pagination, etc.)
   * @returns Liste des dépôts formatés
   */
  async getUserRepos(options: {
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    direction?: 'asc' | 'desc'
    per_page?: number
    page?: number
  } = {}): Promise<FormattedRepo[]> {
    const {
      sort = 'updated',
      direction = 'desc',
      per_page = 100,
      page = 1
    } = options

    const url = `https://api.github.com/user/repos?sort=${sort}&direction=${direction}&per_page=${per_page}&page=${page}`

    try {
      const response = await callGitHubAPI(this.supabase, url)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitHub token expired or invalid')
        }
        
        if (response.status === 403) {
          throw new Error('GitHub rate limit exceeded')
        }

        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const repos: GitHubRepo[] = await response.json()

      // Formater les données pour le front-end
      return repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        isPrivate: repo.private,
        owner: {
          login: repo.owner.login,
          avatarUrl: repo.owner.avatar_url
        },
        updatedAt: repo.updated_at,
        language: repo.language,
        stars: repo.stargazers_count,
        size: repo.size
      }))
    } catch (error) {
      console.error('Erreur lors de la récupération des dépôts GitHub:', error)
      throw error
    }
  }

  /**
   * Récupère les informations d'un dépôt spécifique
   * @param owner - Propriétaire du dépôt
   * @param repo - Nom du dépôt
   * @returns Informations du dépôt
   */
  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    const url = `https://api.github.com/repos/${owner}/${repo}`

    try {
      const response = await callGitHubAPI(this.supabase, url)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository not found')
        }
        
        if (response.status === 401) {
          throw new Error('GitHub token expired or invalid')
        }

        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Erreur lors de la récupération du dépôt ${owner}/${repo}:`, error)
      throw error
    }
  }

  /**
   * Récupère l'arborescence d'un dépôt
   * @param owner - Propriétaire du dépôt
   * @param repo - Nom du dépôt
   * @param path - Chemin dans le dépôt (optionnel, racine par défaut)
   * @param ref - Référence Git (optionnel, branche principale par défaut)
   * @returns Arborescence du dépôt
   */
  async getRepoTree(owner: string, repo: string, path: string = '', ref: string = 'main') {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`

    try {
      const response = await callGitHubAPI(this.supabase, url)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Path not found in repository')
        }
        
        if (response.status === 401) {
          throw new Error('GitHub token expired or invalid')
        }

        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'arborescence ${owner}/${repo}/${path}:`, error)
      throw error
    }
  }

  /**
   * Récupère le contenu d'un fichier
   * @param owner - Propriétaire du dépôt
   * @param repo - Nom du dépôt
   * @param path - Chemin du fichier
   * @param ref - Référence Git (optionnel, branche principale par défaut)
   * @returns Contenu du fichier
   */
  async getFileContent(owner: string, repo: string, path: string, ref: string = 'main') {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`

    try {
      const response = await callGitHubAPI(this.supabase, url)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found')
        }
        
        if (response.status === 401) {
          throw new Error('GitHub token expired or invalid')
        }

        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Décoder le contenu base64
      if (data.content && data.encoding === 'base64') {
        return {
          ...data,
          content: Buffer.from(data.content, 'base64').toString('utf-8')
        }
      }

      return data
    } catch (error) {
      console.error(`Erreur lors de la récupération du fichier ${owner}/${repo}/${path}:`, error)
      throw error
    }
  }

  /**
   * Vérifie si l'utilisateur a accès à un dépôt
   * @param owner - Propriétaire du dépôt
   * @param repo - Nom du dépôt
   * @returns true si l'utilisateur a accès
   */
  async hasRepoAccess(owner: string, repo: string): Promise<boolean> {
    try {
      await this.getRepo(owner, repo)
      return true
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return false
      }
      throw error
    }
  }
}
