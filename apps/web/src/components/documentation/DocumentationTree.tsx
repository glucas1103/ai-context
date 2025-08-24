'use client'

import { Tree } from 'react-arborist'
import { useState, useCallback } from 'react'
import { DocumentationNode } from '@/lib/types/documentation'
import { 
  HiFolder, 
  HiDocumentText, 
  HiPlus, 
  HiTrash, 
  HiPencil,
  HiChevronRight,
  HiChevronDown
} from 'react-icons/hi'

interface DocumentationTreeProps {
  data: DocumentationNode[]
  onSelect: (node: DocumentationNode) => void
  onCreateFolder: (parentId?: string) => void
  onCreateFile: (parentId?: string) => void
  onRename: (nodeId: string, newName: string) => void
  onDelete: (nodeId: string) => void
  onMove: (nodeId: string, newParentId?: string, newIndex?: number) => void
  selectedNodeId?: string
  className?: string
}

export default function DocumentationTree({
  data,
  onSelect,
  onCreateFolder,
  onCreateFile,
  onRename,
  onDelete,
  onMove,
  selectedNodeId,
  className = ''
}: DocumentationTreeProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleCreate = useCallback(({ parentId, index, type }: any) => {
    if (type === 'folder') {
      onCreateFolder(parentId)
    } else {
      onCreateFile(parentId)
    }
    return null // React Arborist expects a return value
  }, [onCreateFolder, onCreateFile])

  const handleRename = useCallback(({ id, name }: any) => {
    onRename(id, name)
  }, [onRename])

  const handleMove = useCallback(({ dragIds, parentId, index }: any) => {
    if (dragIds.length > 0) {
      onMove(dragIds[0], parentId, index)
    }
  }, [onMove])

  const handleDelete = useCallback(({ ids }: any) => {
    if (ids.length > 0) {
      onDelete(ids[0])
    }
  }, [onDelete])

  const startEditing = useCallback((node: DocumentationNode) => {
    setEditingNodeId(node.id)
    setEditingName(node.name)
  }, [])

  const saveEditing = useCallback(() => {
    if (editingNodeId && editingName.trim()) {
      onRename(editingNodeId, editingName.trim())
    }
    setEditingNodeId(null)
    setEditingName('')
  }, [editingNodeId, editingName, onRename])

  const cancelEditing = useCallback(() => {
    setEditingNodeId(null)
    setEditingName('')
  }, [])

  const renderRow = useCallback(({ node, style, dragHandle }: any) => {
    const isEditing = editingNodeId === node.data.id
    const isSelected = selectedNodeId === node.data.id
    const isFolder = node.data.type === 'folder'

    return (
      <div
        style={style}
        ref={dragHandle}
        className={`
          flex items-center p-2 hover:bg-gray-700 transition-colors cursor-pointer group
          ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-200'}
          ${isEditing ? 'bg-gray-600' : ''}
        `}
        onClick={() => !isEditing && onSelect(node.data)}
      >
        {/* Indentation */}
        <div style={{ width: `${node.level * 20}px` }} />
        
        {/* Toggle arrow for folders */}
        {isFolder && (
          <div className="mr-1">
            {node.isOpen ? (
              <HiChevronDown className="h-4 w-4" />
            ) : (
              <HiChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
        
        {/* Icon */}
        <div className="mr-2">
          {isFolder ? (
            <HiFolder className="h-4 w-4" />
          ) : (
            <HiDocumentText className="h-4 w-4" />
          )}
        </div>
        
        {/* Name */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveEditing()
                } else if (e.key === 'Escape') {
                  cancelEditing()
                }
              }}
              onBlur={saveEditing}
              className="w-full bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          ) : (
            <span className="truncate">{node.data.name}</span>
          )}
        </div>
        
        {/* Actions */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateFolder(node.data.id)
              }}
              className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white"
              title="Nouveau dossier"
            >
              <HiPlus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateFile(node.data.id)
              }}
              className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white"
              title="Nouveau fichier"
            >
              <HiDocumentText className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                startEditing(node.data)
              }}
              className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white"
              title="Renommer"
            >
              <HiPencil className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Êtes-vous sûr de vouloir supprimer "${node.data.name}" ?`)) {
                  onDelete(node.data.id)
                }
              }}
              className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-red-400"
              title="Supprimer"
            >
              <HiTrash className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    )
  }, [editingNodeId, editingName, selectedNodeId, onSelect, onCreateFolder, onCreateFile, onDelete, saveEditing, cancelEditing, startEditing])

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-200">Documentation</h3>
          <div className="flex space-x-1">
            <button
              onClick={() => onCreateFolder()}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              title="Nouveau dossier racine"
            >
              <HiFolder className="h-4 w-4" />
            </button>
            <button
              onClick={() => onCreateFile()}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              title="Nouveau fichier racine"
            >
              <HiDocumentText className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="max-h-[600px] overflow-y-auto">
        {data.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <HiFolder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune documentation</p>
            <p className="text-xs mt-1">Créez votre premier dossier ou fichier</p>
          </div>
        ) : (
          <Tree
            data={data}
            onCreate={handleCreate}
            onRename={handleRename}
            onMove={handleMove}
            onDelete={handleDelete}
            renderRow={renderRow}
            rowHeight={40}
            indent={20}
            overscanCount={10}
            className="text-sm"
          />
        )}
      </div>
    </div>
  )
}
