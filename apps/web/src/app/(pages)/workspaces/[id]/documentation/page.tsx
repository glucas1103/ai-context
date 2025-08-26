'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import DocumentationTreePanel from '@/components/documentation/DocumentationTreePanel';
import DocumentationContentPanel from '@/components/documentation/DocumentationContentPanel';
import DocumentationChatPanel from '@/components/documentation/DocumentationChatPanel';
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



  // Sélectionner un fichier
  const handleSelectFile = useCallback(async (node: DocumentationNode | null) => {
    setSelectedFile(node);
    if (node && node.type === 'file') {
      await loadFileContent(node.id);
    } else {
      setFileContent('');
    }
  }, [loadFileContent]);

  // Gérer les erreurs depuis les panels enfants
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

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
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Panel de navigation (gauche) */}
          <Panel defaultSize={25} minSize={15} maxSize={40}>
            <DocumentationTreePanel
              data={treeData}
              selectedId={selectedFile?.id}
              onSelect={handleSelectFile}
              workspaceId={workspaceId!}
              onTreeUpdate={loadDocumentationTree}
              isLoading={isLoading}
              onError={handleError}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />

          {/* Panel central (éditeur) */}
          <Panel defaultSize={50} minSize={30}>
            <DocumentationContentPanel
              selectedFile={selectedFile}
              content={fileContent}
              onChange={handleContentChange}
              onAutoSave={handleAutoSave}
              isLoading={isLoading}
              isSaving={isSaving}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-gray-600 transition-colors" />

          {/* Panel de chat (droite) */}
          <Panel defaultSize={25} minSize={15} maxSize={40}>
            <DocumentationChatPanel
              selectedFile={selectedFile}
              onSendMessage={handleSendMessage}
              messages={messages}
              isLoading={isChatLoading}
              workspaceId={workspaceId!}
            />
          </Panel>
        </PanelGroup>
      </div>


    </div>
  );
};

export default DocumentationPage;
