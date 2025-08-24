'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { DocumentationNode } from '@/lib/types/documentation'
import DocumentationTree from '@/components/documentation/DocumentationTree'
import MarkdownEditor from '@/components/documentation/MarkdownEditor'
import ChatPanel from '@/components/documentation/ChatPanel'
import { HiPlus, HiSave, HiX } from 'react-icons/hi'

interface WorkspaceData {
  id: string
  name: string
  url: string
  created_at: string
}

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, type: 'folder' | 'file', fileExtension?: string) => void
  type: 'folder' | 'file'
  parentId?: string
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  parentId
}) => {
  const [name, setName] = useState('')
  const [fileExtension, setFileExtension] = useState('.md')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      const fullName = type === 'file' ? `${name.trim()}${fileExtension}` : name.trim()
      onSubmit(fullName, type, type === 'file' ? fileExtension : undefined)
      setName('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold text-white mb-4">
          Créer un {type === 'folder' ? 'dossier' : 'fichier'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Nom du ${type === 'folder' ? 'dossier' : 'fichier'}`}
              autoFocus
            />
          </div>
          
          {type === 'file' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Extension
              </label>
              <select
                value={fileExtension}
                onChange={(e) => setFileExtension(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value=".md">.md (Markdown)</option>
                <option value=".txt">.txt (Texte)</option>
                <option value=".doc">.doc (Document)</option>
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function WorkspaceDocumentationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [documentationTree, setDocumentationTree] = useState<DocumentationNode[]>([])
  const [selectedNode, setSelectedNode] = useState<DocumentationNode | null>(null)
  const [currentContent, setCurrentContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<'folder' | 'file'>('file')
  const [createParentId, setCreateParentId] = useState<string | undefined>()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Résoudre les params de manière async
  useEffect(() => {
    params.then(({ id }) => {
      setWorkspaceId(id)
    })
  }, [params])

  // Charger l'arborescence de documentation
  const loadDocumentationTree = useCallback(async () => {
    if (!workspaceId) return

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/tree`)
      if (response.ok) {
        const data = await response.json()
        setDocumentationTree(data.data || [])
      } else {
        console.error('Erreur lors du chargement de l\'arborescence:', response.status)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'arborescence:', error)
    }
  }, [workspaceId])

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

        // Charger l'arborescence de documentation
        await loadDocumentationTree()
        
      } catch (err) {
        console.error('Erreur lors du chargement:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, loading, router, workspaceId, loadDocumentationTree])

  // Auto-sauvegarde
  const autoSave = useCallback(async () => {
    if (!selectedNode || selectedNode.type !== 'file' || !hasUnsavedChanges) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${selectedNode.id}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentContent })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        // Recharger l'arborescence pour mettre à jour les métadonnées
        await loadDocumentationTree()
      } else {
        console.error('Erreur lors de la sauvegarde:', response.status)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsSaving(false)
    }
  }, [selectedNode, currentContent, hasUnsavedChanges, workspaceId, loadDocumentationTree])

  // Déclencher l'auto-sauvegarde après 3 secondes d'inactivité
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    if (hasUnsavedChanges) {
      autoSaveTimeoutRef.current = setTimeout(autoSave, 3000)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [hasUnsavedChanges, autoSave])

  // Gestion de la sélection d'un fichier
  const handleSelectNode = useCallback((node: DocumentationNode) => {
    if (hasUnsavedChanges) {
      if (!confirm('Vous avez des modifications non sauvegardées. Voulez-vous continuer ?')) {
        return
      }
      setHasUnsavedChanges(false)
    }

    setSelectedNode(node)
    if (node.type === 'file') {
      setCurrentContent(node.content || '')
    } else {
      setCurrentContent('')
    }
  }, [hasUnsavedChanges])

  // Gestion de la création d'éléments
  const handleCreateItem = useCallback(async (name: string, type: 'folder' | 'file', fileExtension?: string) => {
    try {
      const endpoint = type === 'folder' ? 'folders' : 'files'
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          parent_id: createParentId
        })
      })

      if (response.ok) {
        await loadDocumentationTree()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      alert('Erreur lors de la création')
    }
  }, [workspaceId, createParentId, loadDocumentationTree])

  // Gestion du renommage
  const handleRename = useCallback(async (nodeId: string, newName: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${nodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })

      if (response.ok) {
        await loadDocumentationTree()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur lors du renommage:', error)
      alert('Erreur lors du renommage')
    }
  }, [workspaceId, loadDocumentationTree])

  // Gestion de la suppression
  const handleDelete = useCallback(async (nodeId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${nodeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        if (selectedNode?.id === nodeId) {
          setSelectedNode(null)
          setCurrentContent('')
        }
        await loadDocumentationTree()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }, [workspaceId, selectedNode, loadDocumentationTree])

  // Gestion du déplacement
  const handleMove = useCallback(async (nodeId: string, newParentId?: string, newIndex?: number) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${nodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parent_id: newParentId,
          order_index: newIndex || 0
        })
      })

      if (response.ok) {
        await loadDocumentationTree()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur lors du déplacement:', error)
      alert('Erreur lors du déplacement')
    }
  }, [workspaceId, loadDocumentationTree])

  // Gestion des changements de contenu
  const handleContentChange = useCallback((content: string) => {
    setCurrentContent(content)
    setHasUnsavedChanges(true)
  }, [])

  // Gestion de la sauvegarde manuelle
  const handleManualSave = useCallback(() => {
    autoSave()
  }, [autoSave])

  // Ouvrir le modal de création
  const openCreateModal = useCallback((type: 'folder' | 'file', parentId?: string) => {
    setCreateType(type)
    setCreateParentId(parentId)
    setShowCreateModal(true)
  }, [])

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
    <div className="min-h-screen bg-gray-900 flex">
      {/* Panneau gauche - Navigation */}
      <div className="w-80 flex-shrink-0 border-r border-gray-700">
        <DocumentationTree
          data={documentationTree}
          onSelect={handleSelectNode}
          onCreateFolder={(parentId) => openCreateModal('folder', parentId)}
          onCreateFile={(parentId) => openCreateModal('file', parentId)}
          onRename={handleRename}
          onDelete={handleDelete}
          onMove={handleMove}
          selectedNodeId={selectedNode?.id}
          className="h-full"
        />
      </div>

      {/* Panneau central - Éditeur */}
      <div className="flex-1 flex flex-col">
        {selectedNode ? (
          <>
            {/* Header de l'éditeur */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-white">
                    {selectedNode.name}
                  </h2>
                  {hasUnsavedChanges && (
                    <span className="text-xs text-yellow-400 bg-yellow-900 px-2 py-1 rounded">
                      Modifications non sauvegardées
                    </span>
                  )}
                  {isSaving && (
                    <span className="text-xs text-blue-400 bg-blue-900 px-2 py-1 rounded">
                      Sauvegarde...
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleManualSave}
                    disabled={!hasUnsavedChanges || isSaving}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <HiSave className="h-4 w-4" />
                    <span>Sauvegarder</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Contenu de l'éditeur */}
            <div className="flex-1 p-4">
              {selectedNode.type === 'file' ? (
                <MarkdownEditor
                  content={currentContent}
                  onChange={handleContentChange}
                  onSave={handleManualSave}
                  placeholder="Commencez à écrire votre documentation..."
                  className="h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-lg">Sélectionnez un fichier pour commencer l'édition</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-xl font-semibold mb-2">Documentation</h2>
              <p className="text-sm">Sélectionnez un fichier dans l'arborescence pour commencer</p>
            </div>
          </div>
        )}
      </div>

      {/* Panneau droit - Chat */}
      <div className="w-80 flex-shrink-0 border-l border-gray-700">
        <ChatPanel />
      </div>

      {/* Modal de création */}
      <CreateItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateItem}
        type={createType}
        parentId={createParentId}
      />
    </div>
  )
}
