'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { FileTreeNode, WorkspaceData } from '@/lib/types/context'
import TreeContext from '@/components/TreeContext'
import FileContext from '@/components/FileContext'
import ChatContext from '@/components/ChatContext'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorScreen from '@/components/ErrorScreen'

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
  const [treeHeight, setTreeHeight] = useState(400)
  
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Résoudre les params de manière async
  useEffect(() => {
    params.then(({ id }) => {
      setWorkspaceId(id)
    })
  }, [params])

  // Calculer la hauteur de l'arborescence
  useEffect(() => {
    const updateTreeHeight = () => {
      const headerHeight = 64 // hauteur du header
      const treeHeaderHeight = 80 // hauteur du header de l'arborescence
      const newHeight = window.innerHeight - headerHeight - treeHeaderHeight
      setTreeHeight(Math.max(newHeight, 300)) // minimum 300px
    }

    updateTreeHeight()
    window.addEventListener('resize', updateTreeHeight)
    return () => window.removeEventListener('resize', updateTreeHeight)
  }, [])

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
        const treeResponse = await fetch(`/api/workspaces/${workspaceId}/context/tree`)
        
        if (!treeResponse.ok) {
          if (treeResponse.status === 401) {
            router.replace('/login')
            return
          }
          
          if (treeResponse.status === 404) {
            setError('Workspace non trouvé ou analyse non effectuée')
            return
          }
          
          const errorData = await treeResponse.json()
          throw new Error(errorData.error?.message || 'Erreur lors du chargement de l&apos;arborescence')
        }

        const treeData = await treeResponse.json()
        setFileTree(treeData.data.structure || [])

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
        setError(err instanceof Error ? err.message : 'Erreur inattendue')
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkspaceData()
  }, [isAuthenticated, loading, router, workspaceId])

  // Charger le contenu d'un fichier sélectionné
  const loadFileContent = async (file: FileTreeNode) => {
    if (file.type === 'directory') return

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
    <div className="h-full">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Tree Context */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <TreeContext
            fileTree={fileTree}
            selectedFile={selectedFile}
            onFileSelect={loadFileContent}
            isLoading={isLoading}
            treeHeight={treeHeight}
          />
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />

        {/* Center Panel - File Context */}
        <Panel defaultSize={50} minSize={30}>
          <FileContext
            selectedFile={selectedFile}
            fileContent={fileContent}
            isLoadingContent={isLoadingContent}
          />
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />

        {/* Right Panel - Chat Context */}
        <Panel defaultSize={25} minSize={15} maxSize={40}>
          <ChatContext
            selectedFile={selectedFile}
            workspace={workspace}
          />
        </Panel>
      </PanelGroup>
    </div>
  )
}
