'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { 
  BellIcon, 
  ChevronDownIcon, 
  Cog6ToothIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

interface WorkspaceData {
  id: string
  name: string
  url: string
  created_at: string
}

interface Repository {
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

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const repoDropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  const { isAuthenticated, loading, user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Résoudre les params de manière async
  useEffect(() => {
    params.then(({ id }) => {
      setWorkspaceId(id)
    })
  }, [params])

  // Vérifier l'authentification et charger les données
  useEffect(() => {
    if (!workspaceId) return

    async function loadData() {
      if (loading) return
      
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }

      try {
        // Charger les informations du workspace
        const workspaceResponse = await fetch(`/api/workspaces`)
        if (workspaceResponse.ok) {
          const workspacesData = await workspaceResponse.json()
          const currentWorkspace = workspacesData.data.find((w: WorkspaceData) => w.id === workspaceId)
          if (currentWorkspace) {
            setWorkspace(currentWorkspace)
          }
        }

        // Charger la liste des repositories
        const reposResponse = await fetch('/api/github/repos')
        if (reposResponse.ok) {
          const reposData = await reposResponse.json()
          setRepositories(reposData.repos || [])
        } else {
          console.error('Failed to load repositories:', reposResponse.status)
        }
        
      } catch (err) {
        console.error('Erreur lors du chargement:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, loading, router, workspaceId])

  // Gérer les clics en dehors des dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (repoDropdownRef.current && !repoDropdownRef.current.contains(event.target as Node)) {
        setIsRepoDropdownOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const isActiveTab = (path: string) => {
    return pathname.includes(path)
  }



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Repository selector */}
            <div className="flex items-center space-x-4">
              <div className="relative" ref={repoDropdownRef}>
                <button
                  onClick={() => setIsRepoDropdownOpen(!isRepoDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FolderIcon className="h-5 w-5" />
                  <span className="truncate max-w-48">
                    {workspace?.name || 'Sélectionner un repo'}
                  </span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${isRepoDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Repository dropdown */}
                {isRepoDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-gray-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="py-1">
                      {repositories.length > 0 ? (
                        repositories.map((repo) => (
                          <button
                            key={repo.id}
                            onClick={() => {
                              // Naviguer vers le workspace correspondant
                              // Pour l'instant, on utilise l'ID du repo comme workspace ID
                              router.push(`/workspaces/${repo.id.toString()}/context`)
                              setIsRepoDropdownOpen(false)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center space-x-2"
                          >
                            <FolderIcon className="h-4 w-4" />
                            <span className="truncate">{repo.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          Aucun repository disponible
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {workspace?.url && (
                <a
                  href={workspace.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Voir sur GitHub ↗
                </a>
              )}
            </div>

            {/* Center - Navigation tabs */}
            <nav className="flex items-center space-x-1">
              <Link
                href={`/workspaces/${workspaceId}/context`}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActiveTab('/context')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Context</span>
                </div>
              </Link>

              <Link
                href={`/workspaces/${workspaceId}/documentation`}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActiveTab('/documentation')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Documentation</span>
                </div>
              </Link>

              <Link
                href={`/workspaces/${workspaceId}/issues`}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActiveTab('/issues')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>Issues</span>
                </div>
              </Link>
            </nav>

            {/* Right side - Notifications and user menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors">
                <BellIcon className="h-5 w-5" />
              </button>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                >
                  <UserCircleIcon className="h-5 w-5" />
                  <span className="text-sm">{user?.user_metadata?.full_name || user?.email || 'Utilisateur'}</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {/* User dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-gray-700 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        href="/repos"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FolderIcon className="h-4 w-4" />
                        <span>Gérer les repos</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          // TODO: Implémenter la gestion d'équipe
                        }}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                      >
                        <UserCircleIcon className="h-4 w-4" />
                        <span>Gérer l'équipe</span>
                      </button>
                      
                      <div className="border-t border-gray-600 my-1"></div>
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                      >
                        <Cog6ToothIcon className="h-4 w-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
