import { createClient } from '@/lib/supabase/server'
import { GitHubAPI } from '@/lib/supabase/github-api'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification de l'utilisateur
    // IMPORTANT: Utiliser getUser() côté serveur selon la documentation officielle
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Non authentifié', code: 'auth_required' } },
        { status: 401 }
      )
    }

    // Créer une instance de GitHubAPI avec gestion automatique des tokens
    const githubAPI = new GitHubAPI(supabase)

    try {
      // Récupérer les dépôts avec gestion automatique du refresh des tokens
      const repos = await githubAPI.getUserRepos({
        sort: 'updated',
        direction: 'desc',
        per_page: 100
      })

      return NextResponse.json({
        repos,
        total: repos.length
      })

    } catch (githubError) {
      // Gestion spécifique des erreurs GitHub
      if (githubError instanceof Error) {
        if (githubError.message.includes('token expired')) {
          return NextResponse.json(
            { error: { message: 'Token GitHub expiré. Veuillez vous reconnecter.', code: 'github_token_expired' } },
            { status: 401 }
          )
        }
        
        if (githubError.message.includes('rate limit')) {
          return NextResponse.json(
            { error: { message: 'Rate limit GitHub atteint. Veuillez réessayer plus tard.', code: 'github_rate_limit' } },
            { status: 429 }
          )
        }

        if (githubError.message.includes('not available')) {
          return NextResponse.json(
            { error: { message: 'Token GitHub non disponible. Veuillez vous reconnecter.', code: 'github_token_missing' } },
            { status: 401 }
          )
        }

        console.error('Erreur GitHub API:', githubError.message)
        return NextResponse.json(
          { error: { message: 'Erreur lors de la récupération des dépôts', code: 'github_api_error' } },
          { status: 500 }
        )
      }

      throw githubError
    }

  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des dépôts:', error)
    return NextResponse.json(
      { error: { message: 'Erreur interne du serveur', code: 'internal_error' } },
      { status: 500 }
    )
  }
}
