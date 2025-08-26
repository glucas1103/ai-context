'use client';

import React, { useState, useCallback } from 'react';
import DocumentationTree from '@/components/DocumentationTree';
import DocumentationModals from './DocumentationModals';
import { DocumentationNode, DocumentationApiResponse } from '@/lib/types/documentation';

interface DocumentationTreePanelProps {
  data: DocumentationNode[];
  selectedId?: string;
  onSelect: (node: DocumentationNode | null) => void;
  workspaceId: string;
  onTreeUpdate: () => Promise<void>;
  isLoading?: boolean;
  onError: (error: string) => void;
}

export default function DocumentationTreePanel({
  data,
  selectedId,
  onSelect,
  workspaceId,
  onTreeUpdate,
  isLoading = false,
  onError,
}: DocumentationTreePanelProps) {
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
    type: 'folder' | 'file' | null;
    parentId?: string;
  }>({ isOpen: false, type: null });

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
        await onTreeUpdate(); // Recharger l'arborescence
        setCreateModal({ isOpen: false, type: null });
      } else {
        onError(result.error?.message || 'Erreur lors de la création du dossier');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      onError('Erreur de connexion');
    }
  }, [workspaceId, onTreeUpdate, onError]);

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
        await onTreeUpdate(); // Recharger l'arborescence
        setCreateModal({ isOpen: false, type: null });
        // Sélectionner le nouveau fichier automatiquement
        if (result.data) {
          onSelect(result.data);
        }
      } else {
        onError(result.error?.message || 'Erreur lors de la création du fichier');
      }
    } catch (error) {
      console.error('Error creating file:', error);
      onError('Erreur de connexion');
    }
  }, [workspaceId, onTreeUpdate, onSelect, onError]);

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
        await onTreeUpdate(); // Recharger l'arborescence
      } else {
        onError(result.error?.message || 'Erreur lors du renommage');
      }
    } catch (error) {
      console.error('Error renaming item:', error);
      onError('Erreur de connexion');
    }
  }, [workspaceId, onTreeUpdate, onError]);

  // Supprimer un élément
  const deleteItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${id}`, {
        method: 'DELETE',
      });

      const result: DocumentationApiResponse = await response.json();
      
      if (result.success) {
        await onTreeUpdate(); // Recharger l'arborescence
      } else {
        onError(result.error?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      onError('Erreur de connexion');
    }
  }, [workspaceId, onTreeUpdate, onError]);

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
          onError(result.error?.message || 'Erreur lors du déplacement');
          return;
        }
      }
      
      // Recharger l'arborescence après le déplacement
      await onTreeUpdate();
    } catch (error) {
      console.error('Error moving items:', error);
      onError('Erreur de connexion lors du déplacement');
    }
  }, [workspaceId, onTreeUpdate, onError]);

  return (
    <div className="h-full">
      <DocumentationTree
        data={data}
        onSelect={onSelect}
        selectedId={selectedId}
        onCreateFolder={createFolder}
        onCreateFile={createFile}
        onRename={renameItem}
        onDelete={deleteItem}
        onMove={moveItems}
        className="h-full"
      />

      {/* Modale de création */}
      <DocumentationModals
        createModal={createModal}
        onCreateFolder={doCreateFolder}
        onCreateFile={doCreateFile}
        onClose={() => setCreateModal({ isOpen: false, type: null })}
      />
    </div>
  );
}
