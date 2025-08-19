'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
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
            setAuthState({ user: null, loading: false, error: null })
          } else {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error.message)
            setAuthState({ user: null, loading: false, error: error.message })
          }
        } else {
          setAuthState({ user, loading: false, error: null })
        }
      } catch (err) {
        console.error('Erreur inattendue:', err)
        setAuthState({ 
          user: null, 
          loading: false, 
          error: 'Erreur lors de la vérification de l\'authentification' 
        })
      }
    }

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setAuthState({ 
          user: session?.user ?? null, 
          loading: false, 
          error: null 
        })

        // Note: Les redirections sont gérées par les pages individuelles
        // pour éviter les boucles de redirection
      }
    )

    getInitialUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  // Fonction de connexion GitHub
  const signInWithGitHub = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo read:user read:org',
          redirectTo: `${window.location.origin}/auth/callback`,
        },
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
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erreur lors de la déconnexion:', error.message)
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Erreur lors de la déconnexion'
        }))
      } else {
        setAuthState({ user: null, loading: false, error: null })
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

  return {
    ...authState,
    signInWithGitHub,
    signOut,
    isAuthenticated: !!authState.user
  }
}
