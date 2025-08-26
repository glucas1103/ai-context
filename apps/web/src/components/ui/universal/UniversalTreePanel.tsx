import { ROUTES } from "@/constants/routes";
import { API_ENDPOINTS } from "@/constants/api";
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Tree, TreeApi, NodeApi } from 'react-arborist';
import { UniversalTreePanelProps, UniversalTreeNode, PanelMode } from '@/types/components/universal';
import { TreeNodeBase } from '@/types/common';
import { FileTreeNode } from '@/types/api/workspace';
import DocumentationModals from '@/components/documentation/DocumentationModals';
import { DocumentationApiResponse, DocumentationNode, ArboristNodeData } from '@/types/api/documentation';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId?: string;
  nodeType?: 'folder' | 'file' | 'directory';
}

function UniversalTreePanel<T extends TreeNodeBase>({
  data,
  selectedId,
  mode,
  onSelect,
  crudActions,
  config,
  workspaceId,
  isLoading = false,
  onError,
  onTreeUpdate
}: UniversalTreePanelProps<T>) {
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
    type: 'folder' | 'file' | null;
    parentId?: string;
  }>({ isOpen: false, type: null });

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const [treeHeight, setTreeHeight] = useState(400);
  const treeRef = useRef<TreeApi<ArboristNodeData> | null>(null);

  // Calculer la hauteur de l'arborescence pour le mode readonly
  React.useEffect(() => {
    if (mode === 'readonly') {
      const updateTreeHeight = () => {
        const headerHeight = 64;
        const treeHeaderHeight = 80;
        const newHeight = window.innerHeight - headerHeight - treeHeaderHeight;
        setTreeHeight(Math.max(newHeight, 300));
      };

      updateTreeHeight();
      window.addEventListener('resize', updateTreeHeight);
      return () => window.removeEventListener('resize', updateTreeHeight);
    }
  }, [mode]);

  // Convertir les données en format ArboristNodeData pour mode editable
  const convertToArboristData = useCallback((nodes: T[]): ArboristNodeData[] => {
    return nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type === 'directory' ? 'folder' : node.type as 'folder' | 'file',
      children: (node as any).children ? convertToArboristData((node as any).children) : undefined,
      isSelected: node.id === selectedId
    }));
  }, [selectedId]);

  // Trouver un nœud par ID dans la structure originale
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

  // Fermer le menu contextuel quand on clique ailleurs
  const handleDocumentClick = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  // Actions CRUD pour le mode editable (DÉCLARÉES EN PREMIER)
  const createFolder = useCallback(async (parentId?: string) => {
    if (mode === 'editable') {
      setCreateModal({ isOpen: true, type: 'folder', parentId });
    }
  }, [mode]);

  const createFile = useCallback(async (parentId?: string) => {
    if (mode === 'editable') {
      setCreateModal({ isOpen: true, type: 'file', parentId });
    }
  }, [mode]);

  const doCreateFolder = useCallback(async (name: string, parentId?: string) => {
    if (!workspaceId || !onTreeUpdate || !onError) return;

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
        await onTreeUpdate();
        setCreateModal({ isOpen: false, type: null });
      } else {
        onError(result.error?.message || 'Erreur lors de la création du dossier');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      onError('Erreur de connexion');
    }
  }, [workspaceId, onTreeUpdate, onError]);

  const doCreateFile = useCallback(async (name: string, parentId?: string) => {
    if (!workspaceId || !onTreeUpdate || !onError) return;

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
        await onTreeUpdate();
        setCreateModal({ isOpen: false, type: null });
        if (result.data) {
          onSelect(result.data as T);
        }
      } else {
        onError(result.error?.message || 'Erreur lors de la création du fichier');
      }
    } catch (error) {
      console.error('Error creating file:', error);
      onError('Erreur de connexion');
    }
  }, [workspaceId, onTreeUpdate, onSelect, onError]);

  const renameItem = useCallback(async (id: string, newName: string) => {
    if (!workspaceId || !onTreeUpdate || !onError) return;

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
        await onTreeUpdate();
      } else {
        onError(result.error?.message || 'Erreur lors du renommage');
      }
    } catch (error) {
      console.error('Error renaming item:', error);
      onError('Erreur de connexion');
    }
  }, [workspaceId, onTreeUpdate, onError]);

  const deleteItem = useCallback(async (id: string) => {
    if (!workspaceId || !onTreeUpdate || !onError) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documentation/${id}`, {
        method: 'DELETE',
      });

      const result: DocumentationApiResponse = await response.json();
      
      if (result.success) {
        await onTreeUpdate();
      } else {
        onError(result.error?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      onError('Erreur de connexion');
    }
  }, [workspaceId, onTreeUpdate, onError]);

  const moveItems = useCallback(async (dragIds: string[], parentId?: string, index?: number) => {
    if (!workspaceId || !onTreeUpdate || !onError) return;

    try {
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
      
      await onTreeUpdate();
    } catch (error) {
      console.error('Error moving items:', error);
      onError('Erreur de connexion lors du déplacement');
    }
  }, [workspaceId, onTreeUpdate, onError]);

  // Gestionnaire de clic droit
  const handleContextMenu = useCallback((event: React.MouseEvent, nodeId?: string, nodeType?: 'folder' | 'file' | 'directory') => {
    if (mode === 'readonly') return; // Pas de menu contextuel en mode readonly
    
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId,
      nodeType
    });
  }, [mode]);

  // Gestionnaires d'événements React Arborist pour mode editable
  const handleArboristSelect = useCallback((nodes: NodeApi<ArboristNodeData>[]) => {
    if (nodes.length > 0) {
      const selectedNode = findNodeById(data, nodes[0].data.id);
      onSelect(selectedNode);
    } else {
      onSelect(null);
    }
  }, [data, findNodeById, onSelect]);

  const handleArboristCreate = useCallback(({ parentId, index, type }: { 
    parentId: string | null; 
    parentNode: NodeApi<ArboristNodeData> | null; 
    index: number; 
    type: "internal" | "leaf"; 
  }) => {
    const actualParentId = parentId || undefined;
    if (type === 'internal') {
      createFolder(actualParentId);
    } else {
      createFile(actualParentId);
    }
    return null;
  }, [createFolder, createFile]);

  const handleArboristRename = useCallback(({ id, name }: { id: string; name: string }) => {
    renameItem(id, name);
  }, [renameItem]);

  const handleArboristMove = useCallback(({ dragIds, parentId, index }: { 
    dragIds: string[]; 
    dragNodes: NodeApi<ArboristNodeData>[]; 
    parentId: string | null; 
    parentNode: NodeApi<ArboristNodeData> | null; 
    index: number; 
  }) => {
    const actualParentId = parentId || undefined;
    moveItems(dragIds, actualParentId, index);
  }, [moveItems]);

  const handleArboristDelete = useCallback(({ ids }: { ids: string[] }) => {
    ids.forEach(id => deleteItem(id));
  }, [deleteItem]);

  // Gestionnaire global de clics pour fermer le menu contextuel
  React.useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [contextMenu.visible, handleDocumentClick]);

  // Actions du menu contextuel
  const handleContextAction = useCallback((action: string, nodeId?: string, nodeType?: 'folder' | 'file' | 'directory') => {
    setContextMenu({ visible: false, x: 0, y: 0 });
    
    switch (action) {
      case 'create-folder':
        createFolder(nodeId);
        break;
      case 'create-file':
        createFile(nodeId);
        break;
      case 'rename':
        if (nodeId && mode === 'editable') {
          const tree = treeRef.current;
          const node = tree?.get(nodeId);
          if (node) {
            node.edit();
          }
        }
        break;
      case 'delete':
        if (nodeId && confirm(`Êtes-vous sûr de vouloir supprimer cet élément ?`)) {
          deleteItem(nodeId);
        }
        break;
    }
  }, [createFolder, createFile, deleteItem, mode]);

  // Fonction pour déterminer si un nœud est un dossier
  const isFolder = (node: T) => {
    return node.type === 'directory' || node.type === 'folder';
  };

  // Fonction pour déterminer si un nœud est un fichier
  const isFile = (node: T) => {
    return node.type === 'file';
  };

  // Composant pour rendre chaque nœud en mode editable
  const NodeRenderer = ({ node, style, dragHandle }: { 
    node: NodeApi<ArboristNodeData>; 
    style: React.CSSProperties; 
    dragHandle?: (el: HTMLDivElement | null) => void;
  }) => {
    const handleNodeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Si c'est un dossier, on toggle l'état ouvert/fermé
      if (node.data.type === 'folder') {
        node.toggle();
      }
      
      // Dans tous les cas, on sélectionne le nœud
      node.handleClick(e);
    };

    const handleNodeContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleContextMenu(e, node.data.id, node.data.type);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Double-clic seulement pour éditer le nom
      if (mode === 'editable') {
        node.edit();
      }
    };

    const handleChevronClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.data.type === 'folder') {
        node.toggle();
      }
    };

    return (
      <div
        style={style}
        ref={dragHandle}
        className={`flex items-center group px-2 py-1 rounded cursor-pointer transition-all duration-200 ${
          node.isSelected 
            ? 'bg-blue-600 text-white shadow-md' 
            : node.isDragging
            ? 'bg-blue-400 text-white opacity-60'
            : node.willReceiveDrop
            ? 'bg-green-600 text-white'
            : 'hover:bg-gray-700 text-gray-300'
        } ${
          node.isFocused ? 'ring-2 ring-blue-400' : ''
        }`}
        onClick={handleNodeClick}
        onContextMenu={handleNodeContextMenu}
        onDoubleClick={handleDoubleClick}
        draggable
        role="treeitem"
        aria-selected={node.isSelected}
        aria-expanded={node.data.type === 'folder' ? node.isOpen : undefined}
        tabIndex={node.isFocused ? 0 : -1}
      >
        {/* Indicateur de drag */}
        {node.isDragging && (
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}

        {/* Chevron pour les dossiers */}
        {node.data.type === 'folder' ? (
          <button
            onClick={handleChevronClick}
            className="mr-1 w-5 h-5 flex items-center justify-center hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200 transition-all duration-150 flex-shrink-0"
            title={node.isOpen ? 'Fermer le dossier' : 'Ouvrir le dossier'}
          >
            <span className={`text-xs transition-transform duration-150 ${node.isOpen ? 'rotate-90' : 'rotate-0'}`}>
              ▶
            </span>
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}

        {/* Icône avec état */}
        <span className="mr-2 text-lg flex-shrink-0">
          {node.data.type === 'folder' ? (
            node.isOpen ? config.icons.folderOpen || config.icons.folder : config.icons.folder
          ) : (
            config.icons.file
          )}
        </span>

        {/* Nom (éditable avec React Arborist) */}
        {node.isEditing ? (
          <input
            autoFocus
            defaultValue={node.data.name}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => node.submit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                node.reset();
              } else if (e.key === 'Enter') {
                node.submit((e.target as HTMLInputElement).value);
              }
            }}
            className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <span className="flex-1 text-sm truncate" title={node.data.name}>
            {node.data.name}
          </span>
        )}

        {/* Badges d'état */}
        <div className="ml-2 flex items-center space-x-1">
          {node.isSelected && (
            <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
          )}
          {node.willReceiveDrop && (
            <span className="text-xs text-green-400" title="Zone de dépôt">⬇</span>
          )}
        </div>
      </div>
    );
  };

  // Composant de prévisualisation de drag
  const DragPreviewRenderer = ({ dragIds, offset }: { 
    dragIds: string[]; 
    offset: { x: number; y: number } | null; 
  }) => {
    if (!offset || dragIds.length === 0) return null;

    return (
      <div
        className="fixed pointer-events-none z-50 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg opacity-90"
        style={{
          left: offset.x + 10,
          top: offset.y + 10,
        }}
      >
        <div className="flex items-center space-x-2">
          <span>📦</span>
          <span className="text-sm font-medium">
            {dragIds.length === 1 
              ? 'Déplacement...' 
              : `${dragIds.length} éléments`
            }
          </span>
        </div>
      </div>
    );
  };

  // Composant de curseur de drop
  const DropCursorRenderer = ({ top, left, indent }: { 
    top: number; 
    left: number; 
    indent: number; 
  }) => (
    <div
      className="absolute h-0.5 bg-blue-500 rounded-full shadow-lg"
      style={{
        top: top - 1,
        left: left + indent,
        right: 8,
      }}
    >
      <div className="absolute -left-1 -top-1 w-3 h-3 bg-blue-500 rounded-full" />
    </div>
  );

  return (
    <div className="h-full bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">{config.title}</h2>
        {config.showCount && (
          <p className="text-sm text-gray-400">
            {data.length} élément{data.length !== 1 ? 's' : ''}
          </p>
        )}
        
        {/* Actions pour mode editable */}
        {mode === 'editable' && (
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => createFolder()}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              📁 Dossier
            </button>
            <button
              onClick={() => createFile()}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              📝 Fichier
            </button>
          </div>
        )}
      </div>

      {/* Contenu de l'arborescence */}
      <div 
        className="flex-1 overflow-hidden p-2"
        onContextMenu={(e) => handleContextMenu(e)}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : data.length > 0 ? (
          <div className="h-full text-white">
            {mode === 'editable' ? (
              <Tree
                ref={treeRef}
                data={convertToArboristData(data)}
                openByDefault={false}
                width="100%"
                height={800}
                indent={24}
                rowHeight={32}
                onSelect={handleArboristSelect}
                onCreate={handleArboristCreate}
                onRename={handleArboristRename}
                onMove={handleArboristMove}
                onDelete={handleArboristDelete}
                searchTerm=""
                searchMatch={() => false}
                disableEdit={false}
                disableDrag={false}
                disableDrop={false}
                className="react-arborist-tree"
                renderDragPreview={DragPreviewRenderer}
                renderCursor={DropCursorRenderer}
                selectionFollowsFocus={true}
                disableMultiSelection={false}
              >
                {NodeRenderer}
              </Tree>
            ) : (
              <Tree
                data={data}
                openByDefault={false}
                width="100%"
                height={treeHeight}
                indent={24}
                padding={4}
                rowHeight={32}
                overscanCount={1}
                searchTerm=""
                onActivate={(node) => {
                  if (isFile(node.data)) {
                    onSelect(node.data);
                  }
                }}
                disableEdit={true}
                disableDrop={true}
                disableDrag={true}
              >
                {({ node, style, dragHandle }) => (
                  <div 
                    style={style} 
                    ref={dragHandle}
                    className={`flex items-center px-2 py-1 hover:bg-gray-700 cursor-pointer ${
                      selectedId === node.data.id ? 'bg-blue-600' : ''
                    }`}
                    onClick={() => {
                      if (isFolder(node.data)) {
                        node.toggle();
                      } else if (isFile(node.data)) {
                        onSelect(node.data);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      {isFolder(node.data) && (
                        <span className="text-gray-400 mr-1">
                          {node.isOpen ? (config.icons.folderOpen || config.icons.folder) : config.icons.folder}
                        </span>
                      )}
                      {isFile(node.data) && (
                        <span className="text-gray-400 mr-1">{config.icons.file}</span>
                      )}
                      <span className="text-sm text-white truncate">
                        {node.data.name}
                      </span>
                    </div>
                  </div>
                )}
              </Tree>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            {mode === 'readonly' ? 'Aucun fichier trouvé' : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm text-center">
                  Aucun document encore.<br />
                  Créez votre premier dossier ou fichier.
                </p>
                <div className="mt-4 text-xs text-gray-600 space-y-2">
                  <p>💡 Astuce : Clic droit pour le menu contextuel</p>
                  <div className="text-center">
                    <p className="font-medium mb-1">⌨️ Raccourcis clavier :</p>
                    <p>Ctrl+N : Nouveau fichier • Ctrl+Shift+N : Nouveau dossier</p>
                    <p>F2 : Renommer • Delete : Supprimer</p>
                    <p>Drag & drop pour déplacer</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Menu contextuel pour mode editable */}
      {mode === 'editable' && contextMenu.visible && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-2 min-w-[200px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Options communes */}
          <div className="px-3 py-1 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-600 mb-1">
            Actions
          </div>
          
          {/* Si un nœud est sélectionné */}
          {contextMenu.nodeId ? (
            <>
              {(contextMenu.nodeType === 'folder' || contextMenu.nodeType === 'directory') && (
                <>
                  <button
                    onClick={() => handleContextAction('create-folder', contextMenu.nodeId, contextMenu.nodeType)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-200 flex items-center space-x-2"
                  >
                    <span>📁</span>
                    <span>Nouveau dossier</span>
                  </button>
                  <button
                    onClick={() => handleContextAction('create-file', contextMenu.nodeId, contextMenu.nodeType)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-200 flex items-center space-x-2"
                  >
                    <span>📄</span>
                    <span>Nouveau fichier</span>
                  </button>
                  <div className="border-t border-gray-600 my-1" />
                </>
              )}
              <button
                onClick={() => handleContextAction('rename', contextMenu.nodeId, contextMenu.nodeType)}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-200 flex items-center space-x-2"
              >
                <span>✏️</span>
                <span>Renommer</span>
              </button>
              <div className="border-t border-gray-600 my-1" />
              <button
                onClick={() => handleContextAction('delete', contextMenu.nodeId, contextMenu.nodeType)}
                className="w-full text-left px-3 py-2 hover:bg-red-600 text-sm text-red-400 hover:text-white flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Supprimer</span>
              </button>
            </>
          ) : (
            // Menu racine (espace vide)
            <>
              <button
                onClick={() => handleContextAction('create-folder')}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-200 flex items-center space-x-2"
              >
                <span>📁</span>
                <span>Nouveau dossier</span>
              </button>
              <button
                onClick={() => handleContextAction('create-file')}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-200 flex items-center space-x-2"
              >
                <span>📄</span>
                <span>Nouveau fichier</span>
              </button>
            </>
          )}
          
          {/* Info raccourcis */}
          <div className="border-t border-gray-600 mt-1 pt-1">
            <div className="px-3 py-1 text-xs text-gray-500">
              💡 Double-clic pour éditer • Drag & drop pour déplacer
              <br />
              ⌨️ F2: Renommer • Del: Supprimer • Ctrl+N: Nouveau
            </div>
          </div>
        </div>
      )}

      {/* Modales pour mode editable */}
      {mode === 'editable' && (
        <DocumentationModals
          createModal={createModal}
          onCreateFolder={doCreateFolder}
          onCreateFile={doCreateFile}
          onClose={() => setCreateModal({ isOpen: false, type: null })}
        />
      )}

      {/* Styles CSS pour React Arborist */}
      <style>{`
        .react-arborist-tree {
          outline: none;
        }
        .react-arborist-tree:focus-within {
          outline: 2px solid #3B82F6;
          outline-offset: -2px;
        }
      `}</style>
    </div>
  );
}

export default UniversalTreePanel;
