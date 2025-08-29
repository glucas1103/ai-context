'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { 
  ChatTab, 
  UseChatTabsResult, 
  ChatError, 
  ClaudeCodeContext 
} from '@/types/chat/universal'

// Hook pour la gestion des onglets de chat via chat_sessions

export function useChatTabs(workspaceId: string, userId: string): UseChatTabsResult {
  const [tabs, setTabs] = useState<ChatTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ChatError | null>(null)
  
  const supabase = createClient()

  // Charger les onglets depuis Supabase (directement depuis chat_sessions)
  const loadTabs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('📥 loadTabs appelé pour:', { workspaceId, userId })

      // Charger les sessions qui servent d'onglets depuis Supabase
      const { data: sessions, error: supabaseError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .order('tab_order', { ascending: true, nullsFirst: false })

      if (supabaseError) {
        throw new Error(`Erreur Supabase: ${supabaseError.message}`)
      }

      // Convertir les sessions en onglets (interface simplifiée)
      const convertedTabs: ChatTab[] = (sessions || []).map((session, index) => ({
        id: session.id,
        sessionId: session.id,
        title: session.title || `Conversation ${index + 1}`,
        type: (session.agent_id as 'analysis' | 'documentation') || 'analysis',
        isActive: session.is_active || false,
        isDirty: session.is_dirty || false,
        lastActivity: new Date(session.updated_at || session.created_at),
        context: session.context as ClaudeCodeContext || {},
        tabOrder: session.tab_order || index
      }))

      console.log('📥 Sessions chargées:', sessions?.length || 0, 'sessions trouvées')
      console.log('📥 Onglets convertis:', convertedTabs.length)

      setTabs(convertedTabs)
      
      // Définir l'onglet actif SEULEMENT s'il y en a un marqué comme actif
      const activeTab = convertedTabs.find(tab => tab.isActive)
      if (activeTab) {
        console.log('📥 Onglet actif trouvé:', activeTab.id)
        setActiveTabId(activeTab.id)
      } else {
        console.log('📥 Aucun onglet actif - PAS de création automatique')
        // PAS d'activation automatique - l'utilisateur doit créer ou choisir un onglet
        setActiveTabId(null)
      }

    } catch (err) {
      setError({
        code: 'LOAD_TABS_ERROR',
        message: err instanceof Error ? err.message : 'Erreur lors du chargement des onglets'
      })
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, userId, supabase])

  // Note: Plus besoin de LocalStorage car tout est persisté dans Supabase

  // Ajouter un nouvel onglet (crée une nouvelle chat_session)
  const addTab = useCallback(async (
    context?: ClaudeCodeContext, 
    type: 'analysis' | 'documentation' | 'custom' = 'analysis'
  ): Promise<string> => {
    try {
      setError(null)
      
      // console.log('🔥 CRÉATION DE SESSION DEMANDÉE - addTab appelé:', { type, workspaceId, userId })
      // console.trace('🔥 Stack trace de la création de session:')
      
      const newTabOrder = Math.max(...tabs.map(t => t.tabOrder), 0) + 1
      const title = `${type === 'analysis' ? 'Analyse' : type === 'documentation' ? 'Documentation' : 'Conversation'} ${newTabOrder}`

      console.log('🔥 Insertion dans chat_sessions:', { title, type, newTabOrder })

      // Créer une nouvelle session dans Supabase (pas besoin de table séparée)
      const { data: session, error: supabaseError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          agent_id: type,
          title,
          context: context || {},
          tab_order: newTabOrder,
          is_active: false,
          is_dirty: false
        })
        .select()
        .single()

      if (supabaseError) {
        throw new Error(`Erreur lors de la création: ${supabaseError.message}`)
      }

      // Ajouter optimistiquement à l'état local
      const newTab: ChatTab = {
        id: session.id,
        sessionId: session.id,
        title,
        type,
        isActive: false,
        isDirty: false,
        lastActivity: new Date(),
        context: context || {},
        tabOrder: newTabOrder
      }
      
      setTabs(prevTabs => [...prevTabs, newTab])

      return session.id
    } catch (err) {
      const error: ChatError = {
        code: 'ADD_TAB_ERROR',
        message: err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'onglet'
      }
      setError(error)
      throw error
    }
  }, [tabs, supabase, userId, workspaceId, loadTabs])

  // Changer d'onglet actif
  const switchTab = useCallback(async (tabId: string) => {
    try {
      setError(null)

      // Mise à jour optimiste de l'état local d'abord
      setActiveTabId(tabId)
      setTabs(prevTabs => 
        prevTabs.map(tab => ({ 
          ...tab, 
          isActive: tab.id === tabId 
        }))
      )

      // Désactiver tous les onglets dans Supabase
      await supabase
        .from('chat_sessions')
        .update({ is_active: false })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)

      // Activer l'onglet sélectionné
      await supabase
        .from('chat_sessions')
        .update({ is_active: true })
        .eq('id', tabId)

    } catch (err) {
      // En cas d'erreur, recharger depuis la DB
      loadTabs()
      setError({
        code: 'SWITCH_TAB_ERROR',
        message: err instanceof Error ? err.message : 'Erreur lors du changement d\'onglet'
      })
    }
  }, [supabase, workspaceId, userId, loadTabs])

  // Fermer un onglet
  const closeTab = useCallback(async (tabId: string): Promise<void> => {
    try {
      setError(null)

      // Supprimer de Supabase
      const { error: supabaseError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', tabId)

      if (supabaseError) {
        throw new Error(`Erreur Supabase: ${supabaseError.message}`)
      }

      // Mise à jour optimiste de l'état local
      const remainingTabs = tabs.filter(tab => tab.id !== tabId)
      setTabs(remainingTabs)
      
      // Si l'onglet fermé était actif et qu'il reste des onglets, activer le premier
      if (activeTabId === tabId && remainingTabs.length > 0) {
        await switchTab(remainingTabs[0].id)
      } else if (activeTabId === tabId) {
        setActiveTabId(null)
      }

    } catch (err) {
      setError({
        code: 'CLOSE_TAB_ERROR',
        message: err instanceof Error ? err.message : 'Erreur lors de la fermeture de l\'onglet'
      })
    }
  }, [supabase, tabs, activeTabId, switchTab, loadTabs])

  // Renommer un onglet
  const renameTab = useCallback(async (tabId: string, title: string) => {
    try {
      setError(null)

      // Mettre à jour dans Supabase
      const { error: supabaseError } = await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', tabId)

      if (supabaseError) {
        throw new Error(`Erreur Supabase: ${supabaseError.message}`)
      }

      // Mise à jour optimiste de l'état local
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === tabId ? { ...tab, title } : tab
        )
      )

    } catch (err) {
      setError({
        code: 'RENAME_TAB_ERROR',
        message: err instanceof Error ? err.message : 'Erreur lors du renommage'
      })
    }
  }, [supabase, loadTabs])

  // Dupliquer un onglet
  const duplicateTab = useCallback(async (tabId: string): Promise<string> => {
    const tabToDuplicate = tabs.find(tab => tab.id === tabId)
    if (!tabToDuplicate) {
      throw new Error('Onglet introuvable')
    }

    return addTab(tabToDuplicate.context, tabToDuplicate.type)
  }, [tabs, addTab])

  // Marquer un onglet comme modifié
  const markTabDirty = useCallback(async (tabId: string, isDirty: boolean) => {
    try {
      // Mettre à jour dans Supabase
      await supabase
        .from('chat_sessions')
        .update({ is_dirty: isDirty })
        .eq('id', tabId)

      // Mettre à jour l'état local optimiste
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === tabId ? { ...tab, isDirty } : tab
        )
      )

    } catch (err) {
      console.warn('Erreur lors de la mise à jour du statut dirty:', err)
    }
  }, [supabase])

  // Mettre à jour l'activité d'un onglet
  const updateTabActivity = useCallback(async (tabId: string) => {
    try {
      const now = new Date()
      
      // Mettre à jour dans Supabase
      await supabase
        .from('chat_sessions')
        .update({ updated_at: now.toISOString() })
        .eq('id', tabId)

      // Mettre à jour l'état local optimiste
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === tabId ? { ...tab, lastActivity: now } : tab
        )
      )

    } catch (err) {
      console.warn('Erreur lors de la mise à jour de l\'activité:', err)
    }
  }, [supabase])

  // Charger les onglets au démarrage SEULEMENT
  useEffect(() => {
    if (workspaceId && userId) {
      loadTabs()
    }
  }, [workspaceId, userId]) // Supprimer loadTabs des dépendances pour éviter les boucles

  // Retourner un état vide si les paramètres ne sont pas fournis
  if (!workspaceId || !userId) {
    return {
      tabs: [],
      activeTab: null,
      activeTabId: null,
      isLoading: false,
      error: null,
      addTab: async () => '',
      switchTab: async () => {},
      closeTab: async () => {},
      renameTab: async () => {},
      duplicateTab: async () => '',
      markTabDirty: async () => {},
      updateTabActivity: async () => {}
    }
  }

  // Onglet actif
  const activeTab = tabs.find(tab => tab.id === activeTabId) || null

  return {
    tabs,
    activeTab,
    activeTabId,
    isLoading,
    error,
    addTab,
    switchTab,
    closeTab,
    renameTab,
    duplicateTab,
    markTabDirty,
    updateTabActivity
  }
}
