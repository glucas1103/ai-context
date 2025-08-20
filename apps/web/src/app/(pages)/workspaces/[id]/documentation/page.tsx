'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DocumentTextIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface WorkspaceData {
  id: string
  name: string
  url: string
  created_at: string
}

export default function WorkspaceDocumentationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Résoudre les params de manière async
  useEffect(() => {
    params.then(({ id }) => {
      setWorkspaceId(id)
    })
  }, [params])

  // Vérifier l'authentification et charger les données
  useEffect(() => {
    if (!workspaceId) return

    async function loadWorkspaceData() {
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
        
      } catch (err) {
        console.error('Erreur lors du chargement:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkspaceData()
  }, [isAuthenticated, loading, router, workspaceId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Chargement de la documentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Documentation
            </h1>
            <p className="text-gray-400 text-lg">
              Documentation technique générée automatiquement pour {workspace?.name}
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <div className="mb-6">
              <DocumentTextIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">
                Documentation Automatique
              </h2>
              <p className="text-gray-400 mb-6">
                Cette fonctionnalité sera disponible dans la prochaine story.
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-700 rounded-lg p-6">
                <SparklesIcon className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Génération IA
                </h3>
                <p className="text-gray-300 text-sm">
                  Documentation technique générée automatiquement à partir de votre codebase
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <ClockIcon className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Mise à jour automatique
                </h3>
                <p className="text-gray-300 text-sm">
                  Documentation toujours synchronisée avec les changements de code
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <DocumentTextIcon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Export flexible
                </h3>
                <p className="text-gray-300 text-sm">
                  Export en Markdown, PDF ou intégration avec vos outils existants
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <div className="animate-pulse">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                </div>
                <span className="text-sm">En cours de développement...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
