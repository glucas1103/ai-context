import { useState, useEffect, useCallback, useRef } from 'react';
import { TreeNodeBase } from '@/types/common';

interface UseLocalTreeStateOptions<T extends TreeNodeBase> {
  workspaceId: string;
  initialData: T[];
  storageKey: string;
  onError?: (error: string) => void;
}

interface TreeOperation<T extends TreeNodeBase> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  data?: Partial<T>;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
}

export function useLocalTreeState<T extends TreeNodeBase>({
  workspaceId,
  initialData,
  storageKey,
  onError
}: UseLocalTreeStateOptions<T>) {
  const [localData, setLocalData] = useState<T[]>(initialData);
  const [pendingOperations, setPendingOperations] = useState<TreeOperation<T>[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncRef = useRef<number>(Date.now());
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Clé de stockage unique par workspace
  const fullStorageKey = `tree-state-${workspaceId}-${storageKey}`;

  // Charger l'état depuis localStorage
  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(fullStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.data && parsed.timestamp) {
          // Vérifier que les données ne sont pas trop anciennes (24h)
          const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
          if (isRecent) {
            return parsed.data;
          }
        }
      }
    } catch (error) {
      console.warn('Erreur lors du chargement depuis localStorage:', error);
    }
    return null;
  }, [fullStorageKey]);

  // Sauvegarder l'état dans localStorage
  const saveToStorage = useCallback((data: T[]) => {
    try {
      const toStore = {
        data,
        timestamp: Date.now(),
        workspaceId
      };
      localStorage.setItem(fullStorageKey, JSON.stringify(toStore));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }, [fullStorageKey, workspaceId]);

  // Initialiser l'état local
  useEffect(() => {
    const storedData = loadFromStorage();
    if (storedData) {
      setLocalData(storedData);
      console.log('État local restauré depuis localStorage');
    } else {
      setLocalData(initialData);
      saveToStorage(initialData);
    }
  }, [initialData, loadFromStorage, saveToStorage]);

  // Sauvegarder automatiquement les changements
  useEffect(() => {
    saveToStorage(localData);
  }, [localData, saveToStorage]);

  // Fonction utilitaire pour trouver un nœud par ID
  const findNodeById = useCallback((nodes: T[], id: string): T | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if ((node as any).children) {
        const found = findNodeById((node as any).children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Fonction utilitaire pour mettre à jour un nœud dans l'arbre
  const updateNodeInTree = useCallback((nodes: T[], id: string, updates: Partial<T>): T[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      if ((node as any).children) {
        return {
          ...node,
          children: updateNodeInTree((node as any).children, id, updates)
        };
      }
      return node;
    });
  }, []);

  // Fonction utilitaire pour supprimer un nœud de l'arbre
  const removeNodeFromTree = useCallback((nodes: T[], id: string): T[] => {
    return nodes.filter(node => {
      if (node.id === id) return false;
      if ((node as any).children) {
        (node as any).children = removeNodeFromTree((node as any).children, id);
      }
      return true;
    });
  }, []);

  // Fonction utilitaire pour ajouter un nœud à l'arbre
  const addNodeToTree = useCallback((nodes: T[], newNode: T, parentId?: string): T[] => {
    if (!parentId) {
      return [...nodes, newNode];
    }

    return nodes.map(node => {
      if (node.id === parentId) {
        const children = (node as any).children || [];
        return {
          ...node,
          children: [...children, newNode]
        };
      }
      if ((node as any).children) {
        return {
          ...node,
          children: addNodeToTree((node as any).children, newNode, parentId)
        };
      }
      return node;
    });
  }, []);

  // Créer un dossier (mise à jour optimiste)
  const createFolder = useCallback(async (name: string, parentId?: string) => {
    const newFolder: T = {
      id: `temp-${Date.now()}`,
      name,
      type: 'folder' as any,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as T;

    // Mise à jour optimiste
    setLocalData(prev => addNodeToTree(prev, newFolder, parentId));

    // Ajouter l'opération en attente
    const operation: TreeOperation<T> = {
      id: newFolder.id,
      type: 'create',
      data: newFolder,
      timestamp: Date.now(),
      status: 'pending'
    };

    setPendingOperations(prev => [...prev, operation]);

    // Synchroniser avec l'API
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: 'folder', parent_id: parentId })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // Mettre à jour avec l'ID réel de l'API
        setLocalData(prev => {
          const updated = updateNodeInTree(prev, newFolder.id, { 
            id: result.data.id,
            ...result.data 
          });
          return updated;
        });

        // Marquer l'opération comme réussie
        setPendingOperations(prev => 
          prev.map(op => 
            op.id === newFolder.id 
              ? { ...op, status: 'success' }
              : op
          )
        );

        // Nettoyer les opérations réussies après un délai
        setTimeout(() => {
          setPendingOperations(prev => 
            prev.filter(op => op.status !== 'success')
          );
        }, 3000);

      } else {
        throw new Error(result.error?.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création dossier:', error);
      
      // Annuler la mise à jour optimiste
      setLocalData(prev => removeNodeFromTree(prev, newFolder.id));
      
      // Marquer l'opération comme échouée
      setPendingOperations(prev => 
        prev.map(op => 
          op.id === newFolder.id 
            ? { ...op, status: 'error' }
            : op
        )
      );

      onError?.(`Erreur lors de la création du dossier: ${error}`);
    }
  }, [workspaceId, addNodeToTree, updateNodeInTree, removeNodeFromTree, onError]);

  // Créer un fichier (mise à jour optimiste)
  const createFile = useCallback(async (name: string, parentId?: string) => {
    const newFile: T = {
      id: `temp-${Date.now()}`,
      name,
      type: 'file' as any,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as T;

    // Mise à jour optimiste
    setLocalData(prev => addNodeToTree(prev, newFile, parentId));

    // Ajouter l'opération en attente
    const operation: TreeOperation<T> = {
      id: newFile.id,
      type: 'create',
      data: newFile,
      timestamp: Date.now(),
      status: 'pending'
    };

    setPendingOperations(prev => [...prev, operation]);

    // Synchroniser avec l'API
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          type: 'file', 
          parent_id: parentId, 
          fileExtension: 'md' 
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // Mettre à jour avec l'ID réel de l'API
        setLocalData(prev => {
          const updated = updateNodeInTree(prev, newFile.id, { 
            id: result.data.id,
            ...result.data 
          });
          return updated;
        });

        // Marquer l'opération comme réussie
        setPendingOperations(prev => 
          prev.map(op => 
            op.id === newFile.id 
              ? { ...op, status: 'success' }
              : op
          )
        );

        // Nettoyer les opérations réussies après un délai
        setTimeout(() => {
          setPendingOperations(prev => 
            prev.filter(op => op.status !== 'success')
          );
        }, 3000);

      } else {
        throw new Error(result.error?.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création fichier:', error);
      
      // Annuler la mise à jour optimiste
      setLocalData(prev => removeNodeFromTree(prev, newFile.id));
      
      // Marquer l'opération comme échouée
      setPendingOperations(prev => 
        prev.map(op => 
          op.id === newFile.id 
            ? { ...op, status: 'error' }
            : op
        )
      );

      onError?.(`Erreur lors de la création du fichier: ${error}`);
    }
  }, [workspaceId, addNodeToTree, updateNodeInTree, removeNodeFromTree, onError]);

  // Renommer un élément (mise à jour optimiste)
  const renameItem = useCallback(async (id: string, newName: string) => {
    const oldName = findNodeById(localData, id)?.name;
    if (!oldName) return;

    // Mise à jour optimiste
    setLocalData(prev => updateNodeInTree(prev, id, { name: newName }));

    // Ajouter l'opération en attente
    const operation: TreeOperation<T> = {
      id,
      type: 'update',
      data: { name: newName },
      timestamp: Date.now(),
      status: 'pending'
    };

    setPendingOperations(prev => [...prev, operation]);

    // Synchroniser avec l'API
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      const result = await response.json();
      
      if (result.success) {
        // Marquer l'opération comme réussie
        setPendingOperations(prev => 
          prev.map(op => 
            op.id === id 
              ? { ...op, status: 'success' }
              : op
          )
        );

        // Nettoyer les opérations réussies après un délai
        setTimeout(() => {
          setPendingOperations(prev => 
            prev.filter(op => op.status !== 'success')
          );
        }, 3000);

      } else {
        throw new Error(result.error?.message || 'Erreur lors du renommage');
      }
    } catch (error) {
      console.error('Erreur renommage:', error);
      
      // Annuler la mise à jour optimiste
      setLocalData(prev => updateNodeInTree(prev, id, { name: oldName }));
      
      // Marquer l'opération comme échouée
      setPendingOperations(prev => 
        prev.map(op => 
          op.id === id 
            ? { ...op, status: 'error' }
            : op
        )
      );

      onError?.(`Erreur lors du renommage: ${error}`);
    }
  }, [workspaceId, localData, findNodeById, updateNodeInTree, onError]);

  // Supprimer un élément (mise à jour optimiste)
  const deleteItem = useCallback(async (id: string) => {
    const nodeToDelete = findNodeById(localData, id);
    if (!nodeToDelete) return;

    // Mise à jour optimiste
    setLocalData(prev => removeNodeFromTree(prev, id));

    // Ajouter l'opération en attente
    const operation: TreeOperation<T> = {
      id,
      type: 'delete',
      data: nodeToDelete,
      timestamp: Date.now(),
      status: 'pending'
    };

    setPendingOperations(prev => [...prev, operation]);

    // Synchroniser avec l'API
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        // Marquer l'opération comme réussie
        setPendingOperations(prev => 
          prev.map(op => 
            op.id === id 
              ? { ...op, status: 'success' }
              : op
          )
        );

        // Nettoyer les opérations réussies après un délai
        setTimeout(() => {
          setPendingOperations(prev => 
            prev.filter(op => op.status !== 'success')
          );
        }, 3000);

      } else {
        throw new Error(result.error?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      
      // Annuler la mise à jour optimiste
      setLocalData(prev => addNodeToTree(prev, nodeToDelete, nodeToDelete.parent_id));
      
      // Marquer l'opération comme échouée
      setPendingOperations(prev => 
        prev.map(op => 
          op.id === id 
            ? { ...op, status: 'error' }
            : op
        )
      );

      onError?.(`Erreur lors de la suppression: ${error}`);
    }
  }, [workspaceId, localData, findNodeById, removeNodeFromTree, addNodeToTree, onError]);

  // Déplacer des éléments (mise à jour optimiste)
  const moveItems = useCallback(async (dragIds: string[], parentId?: string, index?: number) => {
    const nodesToMove = dragIds.map(id => findNodeById(localData, id)).filter(Boolean) as T[];
    if (nodesToMove.length === 0) return;

    // Sauvegarder l'état original pour rollback
    const originalState = [...localData];

    // Mise à jour optimiste
    setLocalData(prev => {
      let updated = prev;
      
      // Supprimer les nœuds de leur position actuelle
      dragIds.forEach(id => {
        updated = removeNodeFromTree(updated, id);
      });

      // Ajouter les nœuds à leur nouvelle position
      nodesToMove.forEach(node => {
        const updatedNode = { ...node, parent_id: parentId };
        updated = addNodeToTree(updated, updatedNode, parentId);
      });

      return updated;
    });

    // Ajouter les opérations en attente
    const operations: TreeOperation<T>[] = dragIds.map(id => ({
      id,
      type: 'move',
      data: { parent_id: parentId, order_index: index },
      timestamp: Date.now(),
      status: 'pending'
    }));

    setPendingOperations(prev => [...prev, ...operations]);

    // Synchroniser avec l'API
    try {
      const promises = dragIds.map(async (dragId) => {
        const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${dragId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: parentId, order_index: index })
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || 'Erreur lors du déplacement');
        }
        return result;
      });

      await Promise.all(promises);

      // Marquer toutes les opérations comme réussies
      setPendingOperations(prev => 
        prev.map(op => 
          dragIds.includes(op.id) 
            ? { ...op, status: 'success' }
            : op
        )
      );

      // Nettoyer les opérations réussies après un délai
      setTimeout(() => {
        setPendingOperations(prev => 
          prev.filter(op => !dragIds.includes(op.id) || op.status !== 'success')
        );
      }, 3000);

    } catch (error) {
      console.error('Erreur déplacement:', error);
      
      // Annuler la mise à jour optimiste
      setLocalData(originalState);
      
      // Marquer toutes les opérations comme échouées
      setPendingOperations(prev => 
        prev.map(op => 
          dragIds.includes(op.id) 
            ? { ...op, status: 'error' }
            : op
        )
      );

      onError?.(`Erreur lors du déplacement: ${error}`);
    }
  }, [workspaceId, localData, findNodeById, removeNodeFromTree, addNodeToTree, onError]);

  // Forcer la synchronisation avec l'API (pour les cas où on veut recharger)
  const forceSync = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/tree`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setLocalData(result.data);
        lastSyncRef.current = Date.now();
        
        // Nettoyer toutes les opérations en attente
        setPendingOperations([]);
        
        console.log('Synchronisation forcée réussie');
      } else {
        throw new Error(result.error?.message || 'Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Erreur synchronisation forcée:', error);
      onError?.(`Erreur lors de la synchronisation: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  }, [workspaceId, isSyncing, onError]);

  // Synchronisation automatique périodique (toutes les 5 minutes)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const timeSinceLastSync = Date.now() - lastSyncRef.current;
      if (timeSinceLastSync > 5 * 60 * 1000) { // 5 minutes
        forceSync();
      }
    }, 5 * 60 * 1000); // Vérifier toutes les 5 minutes

    return () => clearInterval(syncInterval);
  }, [forceSync]);

  // Nettoyer les opérations anciennes (plus de 1 heure)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      setPendingOperations(prev => 
        prev.filter(op => op.timestamp > oneHourAgo)
      );
    }, 60 * 60 * 1000); // Nettoyer toutes les heures

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    // État
    localData,
    pendingOperations,
    isSyncing,
    
    // Actions CRUD optimistes
    createFolder,
    createFile,
    renameItem,
    deleteItem,
    moveItems,
    
    // Synchronisation
    forceSync,
    
    // Utilitaires
    findNodeById,
    hasPendingChanges: pendingOperations.length > 0
  };
}
