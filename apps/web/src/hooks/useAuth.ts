'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  providerToken?: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    providerToken: null
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Fonction pour récupérer l'utilisateur initial
    async function getInitialUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          // "Auth session missing!" est normal quand l'utilisateur n'est pas connecté
          if (error.message === 'Auth session missing!') {
            setAuthState({ user: null, loading: false, error: null, providerToken: null })
          } else if (error.message.includes('JWT expired') || error.message.includes('Invalid JWT')) {
            // Token expiré ou invalide - nettoyer la session
            console.warn('Token expiré ou invalide, nettoyage de la session')
            await supabase.auth.signOut({ scope: 'local' })
            setAuthState({ user: null, loading: false, error: null, providerToken: null })
          } else if (error.message.includes('User from sub claim in JWT does not exist')) {
            // Utilisateur supprimé de la DB mais JWT encore valide - nettoyer la session
            console.warn('Utilisateur supprimé de la base de données, nettoyage de la session')
            await supabase.auth.signOut({ scope: 'local' })
            setAuthState({ user: null, loading: false, error: null, providerToken: null })
          } else {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error.message)
            setAuthState({ user: null, loading: false, error: error.message, providerToken: null })
          }
        } else {
          // Récupérer le provider token si disponible
          const { data: { session } } = await supabase.auth.getSession()
          setAuthState({ 
            user, 
            loading: false, 
            error: null, 
            providerToken: session?.provider_token || null 
          })
        }
      } catch (err) {
        console.error('Erreur inattendue:', err)
        setAuthState({ 
          user: null, 
          loading: false, 
          error: 'Erreur lors de la vérification de l\'authentification',
          providerToken: null
        })
      }
    }

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        // Ne pas rediriger automatiquement - laisser les pages gérer leurs propres redirections
        setAuthState({ 
          user: session?.user ?? null, 
          loading: false, 
          error: null,
          providerToken: session?.provider_token || null
        })
      }
    )

    getInitialUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Fonction de connexion GitHub
  const signInWithGitHub = async (forceReauth = false) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      // Si c'est une reconnexion forcée, on doit passer des paramètres pour forcer GitHub à redemander l'autorisation
      const authOptions: any = {
        scopes: 'repo read:user read:org',
        redirectTo: `${window.location.origin}/auth/callback`,
      }

      // Forcer la reconnexion en ajoutant un paramètre qui force GitHub à redemander l'autorisation
      if (forceReauth) {
        console.log('Forçage de la reconnexion GitHub avec prompt=consent')
        authOptions.queryParams = {
          prompt: 'consent' // Force GitHub à redemander l'autorisation
        }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: authOptions,
      })

      if (error) {
        console.error('Erreur OAuth GitHub:', error.message)
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Erreur lors de la connexion avec GitHub'
        }))
      }
    } catch (err) {
      console.error('Erreur inattendue:', err)
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Une erreur inattendue s\'est produite'
      }))
    }
  }

  // Fonction de déconnexion
  const signOut = async (scope: 'local' | 'global' = 'local') => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const { error } = await supabase.auth.signOut({ scope })
      
      if (error) {
        console.error('Erreur lors de la déconnexion:', error.message)
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Erreur lors de la déconnexion'
        }))
      } else {
        setAuthState({ user: null, loading: false, error: null, providerToken: null })
        router.push('/login')
      }
    } catch (err) {
      console.error('Erreur inattendue:', err)
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Erreur lors de la déconnexion'
      }))
    }
  }

  // Fonction de déconnexion globale (pour les paramètres de sécurité)
  const signOutAllDevices = async () => {
    return signOut('global')
  }

  // Fonction pour rafraîchir la session avec gestion des provider tokens
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Erreur lors du rafraîchissement de session:', error.message)
        // Si le rafraîchissement échoue, déconnecter l'utilisateur
        await signOut('local')
      } else if (data.session) {
        setAuthState({ 
          user: data.session.user, 
          loading: false, 
          error: null,
          providerToken: data.session.provider_token || null
        })
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement de session:', err)
      await signOut('local')
    }
  }

  // Fonction pour nettoyer les sessions corrompues
  const clearCorruptedSession = async () => {
    try {
      console.log('Nettoyage de la session corrompue...')
      await supabase.auth.signOut({ scope: 'local' })
      setAuthState({ user: null, loading: false, error: null, providerToken: null })
      console.log('Session nettoyée avec succès')
    } catch (err) {
      console.error('Erreur lors du nettoyage de session:', err)
      setAuthState({ user: null, loading: false, error: null, providerToken: null })
    }
  }

  // Fonction pour vérifier si le provider token est disponible
  const hasValidProviderToken = () => {
    return !!authState.providerToken
  }

  // Fonction pour obtenir le provider token actuel
  const getProviderToken = () => {
    return authState.providerToken
  }

  return {
    ...authState,
    signInWithGitHub,
    signOut,
    signOutAllDevices,
    refreshSession,
    clearCorruptedSession,
    hasValidProviderToken,
    getProviderToken,
    isAuthenticated: !!authState.user
  }
}
