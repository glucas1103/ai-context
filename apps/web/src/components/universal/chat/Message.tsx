/**
 * Composant Message individuel - Story 1.6.1 Phase 2
 * Support markdown et métadonnées Claude Code
 */

'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { MessageProps, ChatRole, ChatStatus } from '@/types/chat/universal';

const Message: React.FC<MessageProps> = ({ message, className = '' }) => {
  const { role, content, timestamp, status, metadata } = message;

  const formatTimestamp = (date: Date | string | null | undefined): string => {
    // Gérer les cas null/undefined
    if (!date) {
      return '--:--';
    }
    
    // Gérer le cas où date est une string (venant de Supabase/API)
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Vérifier que la date est valide
    if (isNaN(dateObj.getTime())) {
      return '--:--';
    }
    
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const getStatusIcon = (status?: ChatStatus): string => {
    switch (status) {
      case 'sending': return '⏳';
      case 'investigating': return '🔍';
      case 'reasoning': return '🧠';
      case 'error': return '❌';
      case 'sent':
      default: return '';
    }
  };

  const getStatusText = (status?: ChatStatus): string => {
    switch (status) {
      case 'sending': return 'Envoi en cours...';
      case 'investigating': return 'Investigation...';
      case 'reasoning': return 'Raisonnement...';
      case 'error': return 'Erreur';
      case 'sent':
      default: return '';
    }
  };

  const getRoleStyles = (role: ChatRole): string => {
    switch (role) {
      case 'user':
        return 'bg-blue-600 text-white ml-8';
      case 'assistant':
        return 'bg-gray-700 text-gray-100 mr-8';
      case 'system':
        return 'bg-yellow-600 text-white mx-4';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoleIcon = (role: ChatRole): string => {
    switch (role) {
      case 'user': return '👤';
      case 'assistant': return '🤖';
      case 'system': return '⚙️';
      default: return '💬';
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Message principal */}
      <div className={`rounded-lg p-3 ${getRoleStyles(role)}`}>
        {/* En-tête du message */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{getRoleIcon(role)}</span>
            <span className="text-xs font-medium capitalize">{role}</span>
            {status && status !== 'sent' && (
              <div className="flex items-center space-x-1">
                <span className="text-xs">{getStatusIcon(status)}</span>
                <span className="text-xs text-gray-300">{getStatusText(status)}</span>
              </div>
            )}
          </div>
          <span className="text-xs opacity-70">
            {formatTimestamp(timestamp)}
          </span>
        </div>

        {/* Contenu du message avec support markdown */}
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Métadonnées Claude Code */}
      {metadata && (
        <div className="text-xs space-y-1 px-3">
          {metadata.filesAnalyzed && metadata.filesAnalyzed.length > 0 && (
            <div className="flex items-center space-x-2 text-blue-400">
              <span>📁</span>
              <span>Fichiers analysés: {metadata.filesAnalyzed.join(', ')}</span>
            </div>
          )}
          
          {metadata.toolsUsed && metadata.toolsUsed.length > 0 && (
            <div className="flex items-center space-x-2 text-green-400">
              <span>🔧</span>
              <span>Outils utilisés: {metadata.toolsUsed.join(', ')}</span>
            </div>
          )}
          
          {metadata.investigationSteps && metadata.investigationSteps.length > 0 && (
            <div className="flex items-center space-x-2 text-purple-400">
              <span>🔍</span>
              <span>{metadata.investigationSteps.length} étapes d'investigation</span>
            </div>
          )}
          
          {metadata.reasoningSteps && metadata.reasoningSteps.length > 0 && (
            <div className="flex items-center space-x-2 text-orange-400">
              <span>🧠</span>
              <span>{metadata.reasoningSteps.length} étapes de raisonnement</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Message;

