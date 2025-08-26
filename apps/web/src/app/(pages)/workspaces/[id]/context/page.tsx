'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FileTreeNode, WorkspaceData } from '@/lib/types/context'
import ThreePanelsLayout from '@/components/universal/ThreePanelsLayout'
import UniversalTreePanel from '@/components/universal/UniversalTreePanel'
import UniversalContentPanel from '@/components/universal/UniversalContentPanel'
import UniversalChatPanel from '@/components/universal/UniversalChatPanel'
import { 
  CODE_ICONS, 
  MONACO_CONFIG, 
  ANALYSIS_AGENT_CONFIG 
} from '@/lib/types/universal-components'
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
  const [messages, setMessages] = useState<any[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  
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

  // Gérer les messages du chat
  const handleSendMessage = async (message: string) => {
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsChatLoading(true)

    // Simuler une réponse de l'IA (à remplacer par l'intégration réelle)
    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: `Analyse du code : "${message}". Cette fonctionnalité sera disponible prochainement avec l'intégration complète de l'IA.`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsChatLoading(false)
    }, 1500)
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
        <UniversalChatPanel
          agentType="analysis"
          selectedItem={selectedFile}
          workspaceId={workspaceId}
          onSendMessage={handleSendMessage}
          messages={messages}
          isLoading={isChatLoading}
          agentConfig={ANALYSIS_AGENT_CONFIG}
        />
      }
      config={{
        defaultSizes: [25, 50, 25],
        persistKey: 'context-layout'
      }}
    />
  )
}
