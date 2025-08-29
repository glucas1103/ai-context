/**
 * Hook Claude Code Ultra-Simple - Story 1.6.2 RÉVISÉ
 * Une seule méthode : sendMessage
 * 
 * PHILOSOPHIE: Claude Code SDK gère tout - nous gérons seulement loading/error
 */

'use client';

import { useState, useCallback } from 'react';
// Import retiré - Claude Code SDK est utilisé côté serveur uniquement

export interface UseSimpleClaudeCodeOptions {
  workspaceId: string;
  sessionId?: string; // Session ID de l'onglet actif
  apiKey?: string;
  model?: 'sonnet' | 'opus' | 'haiku';
}

export interface UseSimpleClaudeCodeResult {
  // État simple
  isLoading: boolean;
  error: string | null;
  
  // Action principale
  sendMessage: (message: string) => Promise<string>;
  
  // Actions spécialisées (utilisent sendMessage en interne)
  analyzeFile: (filePath: string) => Promise<string>;
  generateDocumentation: (query: string) => Promise<string>;
  
  // Nettoyage
  clearError: () => void;
}

/**
 * Hook Claude Code Ultra-Simple
 * 50 lignes au lieu de 426 lignes !
 */
export function useSimpleClaudeCode({
  workspaceId,
  sessionId,
  apiKey,
  model = 'sonnet'
}: UseSimpleClaudeCodeOptions): UseSimpleClaudeCodeResult {
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Méthode principale : Envoyer un message via API route
   * Claude Code SDK est utilisé côté serveur uniquement
   */
  const sendMessage = useCallback(async (message: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/chat/claude-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId, // Session ID de l'onglet actif
          apiKey,
          action: 'chat'
        }),
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' ? 
              errorData.error : 
              errorData.error.message || errorMessage;
          }
        } catch {
          // Si on ne peut pas parser la réponse, garder le message basique
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.success) {
        const errorMsg = typeof data.error === 'string' ? 
          data.error : 
          data.error?.message || 'Erreur serveur';
        throw new Error(errorMsg);
      }

      return data.data.message;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, sessionId, model, apiKey]);

  /**
   * Analyse de fichier (utilise l'API route)
   */
  const analyzeFile = useCallback(async (filePath: string): Promise<string> => {
    return sendMessage(`Analyse ce fichier en détail: ${filePath}`);
  }, [sendMessage]);

  /**
   * Génération de documentation (utilise l'API route)
   */
  const generateDocumentation = useCallback(async (query: string): Promise<string> => {
    return sendMessage(`Génère une documentation structurée pour: ${query}`);
  }, [sendMessage]);

  /**
   * Nettoyer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    sendMessage,
    analyzeFile,
    generateDocumentation,
    clearError
  };
}
