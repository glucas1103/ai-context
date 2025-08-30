'use client'

import { ROUTES } from "@/constants/routes";
import { API_ENDPOINTS } from "@/constants/api";
import { apiClient } from "@/utils/api";
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FileTreeNode, WorkspaceData } from '@/types/api/workspace'
import ThreePanelsLayout from '@/components/layout/ThreePanelsLayout'
import UniversalTreePanel from '@/components/ui/universal/UniversalTreePanel'
import UniversalContentPanel from '@/components/ui/universal/UniversalContentPanel'
import ClaudeCodePanel from '@/components/workspace/ClaudeCodePanelNew'
import { 
  CODE_ICONS, 
  MONACO_CONFIG
} from '@/types/components/universal'
import LoadingScreen from '@/components/ui/LoadingScreen'
import ErrorScreen from '@/components/ui/ErrorScreen'

export default function WorkspaceContextPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
  const [selectedFile, setSelectedFile] = useState<FileTreeNode | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  
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
      // Attendre que le loading soit terminé pour éviter les redirections prématurées
      if (loading) {
        return
      }
      
      if (!isAuthenticated) {
        router.replace('/login')
        return
      }

      try {
        // Charger les données de l'arborescence
        const treeResponse = await apiClient.get<{ structure: FileTreeNode[] }>(`${API_ENDPOINTS.WORKSPACES}/${workspaceId}/context/tree`)
        
        if (!treeResponse.success) {
          if (treeResponse.status === 401) {
            router.replace(ROUTES.LOGIN)
            return
          }
          
          if (treeResponse.status === 404) {
            setError('Workspace non trouvé ou analyse non effectuée')
            return
          }
          
          throw new Error(treeResponse.error || 'Erreur lors du chargement de l\'arborescence')
        }

        setFileTree(treeResponse.data!.structure || [])

        // Charger les informations du workspace
        const workspaceResponse = await apiClient.get<WorkspaceData[]>(API_ENDPOINTS.WORKSPACES)
        if (workspaceResponse.success) {
          const currentWorkspace = workspaceResponse.data!.find((w: WorkspaceData) => w.id === workspaceId)
          if (currentWorkspace) {
            setWorkspace(currentWorkspace)
          }
        }
        
      } catch (err) {
        console.error('Erreur lors du chargement:', err)
        setError(err instanceof Error ? err.message : 'Erreur inattendue')
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkspaceData()
  }, [isAuthenticated, loading, router, workspaceId])

  // Charger le contenu d'un fichier sélectionné
  const loadFileContent = async (file: FileTreeNode | null) => {
    if (!file || file.type === 'directory') return

    setIsLoadingContent(true)
    setSelectedFile(file)

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/context/file-content?path=${encodeURIComponent(file.path)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Erreur lors du chargement du fichier')
      }

      const data = await response.json()
      setFileContent(data.data.content)
      
    } catch (err) {
      console.error('Erreur lors du chargement du fichier:', err)
      setFileContent(`Erreur lors du chargement du fichier: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setIsLoadingContent(false)
    }
  }



  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />

  return (
    <ThreePanelsLayout
      leftPanel={
        <UniversalTreePanel
          data={fileTree}
          mode="readonly"
          selectedId={selectedFile?.id}
          onSelect={loadFileContent}
          config={{
            title: 'Arborescence',
            showCount: true,
            icons: CODE_ICONS
          }}
          isLoading={isLoading}
        />
      }
      centerPanel={
        <UniversalContentPanel
          selectedItem={selectedFile}
          content={fileContent}
          mode="code"
          editorConfig={MONACO_CONFIG}
          isLoading={isLoadingContent}
        />
      }
      rightPanel={
        <ClaudeCodePanel
          workspaceId={workspaceId}
        />
      }
      config={{
        defaultSizes: [25, 50, 25],
        persistKey: 'context-layout'
      }}
    />
  )
}
