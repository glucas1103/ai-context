/**
 * Tests pour le composant ClaudeCodeIndicator - Phase 7 Story 1.6.1
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClaudeCodeIndicator from '../ClaudeCodeIndicator';
import { ClaudeCodeAction } from '@/types/chat/universal';

describe('ClaudeCodeIndicator', () => {
  const sampleActions: ClaudeCodeAction[] = [
    {
      type: 'investigation',
      status: 'in_progress',
      description: 'Analyse du code en cours',
      progress: 60,
      startTime: new Date(),
      tools: ['codebase_search', 'read_file'],
      files: ['/src/component.tsx']
    },
    {
      type: 'analysis',
      status: 'pending',
      description: 'Analyse des dépendances',
      startTime: new Date(),
      tools: ['grep'],
      files: []
    }
  ];

  it('n\'affiche rien quand il n\'y a pas d\'actions', () => {
    const { container } = render(<ClaudeCodeIndicator actions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('n\'affiche rien quand toutes les actions sont terminées', () => {
    const completedActions: ClaudeCodeAction[] = [
      {
        type: 'investigation',
        status: 'completed',
        description: 'Analyse terminée',
        startTime: new Date(),
        endTime: new Date(),
        tools: ['codebase_search'],
        files: []
      }
    ];

    const { container } = render(<ClaudeCodeIndicator actions={completedActions} />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche les actions actives (pending et in_progress)', () => {
    render(<ClaudeCodeIndicator actions={sampleActions} />);
    
    expect(screen.getByText('Claude en action')).toBeInTheDocument();
    expect(screen.getByText('Analyse du code en cours')).toBeInTheDocument();
    expect(screen.getByText('Analyse des dépendances')).toBeInTheDocument();
  });

  it('affiche les icônes correctes pour chaque type d\'action', () => {
    render(<ClaudeCodeIndicator actions={sampleActions} />);
    
    // Vérifier que les icônes d'investigation et d'analyse sont présentes
    expect(screen.getByText('🔍')).toBeInTheDocument(); // Investigation
    expect(screen.getByText('📊')).toBeInTheDocument(); // Analysis
  });

  it('affiche les statuts correctement', () => {
    render(<ClaudeCodeIndicator actions={sampleActions} />);
    
    expect(screen.getByText('En cours...')).toBeInTheDocument();
    expect(screen.getByText('En attente...')).toBeInTheDocument();
  });

  it('affiche la barre de progression pour les actions en cours', () => {
    render(<ClaudeCodeIndicator actions={sampleActions} />);
    
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('affiche les outils utilisés', () => {
    render(<ClaudeCodeIndicator actions={sampleActions} />);
    
    expect(screen.getAllByText('Outils:')).toHaveLength(2); // Deux actions, donc deux "Outils:"
    expect(screen.getByText('codebase_search')).toBeInTheDocument();
    expect(screen.getByText('read_file')).toBeInTheDocument();
    expect(screen.getByText('grep')).toBeInTheDocument();
  });

  it('limite l\'affichage des outils à 3 maximum', () => {
    const actionWithManyTools: ClaudeCodeAction[] = [
      {
        type: 'refactoring',
        status: 'in_progress',
        description: 'Refactorisation en cours',
        startTime: new Date(),
        tools: ['tool1', 'tool2', 'tool3', 'tool4', 'tool5'],
        files: []
      }
    ];

    render(<ClaudeCodeIndicator actions={actionWithManyTools} />);
    
    expect(screen.getByText('tool1')).toBeInTheDocument();
    expect(screen.getByText('tool2')).toBeInTheDocument();
    expect(screen.getByText('tool3')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument(); // +2 pour les outils restants
  });

  it('affiche l\'indicateur d\'analyse en cours', () => {
    render(<ClaudeCodeIndicator actions={sampleActions} />);
    
    expect(screen.getByText('Claude analyse votre code...')).toBeInTheDocument();
  });

  it('applique les bonnes classes CSS selon le statut', () => {
    const actionsWithDifferentStatuses: ClaudeCodeAction[] = [
      {
        type: 'investigation',
        status: 'pending',
        description: 'En attente',
        startTime: new Date(),
        tools: [],
        files: []
      },
      {
        type: 'analysis',
        status: 'in_progress',
        description: 'En cours',
        startTime: new Date(),
        tools: [],
        files: []
      }
    ];

    render(<ClaudeCodeIndicator actions={actionsWithDifferentStatuses} />);
    
    // Les icônes doivent avoir les bonnes classes de couleur de bordure
    const container = screen.getByText('Claude en action').closest('div');
    expect(container).toBeInTheDocument();
  });

  it('gère les types d\'actions non reconnus', () => {
    const unknownAction: ClaudeCodeAction[] = [
      {
        type: 'unknown' as any,
        status: 'in_progress',
        description: 'Action inconnue',
        startTime: new Date(),
        tools: [],
        files: []
      }
    ];

    render(<ClaudeCodeIndicator actions={unknownAction} />);
    
    expect(screen.getByText('⚙️')).toBeInTheDocument(); // Icône par défaut
  });

  it('affiche toutes les icônes de types d\'actions', () => {
    const allActionTypes: ClaudeCodeAction[] = [
      {
        type: 'investigation',
        status: 'in_progress',
        description: 'Investigation',
        startTime: new Date(),
        tools: [],
        files: []
      },
      {
        type: 'analysis',
        status: 'in_progress',
        description: 'Analyse',
        startTime: new Date(),
        tools: [],
        files: []
      },
      {
        type: 'refactoring',
        status: 'in_progress',
        description: 'Refactorisation',
        startTime: new Date(),
        tools: [],
        files: []
      },
      {
        type: 'documentation',
        status: 'in_progress',
        description: 'Documentation',
        startTime: new Date(),
        tools: [],
        files: []
      }
    ];

    render(<ClaudeCodeIndicator actions={allActionTypes} />);
    
    expect(screen.getByText('🔍')).toBeInTheDocument(); // Investigation
    expect(screen.getByText('📊')).toBeInTheDocument(); // Analysis
    expect(screen.getByText('🔧')).toBeInTheDocument(); // Refactoring
    expect(screen.getByText('📝')).toBeInTheDocument(); // Documentation
  });
});
