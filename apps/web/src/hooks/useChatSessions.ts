'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatSession } from '@/types/claude-code';

interface UseChatSessionsProps {
  workspaceId: string;
}

interface UseChatSessionsReturn {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  createSession: (name: string) => Promise<ChatSession | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => Promise<boolean>;
  setActiveSession: (sessionId: string | null) => void;
  refreshSessions: () => Promise<void>;
}

export function useChatSessions({ workspaceId }: UseChatSessionsProps): UseChatSessionsReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les sessions
  const refreshSessions = useCallback(async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/chat-sessions`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);

      // Si aucune session active et qu'il y a des sessions, sélectionner la première
      if (!activeSessionId && data.sessions?.length > 0) {
        setActiveSessionId(data.sessions[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, activeSessionId]);

  // Créer une nouvelle session
  const createSession = useCallback(async (name: string): Promise<ChatSession | null> => {
    if (!workspaceId || !name.trim()) return null;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/chat-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session');
      }

      const data = await response.json();
      const newSession = data.session;

      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      return null;
    }
  }, [workspaceId]);

  // Supprimer une session
  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!workspaceId || !sessionId) return false;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/chat-sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la session');
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // Si la session supprimée était active, sélectionner une autre
      if (activeSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      return false;
    }
  }, [workspaceId, activeSessionId, sessions]);

  // Mettre à jour une session
  const updateSession = useCallback(async (sessionId: string, updates: Partial<ChatSession>): Promise<boolean> => {
    if (!workspaceId || !sessionId) return false;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/chat-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la session');
      }

      const data = await response.json();
      const updatedSession = data.session;

      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      return false;
    }
  }, [workspaceId]);

  // Définir la session active
  const setActiveSession = useCallback((sessionId: string | null) => {
    setActiveSessionId(sessionId);
  }, []);

  // Charger les sessions au montage
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);



  return {
    sessions,
    activeSessionId,
    isLoading,
    error,
    createSession,
    deleteSession,
    updateSession,
    setActiveSession,
    refreshSessions,
  };
}
