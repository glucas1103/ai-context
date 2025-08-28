/**
 * Tests pour UniversalChatPanel - Story 1.6.1 Phase 5
 * Tests unitaires du composant principal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UniversalChatPanel from '@/components/ui/universal/UniversalChatPanel';
import { ChatMessage } from '@/types/chat/universal';

// Mock des dépendances problématiques
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: React.ReactNode }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

jest.mock('react-syntax-highlighter', () => ({
  Prism: {
    SyntaxHighlighter: ({ children }: { children: React.ReactNode }) => (
      <pre data-testid="syntax-highlighter">{children}</pre>
    )
  }
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {}
}));

// Mock des hooks
jest.mock('@/hooks/useChatSession', () => ({
  useChatSession: jest.fn(() => ({
    session: {
      id: 'test-session-123',
      workspaceId: 'test-workspace',
      context: {},
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: jest.fn(),
    clearMessages: jest.fn(),
    createSession: jest.fn(),
    updateContext: jest.fn()
  }))
}));

// Mock du service de chat
jest.mock('@/lib/services/chatService', () => ({
  chatService: {
    createSession: jest.fn(),
    addMessage: jest.fn(),
    getMessages: jest.fn(),
    updateSession: jest.fn()
  }
}));

describe('UniversalChatPanel', () => {
  const defaultProps = {
    workspaceId: 'test-workspace',
    showHeader: true,
    showControls: true,
    autoScroll: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait afficher le composant correctement', () => {
    render(<UniversalChatPanel {...defaultProps} />);
    
    // Vérifier que l'en-tête est affiché (utiliser un texte plus spécifique)
    expect(screen.getByText('Claude Analyste')).toBeInTheDocument();
    
    // Vérifier que la zone de saisie est présente
    expect(screen.getByPlaceholderText(/Posez une question/)).toBeInTheDocument();
  });

  it('devrait afficher le contexte sélectionné quand selectedItem est fourni', () => {
    const selectedItem = {
      id: 'file-1',
      name: 'test.ts',
      path: '/src/test.ts',
      type: 'file' as const
    };

    render(
      <UniversalChatPanel 
        {...defaultProps} 
        selectedItem={selectedItem}
      />
    );
    
    expect(screen.getByText('test.ts')).toBeInTheDocument();
    expect(screen.getByText('/src/test.ts')).toBeInTheDocument();
  });

  it('devrait afficher l\'état vide quand aucun message n\'est présent', () => {
    render(<UniversalChatPanel {...defaultProps} />);
    
    expect(screen.getByText(/Bonjour !/)).toBeInTheDocument();
    expect(screen.getByText(/assistant IA spécialisé/)).toBeInTheDocument();
  });

  it('devrait masquer l\'en-tête quand showHeader est false', () => {
    render(
      <UniversalChatPanel 
        {...defaultProps} 
        showHeader={false}
      />
    );
    
    // L'en-tête ne devrait pas être visible
    expect(screen.queryByText(/Claude Analyste/)).not.toBeInTheDocument();
  });

  it('devrait masquer les contrôles quand showControls est false', () => {
    render(
      <UniversalChatPanel 
        {...defaultProps} 
        showControls={false}
      />
    );
    
    // Les contrôles ne devraient pas être visibles
    expect(screen.queryByTitle(/Effacer la conversation/)).not.toBeInTheDocument();
  });

  it('devrait gérer les thèmes correctement', () => {
    const { rerender } = render(
      <UniversalChatPanel 
        {...defaultProps} 
        theme="dark"
      />
    );
    
    // Vérifier que le composant est rendu
    expect(screen.getByPlaceholderText(/Posez une question/)).toBeInTheDocument();
    
    rerender(
      <UniversalChatPanel 
        {...defaultProps} 
        theme="light"
      />
    );
    
    // Vérifier que le composant est toujours rendu avec le thème clair
    expect(screen.getByPlaceholderText(/Posez une question/)).toBeInTheDocument();
  });

  it('devrait appeler onError quand une erreur survient', async () => {
    const onError = jest.fn();
    const mockError = {
      code: 'TEST_ERROR',
      message: 'Erreur de test'
    };

    // Mock du hook avec erreur
    const mockUseChatSession = jest.requireMock('@/hooks/useChatSession').useChatSession;
    mockUseChatSession.mockReturnValue({
      session: null,
      messages: [],
      isLoading: false,
      error: mockError,
      sendMessage: jest.fn(),
      clearMessages: jest.fn(),
      createSession: jest.fn(),
      updateContext: jest.fn()
    });

    render(
      <UniversalChatPanel 
        {...defaultProps} 
        onError={onError}
      />
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  it('devrait permettre la saisie et l\'envoi de messages', async () => {
    const mockSendMessage = jest.fn();
    const mockUseChatSession = jest.requireMock('@/hooks/useChatSession').useChatSession;
    
    mockUseChatSession.mockReturnValue({
      session: { id: 'test-session' },
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearMessages: jest.fn(),
      createSession: jest.fn(),
      updateContext: jest.fn()
    });

    render(<UniversalChatPanel {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/Posez une question/);
    const sendButton = screen.getByRole('button', { name: /Envoyer/ });
    
    // Saisir un message
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    // Envoyer le message
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });
});
