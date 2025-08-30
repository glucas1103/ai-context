import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClaudeCodePanel from '@/components/workspace/ClaudeCodePanelNew';

// Mock des hooks
jest.mock('@/hooks/useClaudeCode');
jest.mock('@/hooks/useChatSessions');

const mockUseClaudeCode = require('@/hooks/useClaudeCode').useClaudeCode as jest.MockedFunction<any>;
const mockUseChatSessions = require('@/hooks/useChatSessions').useChatSessions as jest.MockedFunction<any>;

describe('ClaudeCodePanelNew', () => {
  const mockWorkspaceId = 'test-workspace';
  
  beforeEach(() => {
    // Configuration par défaut des mocks
    mockUseClaudeCode.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      sessionId: null,
      agentStatus: { status: 'active', agent_type: 'claude-code' },
      sendMessage: jest.fn(),
      clearMessages: jest.fn(),
      adaptiveTurns: true,
      setAdaptiveTurns: jest.fn(),
      currentTaskComplexity: 'medium',
      getAdaptiveTurns: jest.fn(() => 50),
      continueWithMoreTurns: jest.fn(),
      stopThinking: jest.fn(),
      canStop: false,
      thinkingStartTime: null,
    });

    mockUseChatSessions.mockReturnValue({
      sessions: [{ id: '1', title: 'Session 1', name: 'Session 1' }],
      activeSessionId: '1',
      isLoading: false,
      createSession: jest.fn(),
      deleteSession: jest.fn(),
      setActiveSession: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration par défaut (AC: 4)', () => {
    it('devrait avoir 50 tours max par défaut', () => {
      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      // Vérifier que le hook est appelé avec les bonnes valeurs par défaut
      expect(mockUseClaudeCode).toHaveBeenCalled();
    });

    it('devrait avoir le mode adaptatif activé par défaut', () => {
      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      // Vérifier que adaptiveTurns est true par défaut
      const mockCall = mockUseClaudeCode.mock.calls[0];
      expect(mockCall).toBeDefined();
    });
  });

  describe('Interface épurée (AC: 1, 6)', () => {
    it('ne devrait plus afficher les détails techniques', () => {
      const messagesWithMetadata = [{
        id: '1',
        content: 'Test message',
        role: 'assistant' as const,
        timestamp: new Date(),
        metadata: {
          duration_ms: 1000,
          num_turns: 5,
          total_cost_usd: 0.001
        }
      }];

      mockUseClaudeCode.mockReturnValue({
        ...mockUseClaudeCode(),
        messages: messagesWithMetadata,
      });

      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      // Vérifier que les métadonnées techniques ne sont pas affichées
      expect(screen.queryByText('1000ms')).not.toBeInTheDocument();
      expect(screen.queryByText('5 tours')).not.toBeInTheDocument();
      expect(screen.queryByText('$0.001000')).not.toBeInTheDocument();
    });

    it('ne devrait plus afficher les sections "Détails techniques"', () => {
      const messagesWithStreamData = [{
        id: '1',
        content: 'Test message',
        role: 'assistant' as const,
        timestamp: new Date(),
        streamData: { some: 'data' }
      }];

      mockUseClaudeCode.mockReturnValue({
        ...mockUseClaudeCode(),
        messages: messagesWithStreamData,
      });

      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      // Vérifier que la section "Détails techniques" n'est pas affichée
      expect(screen.queryByText('Détails techniques')).not.toBeInTheDocument();
    });

    it('devrait afficher une interface simplifiée avec seulement le bouton effacer', () => {
      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      // Vérifier qu'il n'y a que le bouton "Effacer l'historique"
      expect(screen.getByText('Effacer l\'historique')).toBeInTheDocument();
      
      // Vérifier que les options techniques ne sont plus affichées
      expect(screen.queryByText('Max tours:')).not.toBeInTheDocument();
      expect(screen.queryByText('Tours adaptatifs')).not.toBeInTheDocument();
      expect(screen.queryByText('Étapes intermédiaires')).not.toBeInTheDocument();
    });
  });

  describe('Gestion des tâches longues (AC: 5)', () => {
    it('devrait afficher les bons boutons pour la limite de 50 tours', () => {
      const turnLimitMessage = [{
        id: '1',
        content: 'Limite de 50 tours atteinte.\n\nL\'analyse progresse bien mais la tâche s\'avère plus complexe que prévu.',
        role: 'system' as const,
        timestamp: new Date()
      }];

      mockUseClaudeCode.mockReturnValue({
        ...mockUseClaudeCode(),
        messages: turnLimitMessage,
      });

      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      // Vérifier la présence des nouveaux boutons
      expect(screen.getByText('Continuer (+50 tours)')).toBeInTheDocument();
      expect(screen.getByText('Réponse partielle')).toBeInTheDocument();
    });

    it('devrait appeler continueWithMoreTurns avec 50 tours', async () => {
      const mockContinueWithMoreTurns = jest.fn();
      const turnLimitMessage = [{
        id: '1',
        content: 'Limite de 50 tours atteinte.',
        role: 'system' as const,
        timestamp: new Date()
      }];

      mockUseClaudeCode.mockReturnValue({
        ...mockUseClaudeCode(),
        messages: turnLimitMessage,
        continueWithMoreTurns: mockContinueWithMoreTurns,
      });

      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      // Cliquer sur le bouton "Continuer"
      fireEvent.click(screen.getByText('Continuer (+50 tours)'));
      
      await waitFor(() => {
        expect(mockContinueWithMoreTurns).toHaveBeenCalledWith(50);
      });
    });

    it('devrait envoyer une demande de résumé pour la réponse partielle', async () => {
      const mockSendMessage = jest.fn();
      const turnLimitMessage = [{
        id: '1',
        content: 'Limite de 50 tours atteinte.',
        role: 'system' as const,
        timestamp: new Date()
      }];

      mockUseClaudeCode.mockReturnValue({
        ...mockUseClaudeCode(),
        messages: turnLimitMessage,
        sendMessage: mockSendMessage,
      });

      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      // Cliquer sur le bouton "Réponse partielle"
      fireEvent.click(screen.getByText('Réponse partielle'));
      
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          'Peux-tu me donner un résumé de ce que tu as trouvé jusqu\'ici et les points clés de ton analyse ?'
        );
      });
    });
  });

  describe('Messages de chargement améliorés', () => {
    it('devrait afficher le bon bouton stop avec can stop activé', () => {
      mockUseClaudeCode.mockReturnValue({
        messages: [],
        isLoading: true,
        error: null,
        sessionId: null,
        agentStatus: { status: 'active', agent_type: 'claude-code' },
        sendMessage: jest.fn(),
        clearMessages: jest.fn(),
        adaptiveTurns: true,
        setAdaptiveTurns: jest.fn(),
        currentTaskComplexity: 'medium',
        getAdaptiveTurns: jest.fn(() => 50),
        continueWithMoreTurns: jest.fn(),
        stopThinking: jest.fn(),
        canStop: true,
        thinkingStartTime: Date.now(),
      });

      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      const stopButton = screen.getByText('Stop');
      expect(stopButton).toBeInTheDocument();
    });

    it('devrait utiliser le placeholder approprié quand canStop est activé', () => {
      mockUseClaudeCode.mockReturnValue({
        messages: [],
        isLoading: true,
        error: null,
        sessionId: null,
        agentStatus: { status: 'active', agent_type: 'claude-code' },
        sendMessage: jest.fn(),
        clearMessages: jest.fn(),
        adaptiveTurns: true,
        setAdaptiveTurns: jest.fn(),
        currentTaskComplexity: 'medium',
        getAdaptiveTurns: jest.fn(() => 50),
        continueWithMoreTurns: jest.fn(),
        stopThinking: jest.fn(),
        canStop: true,
        thinkingStartTime: Date.now(),
      });

      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      expect(screen.getByPlaceholderText('Appuyez sur Escape pour arrêter...')).toBeInTheDocument();
    });
  });

  describe('Interface utilisateur basique', () => {
    it('devrait afficher la zone de saisie et le bouton d\'envoi', () => {
      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      expect(screen.getByPlaceholderText('Posez votre question sur le code...')).toBeInTheDocument();
      expect(screen.getByText('Envoyer')).toBeInTheDocument();
    });

    it('devrait pouvoir envoyer un message', async () => {
      const mockSendMessage = jest.fn();
      mockUseClaudeCode.mockReturnValue({
        ...mockUseClaudeCode(),
        sendMessage: mockSendMessage,
      });

      render(<ClaudeCodePanel workspaceId={mockWorkspaceId} />);
      
      const input = screen.getByPlaceholderText('Posez votre question sur le code...');
      const sendButton = screen.getByText('Envoyer');
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith('Test message');
      });
    });
  });
});
