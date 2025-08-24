'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Tree, TreeApi } from 'react-arborist';
import { DocumentationNode, ArboristNodeData, DocumentationCRUDActions } from '@/lib/types/documentation';

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
  const [isCreating, setIsCreating] = useState<{ type: 'folder' | 'file' | null; parentId?: string }>({ type: null });
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

  // Gestionnaires d'événements
  const handleSelect = useCallback((nodes: ArboristNodeData[]) => {
    if (nodes.length > 0) {
      const selectedNode = findNodeById(data, nodes[0].id);
      onSelect(selectedNode);
    } else {
      onSelect(null);
    }
  }, [data, findNodeById, onSelect]);

  const handleCreate = useCallback(({ parentId, index, type }: { parentId?: string; index?: number; type?: string }) => {
    if (type === 'folder') {
      onCreateFolder(parentId);
    } else {
      onCreateFile(parentId);
    }
  }, [onCreateFolder, onCreateFile]);

  const handleRename = useCallback(({ id, name }: { id: string; name: string }) => {
    onRename(id, name);
  }, [onRename]);

  const handleMove = useCallback(({ dragIds, parentId, index }: { dragIds: string[]; parentId?: string; index: number }) => {
    onMove(dragIds, parentId, index);
  }, [onMove]);

  const handleDelete = useCallback(({ ids }: { ids: string[] }) => {
    ids.forEach(id => onDelete(id));
  }, [onDelete]);

  // Composant pour rendre chaque nœud
  const NodeRenderer = ({ node, style, dragHandle }: any) => {
    const [showActions, setShowActions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(node.data.name);

    const handleStartEdit = () => {
      setIsEditing(true);
      setEditName(node.data.name);
    };

    const handleConfirmEdit = () => {
      if (editName.trim() && editName.trim() !== node.data.name) {
        onRename(node.data.id, editName.trim());
      }
      setIsEditing(false);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditName(node.data.name);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleConfirmEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    };

    return (
      <div
        style={style}
        ref={dragHandle}
        className={`flex items-center group px-2 py-1 rounded cursor-pointer transition-colors ${
          node.isSelected 
            ? 'bg-blue-600 text-white' 
            : 'hover:bg-gray-700 text-gray-300'
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={() => handleSelect([node.data])}
      >
        {/* Icône */}
        <span className="mr-2 text-lg">
          {node.data.type === 'folder' ? (node.isOpen ? '📂' : '📁') : '📄'}
        </span>

        {/* Nom (éditable ou statique) */}
        {isEditing ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleConfirmEdit}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm">{node.data.name}</span>
        )}

        {/* Actions (visibles au survol) */}
        {showActions && !isEditing && (
          <div className="ml-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.data.type === 'folder' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder(node.data.id);
                  }}
                  className="p-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                  title="Nouveau dossier"
                >
                  📁+
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFile(node.data.id);
                  }}
                  className="p-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                  title="Nouveau fichier"
                >
                  📄+
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit();
              }}
              className="p-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
              title="Renommer"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Êtes-vous sûr de vouloir supprimer "${node.data.name}" ?`)) {
                  onDelete(node.data.id);
                }
              }}
              className="p-1 text-xs bg-red-600 hover:bg-red-500 rounded"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-full bg-gray-900 rounded-lg ${className}`}>
      {/* En-tête avec boutons de création */}
      <div className="p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-200">Documentation</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onCreateFolder()}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded"
              title="Nouveau dossier"
            >
              📁 Dossier
            </button>
            <button
              onClick={() => onCreateFile()}
              className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded"
              title="Nouveau fichier"
            >
              📄 Fichier
            </button>
          </div>
        </div>
      </div>

      {/* Arborescence */}
      <div className="p-2 h-[calc(100%-60px)]">
        {arboristData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm text-center">
              Aucun document encore.<br />
              Créez votre premier dossier ou fichier.
            </p>
          </div>
        ) : (
          <Tree
            ref={treeRef}
            data={arboristData}
            openByDefault={false}
            width="100%"
            height={1000}
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
          >
            {NodeRenderer}
          </Tree>
        )}
      </div>
    </div>
  );
};

export default DocumentationTree;
