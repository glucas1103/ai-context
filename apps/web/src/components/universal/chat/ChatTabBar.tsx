'use client'

import React, { useState } from 'react'
import type { ChatTab } from '@/types/chat/universal'

interface ChatTabBarProps {
  tabs: ChatTab[]
  activeTabId: string | null
  onTabSwitch: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onTabAdd: () => void
  onTabRename: (tabId: string, title: string) => void
  className?: string
}

export function ChatTabBar({
  tabs,
  activeTabId,
  onTabSwitch,
  onTabClose,
  onTabAdd,
  onTabRename,
  className = ''
}: ChatTabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const startEditing = (tab: ChatTab) => {
    setEditingTabId(tab.id)
    setEditingTitle(tab.title)
  }

  const saveEdit = () => {
    if (editingTabId && editingTitle.trim()) {
      onTabRename(editingTabId, editingTitle.trim())
    }
    setEditingTabId(null)
    setEditingTitle('')
  }

  const cancelEdit = () => {
    setEditingTabId(null)
    setEditingTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const getTabIcon = (type: ChatTab['type']) => {
    switch (type) {
      case 'analysis':
        return '🔍'
      case 'documentation':
        return '📝'
      case 'custom':
        return '💬'
      default:
        return '💬'
    }
  }

  return (
    <div className={`flex items-center bg-gray-800 border-b border-gray-700 ${className}`}>
      {/* Liste des onglets avec largeur minimale et défilement horizontal */}
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 min-w-0">
        <div className="flex items-center" style={{ minWidth: 'fit-content' }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`
                group relative flex items-center px-3 py-2 border-r border-gray-700 cursor-pointer
                transition-colors duration-200 flex-shrink-0
                ${tab.id === activeTabId 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-750'
                }
              `}
              style={{ minWidth: '120px', maxWidth: '200px' }}
              onClick={() => onTabSwitch(tab.id)}
            >
            {/* Icône du type d'onglet */}
            <span className="text-sm mr-2 flex-shrink-0">
              {getTabIcon(tab.type)}
            </span>

            {/* Titre de l'onglet */}
            <div className="flex-1 min-w-0 max-w-[120px]">
              {editingTabId === tab.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-sm focus:outline-none"
                  autoFocus
                />
              ) : (
                <span className="text-sm truncate block" title={tab.title}>
                  {tab.title}
                  {tab.isDirty && (
                    <span className="text-yellow-400 ml-1">•</span>
                  )}
                </span>
              )}
            </div>

            {/* Actions de l'onglet */}
            <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Bouton d'édition */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startEditing(tab)
                }}
                className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-white"
                title="Renommer l'onglet"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {/* Bouton de fermeture */}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(tab.id)
                  }}
                  className="p-1 rounded hover:bg-red-600 text-gray-400 hover:text-white ml-1"
                  title="Fermer l'onglet"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Indicateur d'onglet actif */}
            {tab.id === activeTabId && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
            </div>
          ))}
        </div>
      </div>

      {/* Bouton d'ajout d'onglet */}
      <button
        onClick={onTabAdd}
        className="flex items-center px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-l border-gray-700"
        title="Ajouter un nouvel onglet"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Menu des options (futur) */}
      <button
        className="flex items-center px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border-l border-gray-700"
        title="Options"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </button>
    </div>
  )
}

// Composant d'onglet individuel pour une utilisation séparée
interface ChatTabProps {
  tab: ChatTab
  isActive: boolean
  onSelect: () => void
  onClose: () => void
  onRename: (title: string) => void
  className?: string
}

export function ChatTabItem({
  tab,
  isActive,
  onSelect,
  onClose,
  onRename,
  className = ''
}: ChatTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(tab.title)

  const handleSave = () => {
    onRename(title.trim())
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTitle(tab.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div
      className={`
        group relative flex items-center px-3 py-2 cursor-pointer
        transition-colors duration-200
        ${isActive 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }
        ${className}
      `}
      onClick={onSelect}
    >
      {/* Indicateur de type */}
      <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
        tab.type === 'analysis' ? 'bg-green-400' : 
        tab.type === 'documentation' ? 'bg-blue-400' : 'bg-purple-400'
      }`} />

      {/* Titre */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm focus:outline-none"
            autoFocus
          />
        ) : (
          <span className="text-sm truncate block">
            {tab.title}
            {tab.isDirty && <span className="text-yellow-400 ml-1">•</span>}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          className="p-1 rounded hover:bg-gray-500 text-gray-400 hover:text-white"
          title="Renommer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="p-1 rounded hover:bg-red-500 text-gray-400 hover:text-white ml-1"
          title="Fermer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
