/**
 * Composant ClaudeCodeIndicator - Phase 7 Story 1.6.1
 * Indicateurs visuels pour les actions Claude Code (investigation, analyse, etc.)
 */

'use client';

import React from 'react';
import { ClaudeCodeAction } from '@/types/chat/universal';

interface ClaudeCodeIndicatorProps {
  actions: ClaudeCodeAction[];
  className?: string;
}

const ClaudeCodeIndicator: React.FC<ClaudeCodeIndicatorProps> = ({ 
  actions, 
  className = '' 
}) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  // Fonction pour obtenir l'icône d'action
  const getActionIcon = (type: ClaudeCodeAction['type']) => {
    switch (type) {
      case 'investigation': return '🔍';
      case 'analysis': return '📊';
      case 'refactoring': return '🔧';
      case 'documentation': return '📝';
      default: return '⚙️';
    }
  };

  // Fonction pour obtenir la couleur de statut
  const getStatusColor = (status: ClaudeCodeAction['status']) => {
    switch (status) {
      case 'pending': return 'border-yellow-400 bg-yellow-400/10';
      case 'in_progress': return 'border-blue-400 bg-blue-400/10';
      case 'completed': return 'border-green-400 bg-green-400/10';
      case 'failed': return 'border-red-400 bg-red-400/10';
      default: return 'border-gray-400 bg-gray-400/10';
    }
  };

  // Fonction pour obtenir l'animation selon le statut
  const getAnimation = (status: ClaudeCodeAction['status']) => {
    switch (status) {
      case 'pending': return 'animate-pulse';
      case 'in_progress': return 'animate-bounce';
      default: return '';
    }
  };

  // Actions en cours (pending ou in_progress)
  const activeActions = actions.filter(action => 
    action.status === 'pending' || action.status === 'in_progress'
  );

  if (activeActions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-3 border border-gray-700 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-200">Claude en action</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {activeActions.map((action, index) => (
          <div key={index} className="flex items-center space-x-3">
            {/* Icône d'action avec animation */}
            <div className={`
              text-lg p-1 rounded border-2 ${getStatusColor(action.status)} ${getAnimation(action.status)}
            `}>
              {getActionIcon(action.type)}
            </div>
            
            {/* Description et statut */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-200 truncate">
                  {action.description}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  {action.status === 'pending' && 'En attente...'}
                  {action.status === 'in_progress' && 'En cours...'}
                </span>
              </div>
              
              {/* Barre de progression si disponible */}
              {action.progress !== undefined && action.status === 'in_progress' && (
                <div className="mt-1 flex items-center space-x-2">
                  <div className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500 ease-out"
                      style={{ width: `${action.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {action.progress}%
                  </span>
                </div>
              )}
              
              {/* Outils utilisés */}
              {action.tools.length > 0 && (
                <div className="mt-1 flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Outils:</span>
                  <div className="flex flex-wrap gap-1">
                    {action.tools.slice(0, 3).map((tool, toolIndex) => (
                      <span 
                        key={toolIndex}
                        className="text-xs bg-gray-700 px-1 py-0.5 rounded text-gray-300"
                      >
                        {tool}
                      </span>
                    ))}
                    {action.tools.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{action.tools.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Indicateur de temps écoulé pour les actions en cours */}
      {activeActions.some(action => action.status === 'in_progress') && (
        <div className="mt-3 pt-2 border-t border-gray-600">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span>Claude analyse votre code...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaudeCodeIndicator;
