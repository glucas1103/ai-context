'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Tree } from 'react-arborist'
import Editor from '@monaco-editor/react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

interface FileTreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  sha?: string
  language?: string
  children?: FileTreeNode[]
  url?: string
  download_url?: string
}

interface WorkspaceData {
  id: string
  name: string
  url: string
  created_at: string
}

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
        const treeResponse = await fetch(`/api/workspaces/${workspaceId}/tree`)
        
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
      const response = await fetch(`/api/workspaces/${workspaceId}/file-content?path=${encodeURIComponent(file.path)}`)
      
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Chargement de l&apos;espace de travail...</p>
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
            <div className="space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={() => router.push('/repos')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Retour aux dépôts
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Triple Panel Layout with Resizable Panels */}
      <div className="h-full">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - File Tree */}
          <Panel defaultSize={25} minSize={15} maxSize={40}>
            <div className="h-full bg-gray-800 border-r border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-lg font-semibold text-white">Arborescence</h2>
                <p className="text-sm text-gray-400">
                  {fileTree.length} élément{fileTree.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                {fileTree.length > 0 ? (
                  <div className="h-full text-white">
                    <Tree
                      data={fileTree}
                      openByDefault={false}
                      width="100%"
                      height={treeHeight}
                      indent={24}
                      padding={4}
                      rowHeight={32}
                      overscanCount={1}
                      searchTerm=""
                      onActivate={(node) => {
                        if (node.data.type === 'file') {
                          loadFileContent(node.data)
                        }
                      }}
                    >
                      {({ node, style, dragHandle, tree }) => (
                        <div 
                          style={style} 
                          ref={dragHandle}
                          className={`flex items-center px-2 py-1 hover:bg-gray-700 cursor-pointer ${
                            selectedFile?.id === node.data.id ? 'bg-blue-600' : ''
                          }`}
                          onClick={() => node.toggle()}
                        >
                          <div className="flex items-center">
                            {node.data.type === 'directory' && (
                              <span className="text-gray-400 mr-1">
                                {node.isOpen ? '📂' : '📁'}
                              </span>
                            )}
                            {node.data.type === 'file' && (
                              <span className="text-gray-400 mr-1">📄</span>
                            )}
                            <span className="text-sm text-white truncate">
                              {node.data.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </Tree>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    Aucun fichier trouvé
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />

          {/* Center Panel - File Viewer */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-gray-900">
              <div className="p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                <h3 className="text-lg font-semibold text-white">
                  {selectedFile ? selectedFile.path : 'Sélectionnez un fichier'}
                </h3>
                {selectedFile && (
                  <p className="text-sm text-gray-400">
                    {selectedFile.language} • {selectedFile.size ? `${selectedFile.size} octets` : 'Taille inconnue'}
                  </p>
                )}
              </div>
              <div className="flex-1">
                {isLoadingContent ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-300">Chargement du fichier...</p>
                    </div>
                  </div>
                ) : selectedFile && selectedFile.type === 'file' ? (
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={selectedFile.language || 'plaintext'}
                    value={fileContent}
                    path={selectedFile.path}
                    loading={<div className="flex items-center justify-center h-full text-gray-400">Chargement de l&apos;éditeur...</div>}
                    options={{
                      readOnly: true,
                      minimap: { enabled: true },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      folding: true,
                      automaticLayout: true,
                      contextmenu: false,
                      selectOnLineNumbers: true,
                    }}
                    beforeMount={(monaco) => {
                      // Configuration du thème sombre personnalisé si nécessaire
                      monaco.editor.defineTheme('custom-dark', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [],
                        colors: {
                          'editor.background': '#111827',
                        }
                      })
                    }}
                    onMount={(editor, monaco) => {
                      monaco.editor.setTheme('custom-dark')
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <p>Sélectionnez un fichier dans l&apos;arborescence pour l&apos;afficher</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />

          {/* Right Panel - Chat/Actions (Placeholder) */}
          <Panel defaultSize={25} minSize={15} maxSize={40}>
            <div className="h-full bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-lg font-semibold text-white">Actions</h2>
              </div>
              <div className="flex-1 p-4">
                <div className="bg-blue-900/20 border border-blue-700 rounded p-4 text-center">
                  <p className="text-blue-200 text-sm">
                    📝 Interface de chat avec l&apos;IA
                  </p>
                  <p className="text-blue-300 text-xs mt-2">
                    (À implémenter dans les prochaines stories)
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
