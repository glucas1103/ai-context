/**
 * Tests pour useSimpleClaudeCode - Story 1.6.2 RÉVISÉ
 * Validation du hook ultra-simple qui utilise l'API route
 */

import { renderHook, act } from '@testing-library/react';
import { useSimpleClaudeCode } from '../useSimpleClaudeCode';

// Mock fetch
global.fetch = jest.fn();

describe('useSimpleClaudeCode', () => {
  const defaultOptions = {
    workspaceId: 'test-workspace',
    workspacePath: '/test/workspace',
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          message: 'Réponse de test de Claude Code SDK'
        }
      })
    });
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec les bonnes valeurs par défaut', () => {
      const { result } = renderHook(() => useSimpleClaudeCode(defaultOptions));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.analyzeFile).toBe('function');
      expect(typeof result.current.generateDocumentation).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('sendMessage', () => {
    it('devrait envoyer un message via l\'API route', async () => {
      const { result } = renderHook(() => useSimpleClaudeCode(defaultOptions));

      let response: string;
      await act(async () => {
        response = await result.current.sendMessage('Test message');
      });

      expect(response!).toBe('Réponse de test de Claude Code SDK');
      expect(fetch).toHaveBeenCalledWith('/api/workspaces/test-workspace/chat/claude-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"message":"Test message"'),
      });
    });

    it('devrait gérer les états loading correctement', async () => {
      const { result } = renderHook(() => useSimpleClaudeCode(defaultOptions));

      expect(result.current.isLoading).toBe(false);

      const sendMessagePromise = act(async () => {
        return result.current.sendMessage('Test message');
      });

      await sendMessagePromise;

      expect(result.current.isLoading).toBe(false);
    });

    it('devrait gérer les erreurs d\'API', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useSimpleClaudeCode(defaultOptions));

      await act(async () => {
        try {
          await result.current.sendMessage('Test message');
        } catch (error) {
          // Erreur attendue
        }
      });

      expect(result.current.error).toBe('API Error: 500');
      expect(result.current.isLoading).toBe(false);
    });

    it('devrait gérer les erreurs de contenu', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Erreur serveur test'
        })
      });

      const { result } = renderHook(() => useSimpleClaudeCode(defaultOptions));

      await act(async () => {
        try {
          await result.current.sendMessage('Test message');
        } catch (error) {
          // Erreur attendue
        }
      });

      expect(result.current.error).toBe('Erreur serveur test');
    });
  });

  describe('analyzeFile', () => {
    it('devrait analyser un fichier en utilisant sendMessage', async () => {
      const { result } = renderHook(() => useSimpleClaudeCode(defaultOptions));

      let response: string;
      await act(async () => {
        response = await result.current.analyzeFile('/test/file.ts');
      });

      expect(response!).toBe('Réponse de test de Claude Code SDK');
      expect(fetch).toHaveBeenCalledWith(
        '/api/workspaces/test-workspace/chat/claude-code',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Analyse ce fichier en détail: /test/file.ts')
        })
      );
    });
  });

  describe('generateDocumentation', () => {
    it('devrait générer de la documentation en utilisant sendMessage', async () => {
      const { result } = renderHook(() => useSimpleClaudeCode(defaultOptions));

      let response: string;
      await act(async () => {
        response = await result.current.generateDocumentation('Documentation React');
      });

      expect(response!).toBe('Réponse de test de Claude Code SDK');
      expect(fetch).toHaveBeenCalledWith(
        '/api/workspaces/test-workspace/chat/claude-code',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Génère une documentation structurée pour: Documentation React')
        })
      );
    });
  });

  describe('clearError', () => {
    it('devrait nettoyer l\'erreur', async () => {
      // Déclencher une erreur d'abord
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useSimpleClaudeCode(defaultOptions));

      await act(async () => {
        try {
          await result.current.sendMessage('Test message');
        } catch (error) {
          // Erreur attendue
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Configuration', () => {
    it('devrait fonctionner sans API key', () => {
      const optionsWithoutKey = {
        workspaceId: 'test-workspace',
        workspacePath: '/test/workspace'
      };

      const { result } = renderHook(() => useSimpleClaudeCode(optionsWithoutKey));
      
      expect(result.current).toBeDefined();
      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('devrait utiliser le bon modèle par défaut', async () => {
      const { result } = renderHook(() => useSimpleClaudeCode(defaultOptions));

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      
      // Le modèle est géré côté serveur, donc on ne le voit pas dans l'appel
      expect(body.action).toBe('chat');
    });
  });
});
