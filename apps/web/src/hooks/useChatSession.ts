/**
 * Hook pour la gestion des sessions de chat Claude Code
 * Story 1.6.1 - Phase 1
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ChatSession, 
  ChatMessage, 
  ClaudeCodeContext, 
  ChatError,
  UseChatSessionResult,
  ChatRole,
  ChatStatus
} from '@/types/chat/universal';

export function useChatSession(
  workspaceId: string,
  initialContext?: ClaudeCodeContext,
  sessionId?: string
): UseChatSessionResult {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);

  // Créer une nouvelle session
  const createSession = useCallback(async (context: ClaudeCodeContext): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/workspaces/${workspaceId}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          agentType: 'analysis' // par défaut
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la création de la session');
      }

      const newSession: ChatSession = {
        id: result.data.sessionId,
        workspaceId,
        context,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setSession(newSession);
      setMessages([]);
      
      return result.data.sessionId;
    } catch (err) {
      const chatError: ChatError = {
        code: 'SESSION_CREATE_ERROR',
        message: err instanceof Error ? err.message : 'Erreur inconnue'
      };
      setError(chatError);
      throw chatError;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Envoyer un message
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!session) {
      throw new Error('Aucune session active');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Créer le message utilisateur
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user' as ChatRole,
        content,
        timestamp: new Date(),
        status: 'sending'
      };

      // Ajouter immédiatement le message utilisateur
      setMessages(prev => [...prev, userMessage]);

      // Envoyer à l'API
      const response = await fetch(`/api/workspaces/${workspaceId}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          message: content,
          context: session.context
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // Marquer le message utilisateur comme envoyé
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'sent' as ChatStatus }
          : msg
      ));

      // Traiter la réponse streaming
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Impossible de lire la réponse');
      }

      const decoder = new TextDecoder();
      let assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant' as ChatRole,
        content: '',
        timestamp: new Date(),
        status: 'investigating'
      };

      // Ajouter le message assistant vide
      setMessages(prev => [...prev, assistantMessage]);

      // Lire le stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content_delta') {
                assistantMessage.content += data.delta;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...assistantMessage }
                    : msg
                ));
              } else if (data.type === 'message_complete') {
                assistantMessage.status = 'sent';
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...assistantMessage }
                    : msg
                ));
              }
            } catch (parseError) {
              console.warn('Erreur de parsing du stream:', parseError);
            }
          }
        }
      }

    } catch (err) {
      const chatError: ChatError = {
        code: 'MESSAGE_SEND_ERROR',
        message: err instanceof Error ? err.message : 'Erreur inconnue'
      };
      setError(chatError);
      
      // Marquer le message utilisateur comme erreur
      setMessages(prev => prev.map(msg => 
        msg.role === 'user' && msg.status === 'sending'
          ? { ...msg, status: 'error' as ChatStatus }
          : msg
      ));
      
      throw chatError;
    } finally {
      setIsLoading(false);
    }
  }, [session, workspaceId]);

  // Effacer les messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setLoadedSessionId(null); // Réinitialiser pour permettre le rechargement
  }, []);

  // Mettre à jour le contexte
  const updateContext = useCallback((contextUpdates: Partial<ClaudeCodeContext>) => {
    if (session) {
      const updatedSession = {
        ...session,
        context: { ...session.context, ...contextUpdates },
        updatedAt: new Date()
      };
      setSession(updatedSession);
    }
  }, [session]);

  // Charger une session existante ou créer une nouvelle
  const loadSession = useCallback(async (targetSessionId: string) => {
    // Éviter de recharger la même session
    if (loadedSessionId === targetSessionId) {
      console.log('Session déjà chargée, pas de rechargement:', targetSessionId);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/workspaces/${workspaceId}/chat/sessions/${targetSessionId}`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors du chargement de la session');
      }

      const loadedSession: ChatSession = {
        id: result.data.session.id,
        workspaceId,
        context: result.data.session.context || {},
        messages: result.data.messages || [],
        createdAt: new Date(result.data.session.created_at),
        updatedAt: new Date(result.data.session.updated_at)
      };

      setSession(loadedSession);
      setMessages(result.data.messages || []);
      setLoadedSessionId(targetSessionId);
      
    } catch (err) {
      const chatError: ChatError = {
        code: 'SESSION_LOAD_ERROR',
        message: err instanceof Error ? err.message : 'Erreur inconnue'
      };
      setError(chatError);
      console.error('Erreur lors du chargement de la session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, loadedSessionId]);

  // Charger la session UNIQUEMENT si sessionId est fourni - PAS DE CRÉATION AUTOMATIQUE
  useEffect(() => {
    if (sessionId && workspaceId && sessionId !== loadedSessionId) {
      console.log('Chargement de la session:', sessionId);
      loadSession(sessionId);
    }
    // SUPPRIMÉ : Création automatique de session - uniquement via bouton +
  }, [sessionId, workspaceId, loadedSessionId]);

  // Retourner un état vide si workspaceId n'est pas fourni
  if (!workspaceId) {
    return {
      session: null,
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: async () => {},
      clearMessages: () => {},
      createSession: async () => '',
      updateContext: () => {},
      loadSession: async () => {}
    }
  }

  return {
    session,
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    createSession,
    updateContext,
    loadSession
  };
}
