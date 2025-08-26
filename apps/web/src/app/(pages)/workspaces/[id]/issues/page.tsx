import { API_ENDPOINTS } from "@/constants/api";
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HiExclamationCircle, HiPlus, HiSparkles, HiDocumentText } from 'react-icons/hi'

interface WorkspaceData {
  id: string
  name: string
  url: string
  created_at: string
}

export default function WorkspaceIssuesPage({
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
          <p className="text-gray-300">Chargement des issues...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  Issues & Tâches
                </h1>
                <p className="text-gray-400 text-lg">
                  Générez et gérez les tâches techniques pour {workspace?.name}
                </p>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <HiPlus className="h-5 w-5" />
                <span>Nouvelle tâche</span>
              </button>
            </div>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <div className="text-center mb-8">
              <HiExclamationCircle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">
                Génération de Tâches IA
              </h2>
              <p className="text-gray-400 mb-6">
                Cette fonctionnalité sera disponible dans la prochaine story.
              </p>
            </div>

            {/* Features Preview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-700 rounded-lg p-6">
                <HiSparkles className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Génération IA
                </h3>
                <p className="text-gray-300 text-sm">
                  Transformez un brief fonctionnel en tâches techniques détaillées
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <HiDocumentText className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Contexte enrichi
                </h3>
                <p className="text-gray-300 text-sm">
                  Chaque tâche inclut le contexte technique nécessaire pour le développement
                </p>
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <HiExclamationCircle className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Export flexible
                </h3>
                <p className="text-gray-300 text-sm">
                  Exportez vers GitHub Issues, Jira, ou autres outils de gestion de projet
                </p>
              </div>
            </div>

            {/* Workflow Preview */}
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                Workflow de Génération
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto mb-2">
                    1
                  </div>
                  <p className="text-gray-300 text-sm">Brief fonctionnel</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto mb-2">
                    2
                  </div>
                  <p className="text-gray-300 text-sm">Analyse IA</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto mb-2">
                    3
                  </div>
                  <p className="text-gray-300 text-sm">Tâches générées</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mx-auto mb-2">
                    4
                  </div>
                  <p className="text-gray-300 text-sm">Export & Partage</p>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-8 bg-gray-700 rounded-lg p-4">
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
