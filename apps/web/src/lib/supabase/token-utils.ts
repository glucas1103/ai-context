import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Vérifie si un token est expiré selon la documentation officielle Supabase
 * @param session - Session Supabase
 * @returns true si le token expire dans les 5 prochaines minutes
 */
export function isTokenExpired(session: any): boolean {
  if (!session?.expires_at) {
    return true
  }
  
  // Vérifier si le token expire dans les 5 prochaines minutes
  const expiresAt = new Date(session.expires_at).getTime()
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000
  
  return (expiresAt - now) < fiveMinutes
}

/**
 * Récupère un provider token valide selon la documentation officielle Supabase
 * IMPORTANT: Supabase Auth ne gère PAS automatiquement le refresh des provider tokens
 * @param supabase - Client Supabase
 * @returns Le provider token ou null si non disponible
 */
export async function getValidProviderToken(supabase: SupabaseClient): Promise<string | null> {
  try {
    // Récupérer la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Erreur session Supabase:', sessionError)
      return null
    }
    
    if (!session) {
      console.log('Aucune session Supabase active')
      return null
    }

    console.log('Session trouvée pour:', session.user?.email)
    console.log('Provider token disponible:', !!session.provider_token)
    console.log('Access token disponible:', !!session.access_token)

    // Retourner directement le provider token s'il existe
    // Selon la documentation Supabase, on ne doit PAS tenter de refresh automatique
    const providerToken = session.provider_token
    
    if (!providerToken) {
      console.log('Aucun provider token disponible - reconnexion GitHub nécessaire')
      return null
    }

    return providerToken
  } catch (error) {
    console.error('Erreur lors de la récupération du provider token:', error)
    return null
  }
}

/**
 * Effectue un appel GitHub API avec gestion des erreurs selon la documentation officielle
 * @param supabase - Client Supabase
 * @param url - URL de l'API GitHub
 * @param options - Options de la requête fetch
 * @returns Réponse de l'API GitHub
 */
export async function callGitHubAPI(
  supabase: SupabaseClient,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Récupérer un token valide
  const providerToken = await getValidProviderToken(supabase)
  
  if (!providerToken) {
    // Retourner une erreur spécifique pour indiquer que la reconnexion est nécessaire
    throw new Error('GitHub token not available - reconnection required')
  }

  // Effectuer l'appel API avec le token
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${providerToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AIcontext-App',
      ...options.headers,
    },
  })

  // Gérer les erreurs GitHub selon la documentation officielle
  if (response.status === 401) {
    // Token expiré ou révoqué - nécessite une reconnexion
    throw new Error('GitHub token expired - reconnection required')
  }

  if (response.status === 403) {
    // Rate limit ou permissions insuffisantes
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
    if (rateLimitRemaining === '0') {
      throw new Error('GitHub rate limit exceeded')
    }
    throw new Error('GitHub API access denied - insufficient permissions')
  }

  return response
}

/**
 * Gère les erreurs de tokens selon la documentation officielle Supabase
 * @param supabase - Client Supabase
 * @param error - Erreur reçue
 * @returns Le nouveau provider token ou null si échec
 */
export async function handleTokenError(supabase: SupabaseClient, error: any): Promise<string | null> {
  // Si l'erreur indique un token expiré ou révoqué
  if (error.message?.includes('token') || error.status === 401) {
    // Selon la documentation Supabase, on ne peut pas rafraîchir automatiquement les provider tokens
    // Il faut demander à l'utilisateur de se reconnecter
    throw new Error('GitHub token has been revoked or expired. Please reconnect your GitHub account.')
  }
  
  // Autre type d'erreur
  throw error
}
