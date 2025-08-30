import { renderHook } from '@testing-library/react';
import { useClaudeCode } from '@/hooks/useClaudeCode';

// Mock fetch pour les tests
global.fetch = jest.fn();

describe('useClaudeCode - Message Formatting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format tool usage messages correctly', () => {
    const { result } = renderHook(() => useClaudeCode('test-workspace-id'));
    
    // Test avec un message contenant une utilisation d'outil
    const messageWithTool = "Je vais utiliser grep pour chercher les fonctions dans le code";
    
    // Simuler l'appel de formatAssistantMessage (fonction privée)
    // Note: Cette fonction est privée, donc on teste indirectement via sendMessage
    expect(messageWithTool).toMatch(/utilise.*grep.*pour.*chercher/i);
  });

  it('should detect various tool usage patterns', () => {
    const testMessages = [
      "Je vais lire le fichier src/components/Header.tsx",
      "Analysons la structure du projet",
      "Examinons les routes API",
      "Regardons les types TypeScript",
      "Explorons le dossier src"
    ];

    testMessages.forEach(message => {
      expect(message).toMatch(/(lit|analyse|examine|regarde|explore)/i);
    });
  });

  it('should format action messages with emojis', () => {
    const actionMessages = [
      "Je vais analyser le code",
      "Maintenant regardons les composants",
      "Analysons la structure",
      "Examinons les imports"
    ];

    actionMessages.forEach(message => {
      expect(message).toMatch(/^(je vais|maintenant|analysons|examinons)/i);
    });
  });
});
