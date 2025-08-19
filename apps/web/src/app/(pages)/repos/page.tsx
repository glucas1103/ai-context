'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Repo {
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

interface ReposResponse {
  repos: Repo[]
  total: number
}

export default function ReposPage() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { user, isAuthenticated, signOut } = useAuth()
  const router = useRouter()

  // Filtrer les dépôts selon le terme de recherche
  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Vérifier l'authentification et charger les dépôts
  useEffect(() => {
    async function loadRepos() {
      // Rediriger si pas authentifié
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }

      try {

        // Charger les dépôts
        const response = await fetch('/api/github/repos')
        
        if (!response.ok) {
          if (response.status === 401) {
            router.replace('/login')
            return
          }
          
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'Erreur lors du chargement des dépôts')
        }

        const data: ReposResponse = await response.json()
        setRepos(data.repos)
        
      } catch (err) {
        console.error('Erreur lors du chargement:', err)
        setError(err instanceof Error ? err.message : 'Erreur inattendue')
      } finally {
        setIsLoading(false)
      }
    }

    loadRepos()
  }, [isAuthenticated, router])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleSelectRepo = (repo: Repo) => {
    // TODO: Implémenter la sélection du dépôt pour analyse
    console.log('Dépôt sélectionné pour analyse:', repo.fullName)
    alert(`Sélection du dépôt "${repo.name}" pour analyse (à implémenter)`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} KB`
    return `${(size / 1024).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Chargement de vos dépôts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-900/50 border border-red-700 rounded p-6">
            <h2 className="text-xl font-semibold text-red-200 mb-2">
              Erreur de chargement
            </h2>
            <p className="text-red-200 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">AIcontext</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <img
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.full_name || user.email}
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="text-gray-300 text-sm">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Vos Dépôts GitHub
          </h2>
          <p className="text-gray-400">
            Sélectionnez un dépôt pour créer votre base de connaissances
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher dans vos dépôts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-400">
            {filteredRepos.length} dépôt{filteredRepos.length !== 1 ? 's' : ''} trouvé{filteredRepos.length !== 1 ? 's' : ''}
            {searchTerm && ` pour "${searchTerm}"`}
          </p>
        </div>

        {/* Repos Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {repo.name}
                  </h3>
                  {repo.isPrivate && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-900 text-yellow-200">
                      Privé
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {repo.description || 'Aucune description disponible'}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  {repo.language && (
                    <span className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {repo.stars}
                  </span>
                  <span>{formatSize(repo.size)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Modifié le {formatDate(repo.updatedAt)}
                </p>
                <button
                  onClick={() => handleSelectRepo(repo)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Analyser
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredRepos.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucun dépôt trouvé pour "{searchTerm}"</p>
          </div>
        )}

        {repos.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucun dépôt trouvé dans votre compte GitHub</p>
          </div>
        )}
      </main>
    </div>
  )
}
