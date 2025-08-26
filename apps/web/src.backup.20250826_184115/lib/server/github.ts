/**
 * Server-only GitHub API utilities
 * Provides functions for interacting with GitHub API using user tokens
 */

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  clone_url: string
  ssh_url: string
  git_url: string
  language: string | null
  stargazers_count: number
  size: number
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

export interface GitHubTreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
  url: string
}

export interface GitHubTreeResponse {
  sha: string
  url: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

export class GitHubAPI {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  /**
   * Récupère la liste des dépôts de l'utilisateur
   */
  async getUserRepos(): Promise<GitHubRepo[]> {
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AIcontext-App'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Récupère l'arborescence complète d'un dépôt
   */
  async getRepositoryTree(owner: string, repo: string, recursive = true): Promise<GitHubTreeResponse> {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD${recursive ? '?recursive=1' : ''}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AIcontext-App'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Récupère le contenu d'un fichier
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AIcontext-App'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Le contenu est encodé en base64
    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }
    
    return data.content
  }

  /**
   * Récupère les métadonnées d'un dépôt
   */
  async getRepositoryInfo(owner: string, repo: string): Promise<GitHubRepo> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AIcontext-App'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Vérifie si l'utilisateur a accès à un dépôt
   */
  async hasRepositoryAccess(owner: string, repo: string): Promise<boolean> {
    try {
      await this.getRepositoryInfo(owner, repo)
      return true
    } catch (error) {
      return false
    }
  }
}

/**
 * Parse une URL GitHub pour extraire owner/repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/,
    /github\.com\/([^/]+)\/([^/]+?)\.git/,
    /git@github\.com:([^/]+)\/([^/]+?)\.git/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      }
    }
  }

  return null
}

/**
 * Détecte le langage de programmation d'après l'extension de fichier
 */
export function detectFileLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'css': 'css',
    'scss': 'scss',
    'sass': 'scss',
    'less': 'less',
    'html': 'html',
    'htm': 'html',
    'md': 'markdown',
    'markdown': 'markdown',
    'json': 'json',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'c': 'c',
    'cpp': 'cpp',
    'cxx': 'cpp',
    'cc': 'cpp',
    'cs': 'csharp',
    'kt': 'kotlin',
    'swift': 'swift',
    'dart': 'dart',
    'vue': 'vue',
    'svelte': 'svelte',
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'toml': 'toml',
    'ini': 'ini',
    'conf': 'ini',
    'env': 'shell'
  }
  
  return languageMap[ext || ''] || 'plaintext'
}

/**
 * Valide si un fichier doit être inclus dans l'analyse
 * Exclut les fichiers binaires, temporaires et de cache courants
 */
export function shouldIncludeFile(path: string): boolean {
  const excludePatterns = [
    /node_modules\//,
    /\.git\//,
    /\.next\//,
    /\.nuxt\//,
    /dist\//,
    /build\//,
    /coverage\//,
    /\.nyc_output\//,
    /\.cache\//,
    /\.tmp\//,
    /\.log$/,
    /\.lock$/,
    /\.(jpg|jpeg|png|gif|svg|ico|webp|mp4|mp3|pdf|zip|tar|gz)$/i
  ]

  return !excludePatterns.some(pattern => pattern.test(path))
}
