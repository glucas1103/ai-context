/**
 * Composant ChatHeader - Story 1.6.1 Phase 2
 * En-tête du chat avec informations de session et statut
 */

'use client';

import React from 'react';
import { ChatHeaderProps, AgentType } from '@/types/chat/universal';

const ChatHeader: React.FC<ChatHeaderProps> = ({
  sessionId,
  agentType = 'analysis',
  isConnected = true,
  className = ''
}) => {
  const getAgentInfo = (type: AgentType) => {
    switch (type) {
      case 'analysis':
        return {
          name: 'Claude Analyste',
          icon: '🔍',
          description: 'Spécialisé dans l\'analyse de code et l\'exploration de codebase',
          color: 'blue'
        };
      case 'documentation':
        return {
          name: 'Claude Documentaliste',
          icon: '📝',
          description: 'Spécialisé dans la création et l\'enrichissement de documentation',
          color: 'green'
        };
      default:
        return {
          name: 'Claude Assistant',
          icon: '🤖',
          description: 'Assistant IA polyvalent',
          color: 'gray'
        };
    }
  };

  const agent = getAgentInfo(agentType);

  const getStatusIndicator = () => {
    if (isConnected) {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400">En ligne</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-xs text-red-400">Hors ligne</span>
        </div>
      );
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'border-blue-500/20 bg-blue-500/10';
      case 'green':
        return 'border-green-500/20 bg-green-500/10';
      default:
        return 'border-gray-500/20 bg-gray-500/10';
    }
  };

  return (
    <div className={`border-b border-gray-700 bg-gray-800 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Informations de l'agent */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg border ${getColorClasses(agent.color)}`}>
            <span className="text-lg">{agent.icon}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-white">{agent.name}</h3>
              {getStatusIndicator()}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {agent.description}
            </p>
          </div>
        </div>

        {/* Informations de session */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {sessionId && (
            <div className="flex items-center space-x-1">
              <span>🔗</span>
              <span>Session: {sessionId.slice(-8)}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <span>⚡</span>
            <span>Claude Code SDK</span>
          </div>
        </div>
      </div>

      {/* Barre de progression/statut (optionnelle) */}
      {!isConnected && (
        <div className="mt-3 px-3 py-2 bg-red-900/20 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400">
            <span>⚠️</span>
            <span className="text-xs">
              Connexion interrompue - Tentative de reconnexion...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;

