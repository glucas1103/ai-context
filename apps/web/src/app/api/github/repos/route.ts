import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface GitHubRepo {
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

interface FormattedRepo {
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

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Non authentifié', code: 'auth_required' } },
        { status: 401 }
      )
    }

    // Récupérer le token GitHub depuis les métadonnées utilisateur
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.provider_token) {
      return NextResponse.json(
        { error: { message: 'Token GitHub non disponible', code: 'github_token_missing' } },
        { status: 401 }
      )
    }

    // Appeler l'API GitHub pour récupérer les dépôts
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${session.provider_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AIcontext-App'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: { message: 'Token GitHub expiré ou invalide', code: 'github_token_invalid' } },
          { status: 401 }
        )
      }
      
      if (response.status === 403) {
        return NextResponse.json(
          { error: { message: 'Rate limit GitHub atteint', code: 'github_rate_limit' } },
          { status: 429 }
        )
      }

      console.error('Erreur API GitHub:', response.status, response.statusText)
      return NextResponse.json(
        { error: { message: 'Erreur lors de la récupération des dépôts', code: 'github_api_error' } },
        { status: 500 }
      )
    }

    const repos: GitHubRepo[] = await response.json()

    // Formater les données pour le front-end
    const formattedRepos: FormattedRepo[] = repos.map(repo => ({
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

    return NextResponse.json({
      repos: formattedRepos,
      total: formattedRepos.length
    })

  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des dépôts:', error)
    return NextResponse.json(
      { error: { message: 'Erreur interne du serveur', code: 'internal_error' } },
      { status: 500 }
    )
  }
}
