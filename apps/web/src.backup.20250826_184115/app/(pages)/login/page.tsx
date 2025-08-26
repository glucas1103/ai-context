'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const { loading, error, signInWithGitHub, isAuthenticated, clearCorruptedSession } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [urlError, setUrlError] = useState<string | null>(null)
  const [hasRedirected, setHasRedirected] = useState(false)

  // Vérifier si c'est l'erreur de session corrompue
  const isCorruptedSessionError = error?.includes('User from sub claim in JWT does not exist')

  // Vérifier les paramètres d'erreur dans l'URL
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorMessage = searchParams.get('message')
    
    if (errorParam) {
      switch (errorParam) {
        case 'auth_error':
          setUrlError(errorMessage || 'Erreur lors de l\'authentification. Veuillez réessayer.')
          break
        case 'oauth_error':
          setUrlError(errorMessage || 'Erreur lors de la connexion avec GitHub. Veuillez réessayer.')
          break
        case 'no_code':
          setUrlError('Code d\'autorisation manquant. Veuillez réessayer la connexion.')
          break
        case 'no_session':
          setUrlError('Session non créée. Veuillez réessayer la connexion.')
          break
        case 'unexpected_error':
          setUrlError('Une erreur inattendue s\'est produite. Veuillez réessayer.')
          break
        default:
          setUrlError(errorMessage || 'Une erreur s\'est produite lors de la connexion.')
      }
    }
  }, [searchParams])

  // Rediriger si déjà authentifié (une seule fois)
  useEffect(() => {
    if (!loading && isAuthenticated && !hasRedirected) {
      setHasRedirected(true)
      router.replace('/repos')
    }
  }, [isAuthenticated, loading, router, hasRedirected])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            AIcontext
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Transformez votre codebase en documentation vivante
          </p>
        </div>

        <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Connectez-vous pour commencer
            </h2>
            <p className="text-gray-300 text-sm">
              Connectez-vous avec GitHub pour analyser vos projets
            </p>
          </div>

          {((error && error !== 'Auth session missing!') || urlError) && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              {urlError || error}
              {isCorruptedSessionError && (
                <div className="mt-2">
                  <button
                    onClick={clearCorruptedSession}
                    className="text-xs bg-red-700 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                  >
                    Nettoyer la session
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={signInWithGitHub}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion en cours...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"></path>
                </svg>
                Se connecter avec GitHub
              </div>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              🔒 Vos données restent privées et sécurisées
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            En vous connectant, vous acceptez d'analyser vos dépôts GitHub<br />
            pour créer une base de connaissances personnalisée.
          </p>
        </div>
      </div>
    </div>
  )
}
