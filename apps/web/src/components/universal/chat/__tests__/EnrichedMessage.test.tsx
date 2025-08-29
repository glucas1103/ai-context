/**
 * Tests pour le composant EnrichedMessage - Phase 7 Story 1.6.1
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnrichedMessage from '../EnrichedMessage';
import { EnrichedMessage as EnrichedMessageType, ClaudeCodeAction } from '@/types/chat/universal';

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => {
  return function MockEditor() {
    return <div data-testid="monaco-editor">Monaco Editor</div>;
  };
});

describe('EnrichedMessage', () => {
  const baseMessage: EnrichedMessageType = {
    id: 'test-message-1',
    role: 'assistant',
    content: 'Voici une analyse détaillée de votre code.',
    timestamp: new Date('2024-12-19T10:00:00Z'),
    status: 'sent'
  };

  const userMessage: EnrichedMessageType = {
    id: 'test-user-1',
    role: 'user',
    content: 'Analysez ce fichier SVP',
    timestamp: new Date('2024-12-19T09:59:00Z'),
    status: 'sent'
  };

  it('affiche un message utilisateur basique correctement', () => {
    render(<EnrichedMessage message={userMessage} />);
    
    expect(screen.getByText('Analysez ce fichier SVP')).toBeInTheDocument();
    expect(screen.getByText('10:59')).toBeInTheDocument(); // Timestamp formaté
  });

  it('affiche un message assistant basique correctement', () => {
    render(<EnrichedMessage message={baseMessage} />);
    
    expect(screen.getByText('Voici une analyse détaillée de votre code.')).toBeInTheDocument();
    expect(screen.getByText('Copier')).toBeInTheDocument();
    expect(screen.getByText('Réutiliser')).toBeInTheDocument();
  });

  it('affiche les actions Claude Code', () => {
    const actions: ClaudeCodeAction[] = [
      {
        type: 'investigation',
        status: 'completed',
        description: 'Analyse du fichier component.tsx',
        progress: 100,
        startTime: new Date(),
        endTime: new Date(),
        tools: ['codebase_search', 'read_file'],
        files: ['/src/component.tsx']
      }
    ];

    const messageWithActions: EnrichedMessageType = {
      ...baseMessage,
      actions
    };

    render(<EnrichedMessage message={messageWithActions} />);
    
    expect(screen.getByText('Analyse du fichier component.tsx')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument(); // Icône investigation
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('affiche le preview de code', () => {
    const messageWithCode: EnrichedMessageType = {
      ...baseMessage,
      codePreview: {
        content: 'function test() { return "hello"; }',
        language: 'javascript',
        highlightedLines: [1],
        startLine: 1,
        endLine: 1
      }
    };

    render(<EnrichedMessage message={messageWithCode} />);
    
    expect(screen.getByText('Preview de code (javascript)')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('affiche les résultats d\'analyse', () => {
    const messageWithAnalysis: EnrichedMessageType = {
      ...baseMessage,
      analysisResults: [
        {
          filePath: '/src/test.ts',
          language: 'typescript',
          complexity: 'medium',
          dependencies: ['react', 'lodash'],
          functions: [
            {
              name: 'testFunction',
              lineStart: 1,
              lineEnd: 5,
              parameters: ['param1: string'],
              returnType: 'void'
            }
          ],
          classes: [],
          lastAnalyzed: new Date()
        }
      ]
    };

    render(<EnrichedMessage message={messageWithAnalysis} />);
    
    expect(screen.getByText('Analyses de fichiers:')).toBeInTheDocument();
    expect(screen.getByText('/src/test.ts')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('affiche les outils utilisés', () => {
    const messageWithTools: EnrichedMessageType = {
      ...baseMessage,
      toolsUsed: [
        {
          name: 'codebase_search',
          description: 'Recherche sémantique',
          isActive: true,
          usageCount: 1
        },
        {
          name: 'read_file',
          description: 'Lecture de fichiers',
          isActive: true,
          usageCount: 1
        }
      ]
    };

    render(<EnrichedMessage message={messageWithTools} />);
    
    expect(screen.getByText('Outils utilisés:')).toBeInTheDocument();
    expect(screen.getByText('codebase_search')).toBeInTheDocument();
    expect(screen.getByText('read_file')).toBeInTheDocument();
  });

  it('affiche le contexte d\'investigation', () => {
    const messageWithContext: EnrichedMessageType = {
      ...baseMessage,
      investigationContext: {
        query: 'analyse authentication',
        scope: ['/src/auth'],
        findings: ['Token handling found', 'Login flow identified']
      }
    };

    render(<EnrichedMessage message={messageWithContext} />);
    
    expect(screen.getByText('Investigation:')).toBeInTheDocument();
    expect(screen.getByText('analyse authentication')).toBeInTheDocument();
    expect(screen.getByText('/src/auth')).toBeInTheDocument();
    expect(screen.getByText('2 éléments trouvés')).toBeInTheDocument();
  });

  it('gère l\'expansion et la réduction des actions', () => {
    const actions: ClaudeCodeAction[] = [
      {
        type: 'analysis',
        status: 'completed',
        description: 'Analyse complète',
        startTime: new Date(),
        tools: ['tool1', 'tool2'],
        files: ['file1.ts', 'file2.ts'],
        details: 'Détails de l\'analyse'
      }
    ];

    const messageWithActions: EnrichedMessageType = {
      ...baseMessage,
      actions
    };

    render(<EnrichedMessage message={messageWithActions} />);
    
    // Trouver le bouton d'expansion spécifique (le premier bouton avec l'icône de flèche)
    const expandButton = screen.getAllByRole('button')[0]; // Le premier bouton est celui d'expansion
    
    // Initialement, les détails ne sont pas visibles
    expect(screen.queryByText('Détails de l\'analyse')).not.toBeInTheDocument();
    
    // Cliquer pour agrandir
    fireEvent.click(expandButton);
    expect(screen.getByText('Détails de l\'analyse')).toBeInTheDocument();
    expect(screen.getByText('tool1')).toBeInTheDocument();
    expect(screen.getByText('file1.ts')).toBeInTheDocument();
  });

  it('gère les timestamps invalides gracieusement', () => {
    const messageWithInvalidTimestamp: EnrichedMessageType = {
      ...baseMessage,
      timestamp: null
    };

    render(<EnrichedMessage message={messageWithInvalidTimestamp} />);
    
    // Le composant doit s'afficher sans erreur même avec un timestamp invalide
    expect(screen.getByText('Voici une analyse détaillée de votre code.')).toBeInTheDocument();
  });

  it('affiche la barre de progression pour les actions en cours', () => {
    const actions: ClaudeCodeAction[] = [
      {
        type: 'investigation',
        status: 'in_progress',
        description: 'Analyse en cours...',
        progress: 75,
        startTime: new Date(),
        tools: ['codebase_search'],
        files: []
      }
    ];

    const messageWithProgress: EnrichedMessageType = {
      ...baseMessage,
      actions
    };

    render(<EnrichedMessage message={messageWithProgress} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });
});
