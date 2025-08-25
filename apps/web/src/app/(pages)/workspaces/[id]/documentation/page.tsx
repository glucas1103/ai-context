'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DocumentationTree from '@/components/DocumentationTree';
import RichTextEditor from '@/components/RichTextEditor';
import ChatPanel from '@/components/ChatPanel';
import { DocumentationNode, ChatMessage, DocumentationApiResponse } from '@/lib/types/documentation';

interface DocumentationPageProps {
  params: Promise<{
    id: string;
  }>;
}

const DocumentationPage: React.FC<DocumentationPageProps> = ({ params }) => {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);
  const [treeData, setTreeData] = useState<DocumentationNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<DocumentationNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
    type: 'folder' | 'file' | null;
    parentId?: string;
  }>({ isOpen: false, type: null });

  const workspaceId = resolvedParams?.id;

  // Charger la structure de documentation
  const loadDocumentationTree = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading documentation tree for workspace:', workspaceId);
      
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/tree`);
      console.log('Tree response status:', response.status);
      
      if (!response.ok) {
        console.error('Tree response not ok:', response.status, response.statusText);
        setError(`Erreur ${response.status}: ${response.statusText}`);
        return;
      }
      
      const result: DocumentationApiResponse<DocumentationNode[]> = await response.json();
      console.log('Tree response data:', result);
      
      if (result.success && result.data !== undefined) {
        setTreeData(result.data);
      } else {
        console.error('Tree response error:', result.error);
        setError(result.error?.message || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Error loading documentation tree:', error);
      setError(`Erreur de connexion: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Charger le contenu d'un fichier
  const loadFileContent = useCallback(async (fileId: string) => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${fileId}/content`);
      const result: DocumentationApiResponse<{ content: string }> = await response.json();
      
      if (result.success && result.data) {
        setFileContent(result.data.content);
      } else {
        setError(result.error?.message || 'Erreur lors du chargement du fichier');
      }
    } catch (error) {
      console.error('Error loading file content:', error);
      setError('Erreur de connexion');
    }
  }, [workspaceId]);

  // Sauvegarder le contenu d'un fichier
  const saveFileContent = useCallback(async (fileId: string, content: string) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${fileId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      const result: DocumentationApiResponse = await response.json();
      
      if (!result.success) {
        setError(result.error?.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving file content:', error);
      setError('Erreur de connexion');
    } finally {
      setIsSaving(false);
    }
  }, [workspaceId]);

  // Créer un dossier
  const createFolder = useCallback(async (parentId?: string) => {
    setCreateModal({ isOpen: true, type: 'folder', parentId });
  }, []);

  // Créer un dossier avec nom
  const doCreateFolder = useCallback(async (name: string, parentId?: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type: 'folder',
          parent_id: parentId,
        }),
      });

      const result: DocumentationApiResponse<DocumentationNode> = await response.json();
      
      if (result.success) {
        await loadDocumentationTree(); // Recharger l'arborescence
        setCreateModal({ isOpen: false, type: null });
      } else {
        setError(result.error?.message || 'Erreur lors de la création du dossier');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Erreur de connexion');
    }
  }, [workspaceId, loadDocumentationTree]);

  // Créer un fichier
  const createFile = useCallback(async (parentId?: string) => {
    setCreateModal({ isOpen: true, type: 'file', parentId });
  }, []);

  // Créer un fichier avec nom
  const doCreateFile = useCallback(async (name: string, parentId?: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type: 'file',
          parent_id: parentId,
          fileExtension: 'md',
        }),
      });

      const result: DocumentationApiResponse<DocumentationNode> = await response.json();
      
      if (result.success) {
        await loadDocumentationTree(); // Recharger l'arborescence
        setCreateModal({ isOpen: false, type: null });
        // Sélectionner le nouveau fichier automatiquement
        if (result.data) {
          setSelectedFile(result.data);
          await loadFileContent(result.data.id);
        }
      } else {
        setError(result.error?.message || 'Erreur lors de la création du fichier');
      }
    } catch (error) {
      console.error('Error creating file:', error);
      setError('Erreur de connexion');
    }
  }, [workspaceId, loadDocumentationTree, loadFileContent]);

  // Renommer un élément
  const renameItem = useCallback(async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
        }),
      });

      const result: DocumentationApiResponse<DocumentationNode> = await response.json();
      
      if (result.success) {
        await loadDocumentationTree(); // Recharger l'arborescence
        // Mettre à jour le fichier sélectionné si c'est celui qui a été renommé
        if (selectedFile && selectedFile.id === id && result.data) {
          setSelectedFile(result.data);
        }
      } else {
        setError(result.error?.message || 'Erreur lors du renommage');
      }
    } catch (error) {
      console.error('Error renaming item:', error);
      setError('Erreur de connexion');
    }
  }, [workspaceId, loadDocumentationTree, selectedFile]);

  // Supprimer un élément
  const deleteItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${id}`, {
        method: 'DELETE',
      });

      const result: DocumentationApiResponse = await response.json();
      
      if (result.success) {
        await loadDocumentationTree(); // Recharger l'arborescence
        // Désélectionner le fichier si c'est celui qui a été supprimé
        if (selectedFile && selectedFile.id === id) {
          setSelectedFile(null);
          setFileContent('');
        }
      } else {
        setError(result.error?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Erreur de connexion');
    }
  }, [workspaceId, loadDocumentationTree, selectedFile]);

  // Déplacer des éléments
  const moveItems = useCallback(async (dragIds: string[], parentId?: string, index?: number) => {
    try {
      console.log('Moving items:', { dragIds, parentId, index });
      
      // Déplacer chaque élément
      for (const dragId of dragIds) {
        const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${dragId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parent_id: parentId,
            order_index: index,
          }),
        });

        const result: DocumentationApiResponse<DocumentationNode> = await response.json();
        
        if (!result.success) {
          setError(result.error?.message || 'Erreur lors du déplacement');
          return;
        }
      }
      
      // Recharger l'arborescence après le déplacement
      await loadDocumentationTree();
    } catch (error) {
      console.error('Error moving items:', error);
      setError('Erreur de connexion lors du déplacement');
    }
  }, [workspaceId, loadDocumentationTree]);

  // Sélectionner un fichier
  const handleSelectFile = useCallback(async (node: DocumentationNode | null) => {
    setSelectedFile(node);
    if (node && node.type === 'file') {
      await loadFileContent(node.id);
    } else {
      setFileContent('');
    }
  }, [loadFileContent]);

  // Gérer les changements de contenu
  const handleContentChange = useCallback((content: string) => {
    setFileContent(content);
  }, []);

  // Auto-sauvegarde
  const handleAutoSave = useCallback(async (content: string) => {
    if (selectedFile && selectedFile.type === 'file') {
      await saveFileContent(selectedFile.id, content);
    }
  }, [selectedFile, saveFileContent]);

  // Gérer les messages du chat
  const handleSendMessage = useCallback(async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    // Simuler une réponse de l'IA (à remplacer par l'intégration réelle)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Je comprends votre demande : "${message}". Cette fonctionnalité sera disponible prochainement avec l'intégration complète de l'IA.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsChatLoading(false);
    }, 1500);
  }, []);

  // Charger les données au montage du composant
  useEffect(() => {
    if (workspaceId) {
      loadDocumentationTree();
    }
  }, [loadDocumentationTree, workspaceId]);

  // Fermer les notifications d'erreur
  const clearError = () => setError(null);

  // Composant de modale pour créer un élément
  const CreateItemModal = () => {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      setIsSubmitting(true);
      try {
        if (createModal.type === 'folder') {
          await doCreateFolder(name.trim(), createModal.parentId);
        } else if (createModal.type === 'file') {
          await doCreateFile(name.trim(), createModal.parentId);
        }
      } finally {
        setIsSubmitting(false);
        setName('');
      }
    };

    const handleClose = () => {
      setCreateModal({ isOpen: false, type: null });
      setName('');
    };

    if (!createModal.isOpen) return null;

    const isFolder = createModal.type === 'folder';
    const title = isFolder ? 'Nouveau Dossier' : 'Nouveau Fichier';
    const placeholder = isFolder ? 'Nom du dossier...' : 'Nom du fichier (sans extension)...';
    const icon = isFolder ? '📁' : '📄';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{icon}</span>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nom
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                disabled={isSubmitting}
              />
              {!isFolder && (
                <p className="text-xs text-gray-400 mt-1">
                  L'extension .md sera automatiquement ajoutée
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isSubmitting ? 'Création...' : 'Créer'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading || !resolvedParams) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Chargement de la documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* En-tête */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Documentation</h1>
            <p className="text-sm text-gray-400">
              Gérez et enrichissez votre documentation personnalisée
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center space-x-2 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm">Sauvegarde en cours...</span>
            </div>
          )}
        </div>
      </header>

      {/* Notification d'erreur */}
      {error && (
        <div className="bg-red-600 text-white p-3 flex items-center justify-between flex-shrink-0">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-white hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interface principale à trois panneaux */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex gap-4">
          {/* Panneau de navigation (gauche) */}
          <div className="w-1/4 min-w-[300px] max-w-[400px] h-full">
            <DocumentationTree
              data={treeData}
              onSelect={handleSelectFile}
              selectedId={selectedFile?.id}
              onCreateFolder={createFolder}
              onCreateFile={createFile}
              onRename={renameItem}
              onDelete={deleteItem}
              onMove={moveItems}
              className="h-full"
            />
          </div>

          {/* Panneau central (éditeur) */}
          <div className="flex-1 min-w-[400px] h-full">
            <div className="h-full bg-gray-900 rounded-lg">
              {selectedFile ? (
                selectedFile.type === 'file' ? (
                  <RichTextEditor
                    content={fileContent}
                    onChange={handleContentChange}
                    onAutoSave={handleAutoSave}
                    placeholder={`Commencez à écrire dans ${selectedFile.name}...`}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📁</div>
                      <p className="text-lg">Dossier sélectionné</p>
                      <p className="text-sm">
                        Sélectionnez un fichier pour l'éditer ou créez-en un nouveau.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-lg">Aucun fichier sélectionné</p>
                    <p className="text-sm">
                      Sélectionnez un fichier dans l'arborescence pour commencer à l'éditer.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panneau de chat (droite) */}
          <div className="w-1/4 min-w-[300px] max-w-[400px] h-full">
            <ChatPanel
              onSendMessage={handleSendMessage}
              messages={messages}
              isLoading={isChatLoading}
              placeholder="Demandez de l'aide pour enrichir votre documentation..."
            />
          </div>
        </div>
      </div>

      {/* Modale de création */}
      <CreateItemModal />
    </div>
  );
};

export default DocumentationPage;
