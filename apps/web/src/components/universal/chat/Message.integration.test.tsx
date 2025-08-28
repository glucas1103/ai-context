/**
 * Test d'intégration pour le composant Message - Story 1.6.1
 * Test avec des données réelles simulées venant de Supabase
 */

import { render, screen } from '@testing-library/react';
import Message from './Message';
import { ChatMessage } from '@/types/chat/universal';

// Mock des dépendances
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => (
    <pre data-testid="syntax-highlighter">{children}</pre>
  )
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {}
}));

describe('Message Component - Integration Tests', () => {
  test('should handle real Supabase data with string timestamps', () => {
    // Simuler des données venant de Supabase
    const supabaseMessage: ChatMessage = {
      id: 'msg_123',
      role: 'assistant',
      content: 'Bonjour ! Je suis Claude Code, votre assistant IA.',
      timestamp: '2024-12-19T15:30:45.123Z', // String timestamp de Supabase
      status: 'sent',
      metadata: {
        claudeActions: ['code_analysis'],
        filesAnalyzed: ['src/main.ts'],
        toolsUsed: ['file_search', 'code_analysis']
      }
    };
    
    render(<Message message={supabaseMessage} />);
    
    // Vérifier que le message s'affiche correctement
    expect(screen.getByText('Bonjour ! Je suis Claude Code, votre assistant IA.')).toBeInTheDocument();
    expect(screen.getByText('🤖')).toBeInTheDocument(); // Icône assistant
    expect(screen.getByText('assistant')).toBeInTheDocument();
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument(); // Timestamp formaté
  });

  test('should handle message with null timestamp from corrupted data', () => {
    // Simuler des données corrompues de Supabase
    const corruptedMessage: ChatMessage = {
      id: 'msg_456',
      role: 'user',
      content: 'Qui es-tu ?',
      timestamp: null, // Timestamp corrompu
      status: 'sent'
    };
    
    render(<Message message={corruptedMessage} />);
    
    // Vérifier que l'erreur est gérée gracieusement
    expect(screen.getByText('Qui es-tu ?')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument(); // Icône utilisateur
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('--:--')).toBeInTheDocument(); // Timestamp par défaut
  });

  test('should handle message with undefined timestamp', () => {
    // Simuler des données avec timestamp manquant
    const incompleteMessage: ChatMessage = {
      id: 'msg_789',
      role: 'system',
      content: 'Session démarrée',
      timestamp: undefined, // Timestamp manquant
      status: 'sent'
    };
    
    render(<Message message={incompleteMessage} />);
    
    // Vérifier que l'erreur est gérée gracieusement
    expect(screen.getByText('Session démarrée')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument(); // Icône système
    expect(screen.getByText('system')).toBeInTheDocument();
    expect(screen.getByText('--:--')).toBeInTheDocument(); // Timestamp par défaut
  });

  test('should handle message with invalid date string', () => {
    // Simuler des données avec date invalide
    const invalidDateMessage: ChatMessage = {
      id: 'msg_999',
      role: 'assistant',
      content: 'Réponse avec date invalide',
      timestamp: 'invalid-date-string', // Date invalide
      status: 'sent'
    };
    
    render(<Message message={invalidDateMessage} />);
    
    // Vérifier que l'erreur est gérée gracieusement
    expect(screen.getByText('Réponse avec date invalide')).toBeInTheDocument();
    expect(screen.getByText('🤖')).toBeInTheDocument(); // Icône assistant
    expect(screen.getByText('assistant')).toBeInTheDocument();
    expect(screen.getByText('--:--')).toBeInTheDocument(); // Timestamp par défaut
  });

  test('should handle message with Claude Code metadata', () => {
    // Simuler un message avec métadonnées Claude Code complètes
    const claudeMessage: ChatMessage = {
      id: 'msg_claude_001',
      role: 'assistant',
      content: 'J\'ai analysé votre code et trouvé plusieurs améliorations possibles.',
      timestamp: new Date('2024-12-19T16:45:30Z'),
      status: 'sent',
      metadata: {
        claudeActions: ['code_analysis', 'suggestions'],
        filesAnalyzed: ['src/components/Button.tsx', 'src/utils/helpers.ts'],
        investigationSteps: [
          {
            tool: 'file_search',
            query: 'Button component',
            result: 'Found Button.tsx',
            timestamp: new Date('2024-12-19T16:45:25Z'),
            duration: 150
          }
        ],
        reasoningSteps: [
          {
            step: 1,
            thought: 'Analysing the Button component structure',
            action: 'file_search',
            timestamp: new Date('2024-12-19T16:45:25Z')
          }
        ],
        toolsUsed: ['file_search', 'code_analysis', 'suggestion_engine']
      }
    };
    
    render(<Message message={claudeMessage} />);
    
    // Vérifier que le message s'affiche correctement
    expect(screen.getByText('J\'ai analysé votre code et trouvé plusieurs améliorations possibles.')).toBeInTheDocument();
    expect(screen.getByText('🤖')).toBeInTheDocument(); // Icône assistant
    expect(screen.getByText('assistant')).toBeInTheDocument();
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument(); // Timestamp formaté
    
    // Vérifier que les métadonnées sont affichées (si le composant les affiche)
    // Note: Le composant actuel n'affiche pas les métadonnées dans le test car elles sont mockées
  });

  test('should handle message with different statuses', () => {
    const statuses: Array<{ status: ChatMessage['status']; expectedIcon: string; expectedText: string }> = [
      { status: 'sending', expectedIcon: '⏳', expectedText: 'Envoi en cours...' },
      { status: 'investigating', expectedIcon: '🔍', expectedText: 'Investigation...' },
      { status: 'reasoning', expectedIcon: '🧠', expectedText: 'Raisonnement...' },
      { status: 'error', expectedIcon: '❌', expectedText: 'Erreur' }
    ];

    statuses.forEach(({ status, expectedIcon, expectedText }) => {
      const message: ChatMessage = {
        id: `msg_${status}`,
        role: 'assistant',
        content: `Message avec status ${status}`,
        timestamp: new Date(),
        status
      };

      const { unmount } = render(<Message message={message} />);

      // Vérifier que le status s'affiche correctement
      expect(screen.getByText(expectedIcon)).toBeInTheDocument();
      expect(screen.getByText(expectedText)).toBeInTheDocument();

      unmount();
    });
  });
});
