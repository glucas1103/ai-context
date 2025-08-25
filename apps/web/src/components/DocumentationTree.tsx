'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Tree, TreeApi, NodeApi } from 'react-arborist';
import { DocumentationNode, ArboristNodeData } from '@/lib/types/documentation';

interface DocumentationTreeProps {
  data: DocumentationNode[];
  onSelect: (node: DocumentationNode | null) => void;
  selectedId?: string;
  onCreateFolder: (parentId?: string) => void;
  onCreateFile: (parentId?: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onMove: (dragIds: string[], parentId?: string, index?: number) => void;
  className?: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId?: string;
  nodeType?: 'folder' | 'file';
}

const DocumentationTree: React.FC<DocumentationTreeProps> = ({
  data,
  onSelect,
  selectedId,
  onCreateFolder,
  onCreateFile,
  onRename,
  onDelete,
  onMove,
  className = ''
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const [dragPreview, setDragPreview] = useState<{ visible: boolean; nodeIds: string[] }>({ visible: false, nodeIds: [] });
  const treeRef = useRef<TreeApi<ArboristNodeData> | null>(null);

  // Convertir les DocumentationNode en ArboristNodeData
  const convertToArboristData = useCallback((nodes: DocumentationNode[]): ArboristNodeData[] => {
    return nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      children: node.children ? convertToArboristData(node.children) : undefined,
      isSelected: node.id === selectedId
    }));
  }, [selectedId]);

  const arboristData = convertToArboristData(data);

  // Trouver un nœud par ID dans la structure originale
  const findNodeById = useCallback((nodes: DocumentationNode[], id: string): DocumentationNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Fermer le menu contextuel quand on clique ailleurs
  const handleDocumentClick = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  // Gestionnaires d'événements React Arborist
  const handleSelect = useCallback((nodes: NodeApi<ArboristNodeData>[]) => {
    if (nodes.length > 0) {
      const selectedNode = findNodeById(data, nodes[0].data.id);
      onSelect(selectedNode);
    } else {
      onSelect(null);
    }
  }, [data, findNodeById, onSelect]);

  const handleCreate = useCallback(({ parentId, index, type }: { 
    parentId: string | null; 
    parentNode: NodeApi<ArboristNodeData> | null; 
    index: number; 
    type: "internal" | "leaf"; 
  }) => {
    const actualParentId = parentId || undefined;
    if (type === 'internal') {
      onCreateFolder(actualParentId);
    } else {
      onCreateFile(actualParentId);
    }
    return null;
  }, [onCreateFolder, onCreateFile]);

  const handleRename = useCallback(({ id, name }: { id: string; name: string }) => {
    onRename(id, name);
  }, [onRename]);

  const handleMove = useCallback(({ dragIds, parentId, index }: { 
    dragIds: string[]; 
    dragNodes: NodeApi<ArboristNodeData>[]; 
    parentId: string | null; 
    parentNode: NodeApi<ArboristNodeData> | null; 
    index: number; 
  }) => {
    const actualParentId = parentId || undefined;
    onMove(dragIds, actualParentId, index);
  }, [onMove]);

  const handleDelete = useCallback(({ ids }: { ids: string[] }) => {
    ids.forEach(id => onDelete(id));
  }, [onDelete]);

  // Gestionnaire de clic droit
  const handleContextMenu = useCallback((event: React.MouseEvent, nodeId?: string, nodeType?: 'folder' | 'file') => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId,
      nodeType
    });
  }, []);

  // Actions du menu contextuel
  const handleContextAction = useCallback((action: string, nodeId?: string, nodeType?: 'folder' | 'file') => {
    setContextMenu({ visible: false, x: 0, y: 0 });
    
    switch (action) {
      case 'create-folder':
        onCreateFolder(nodeId);
        break;
      case 'create-file':
        onCreateFile(nodeId);
        break;
      case 'rename':
        if (nodeId) {
          // L'édition inline sera gérée par React Arborist
          const tree = treeRef.current;
          const node = tree?.get(nodeId);
          if (node) {
            node.edit();
          }
        }
        break;
      case 'delete':
        if (nodeId && confirm(`Êtes-vous sûr de vouloir supprimer cet élément ?`)) {
          onDelete(nodeId);
        }
        break;
    }
  }, [onCreateFolder, onCreateFile, onDelete]);

  // Gestionnaire global de clics pour fermer le menu contextuel
  React.useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [contextMenu.visible, handleDocumentClick]);

  // Gestionnaire de raccourcis clavier
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const tree = treeRef.current;
    if (!tree) return;

    // Ignore si on est en train d'éditer
    if (tree.isEditing) return;

    const focusedNode = tree.focusedNode;
    
    switch (event.key) {
      case 'F2':
        event.preventDefault();
        if (focusedNode) {
          focusedNode.edit();
        }
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        if (focusedNode && confirm(`Êtes-vous sûr de vouloir supprimer "${focusedNode.data.name}" ?`)) {
          onDelete(focusedNode.data.id);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedNode) {
          if (focusedNode.data.type === 'folder') {
            focusedNode.toggle();
          } else {
            const selectedNode = findNodeById(data, focusedNode.data.id);
            onSelect(selectedNode);
          }
        }
        break;
      case 'ArrowRight':
        if (focusedNode && focusedNode.data.type === 'folder') {
          if (!focusedNode.isOpen) {
            event.preventDefault();
            focusedNode.open();
          }
        }
        break;
      case 'ArrowLeft':
        if (focusedNode && focusedNode.data.type === 'folder') {
          if (focusedNode.isOpen) {
            event.preventDefault();
            focusedNode.close();
          }
        }
        break;
      case ' ':
      case 'Space':
        if (focusedNode && focusedNode.data.type === 'folder') {
          event.preventDefault();
          focusedNode.toggle();
        }
        break;
      case 'n':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (event.shiftKey) {
            // Ctrl+Shift+N : Nouveau dossier
            onCreateFolder(focusedNode?.data.id);
          } else {
            // Ctrl+N : Nouveau fichier
            onCreateFile(focusedNode?.data.id);
          }
        }
        break;
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          tree.selectAll();
        }
        break;
    }
  }, [data, findNodeById, onSelect, onDelete, onCreateFolder, onCreateFile]);

  // Composant pour rendre chaque nœud
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
      node.edit();
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
            node.isOpen ? '📂' : '📁'
          ) : (
            '📄'
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
    <div className={`h-full bg-gray-900 rounded-lg relative ${className}`}>
      {/* En-tête avec boutons de création */}
      <div className="p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-200">Documentation</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onCreateFolder()}
              onContextMenu={(e) => handleContextMenu(e)}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              title="Nouveau dossier (Clic droit pour plus d'options)"
            >
              📁 Dossier
            </button>
            <button
              onClick={() => onCreateFile()}
              onContextMenu={(e) => handleContextMenu(e)}
              className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
              title="Nouveau fichier (Clic droit pour plus d'options)"
            >
              📄 Fichier
            </button>
          </div>
        </div>
      </div>

      {/* Arborescence */}
      <div 
        className="p-2 h-[calc(100%-60px)]"
        onContextMenu={(e) => handleContextMenu(e)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {arboristData.length === 0 ? (
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
                <p>Clic/Entrée/Espace : Ouvrir/fermer • ▶/▼ : Indicateurs visuels</p>
              </div>
            </div>
          </div>
        ) : (
          <Tree
            ref={treeRef}
            data={arboristData}
            openByDefault={false}
            width="100%"
            height={800}
            indent={24}
            rowHeight={32}
            onSelect={handleSelect}
            onCreate={handleCreate}
            onRename={handleRename}
            onMove={handleMove}
            onDelete={handleDelete}
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
        )}
      </div>

      {/* Menu contextuel */}
      {contextMenu.visible && (
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
              {contextMenu.nodeType === 'folder' && (
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
              💡 Double-clic pour éditer • Clic simple pour ouvrir/fermer
              <br />
              🎯 Drag & drop pour déplacer • ▶/▼ pour les dossiers
              <br />
              ⌨️ F2: Renommer • Del: Supprimer • Ctrl+N: Nouveau fichier
            </div>
          </div>
        </div>
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
};

export default DocumentationTree;
