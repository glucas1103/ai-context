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
 * Rafraîchit proactivement les tokens si nécessaire selon la documentation officielle
 * @param supabase - Client Supabase
 * @returns Le provider token (nouveau ou existant)
 */
export async function refreshTokenIfNeeded(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session && isTokenExpired(session)) {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      throw new Error('Failed to refresh token')
    }
    
    return data.session?.provider_token
  }
  
  return session?.provider_token
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
    try {
      // Tenter de rafraîchir la session selon la documentation officielle
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        // Token révoqué de manière permanente
        throw new Error('GitHub token has been revoked. Please reconnect your GitHub account.')
      }
      
      // Retourner le nouveau token
      return data.session?.provider_token || null
    } catch (refreshError) {
      // Échec du refresh
      throw new Error('Unable to refresh GitHub token. Please reconnect your GitHub account.')
    }
  }
  
  // Autre type d'erreur
  throw error
}

/**
 * Récupère un provider token valide avec gestion automatique du refresh
 * @param supabase - Client Supabase
 * @returns Le provider token ou null si non disponible
 */
export async function getValidProviderToken(supabase: SupabaseClient): Promise<string | null> {
  try {
    // Récupérer la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return null
    }

    // Vérifier si le provider token est disponible
    let providerToken = session.provider_token
    
    if (!providerToken) {
      // Tenter de rafraîchir la session selon la documentation officielle
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshData.session?.provider_token) {
        return null
      }
      
      providerToken = refreshData.session.provider_token
    }

    return providerToken
  } catch (error) {
    console.error('Erreur lors de la récupération du provider token:', error)
    return null
  }
}

/**
 * Effectue un appel GitHub API avec gestion automatique du refresh des tokens
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
    throw new Error('GitHub token not available')
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

  // Si l'API GitHub retourne une erreur d'autorisation, tenter de rafraîchir
  if (response.status === 401) {
    try {
      // Tenter de rafraîchir la session selon la documentation officielle
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshData.session?.provider_token) {
        throw new Error('GitHub token expired')
      }
      
      // Réessayer avec le nouveau token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${refreshData.session.provider_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AIcontext-App',
          ...options.headers,
        },
      })
      
      return retryResponse
    } catch (refreshError) {
      throw new Error('GitHub token expired')
    }
  }

  return response
}
