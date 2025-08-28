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
      console.log('Utilisateur non authentifié:', authError?.message)
      return NextResponse.json(
        { 
          success: false,
          error: 'Non authentifié',
          status: 401
        },
        { status: 401 }
      )
    }

    console.log('Utilisateur authentifié:', user.email)

    // Créer une instance de GitHubAPI avec gestion automatique des tokens
    const githubAPI = new GitHubAPI(supabase)

    try {
      // Récupérer les dépôts avec gestion automatique du refresh des tokens
      const repos = await githubAPI.getUserRepos({
        sort: 'updated',
        direction: 'desc',
        per_page: 100
      })

      console.log('Dépôts récupérés avec succès:', repos.length)

      return NextResponse.json({
        success: true,
        data: {
          repos,
          total: repos.length
        },
        status: 200
      })

    } catch (githubError) {
      console.error('Erreur GitHub API:', githubError)
      
      // Gestion spécifique des erreurs GitHub
      if (githubError instanceof Error) {
        if (githubError.message.includes('token expired') || 
            githubError.message.includes('GitHub token expired') ||
            githubError.message.includes('reconnection required')) {
          console.log('Token GitHub expiré ou non disponible, redirection vers reconnexion')
          return NextResponse.json(
            { 
              success: false,
              error: 'Token GitHub expiré ou non disponible. Veuillez vous reconnecter.',
              status: 401,
              requiresReauth: true
            },
            { status: 401 }
          )
        }
        
        if (githubError.message.includes('not available') || 
            githubError.message.includes('GitHub token not available')) {
          console.log('Token GitHub non disponible, redirection vers reconnexion')
          return NextResponse.json(
            { 
              success: false,
              error: 'Token GitHub non disponible. Veuillez vous reconnecter.',
              status: 401,
              requiresReauth: true
            },
            { status: 401 }
          )
        }
        
        if (githubError.message.includes('rate limit')) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Rate limit GitHub atteint. Veuillez réessayer plus tard.',
              status: 429
            },
            { status: 429 }
          )
        }

        console.error('Erreur GitHub API:', githubError.message)
        return NextResponse.json(
          { 
            success: false,
            error: 'Erreur lors de la récupération des dépôts',
            status: 500
          },
          { status: 500 }
        )
      }

      throw githubError
    }

  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des dépôts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        status: 500
      },
      { status: 500 }
    )
  }
}
