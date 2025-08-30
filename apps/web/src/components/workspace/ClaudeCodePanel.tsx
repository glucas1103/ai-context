/**
 * Composant ClaudeCodePanel pour le panneau droit du ThreePanelsLayout
 * Basé sur l'agent fonctionnel /test-claude-code
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useClaudeCode } from '@/hooks/useClaudeCode';
import { ClaudeCodePanelProps, ClaudeCodeMessage } from '@/types/claude-code';

const ClaudeCodePanel: React.FC<ClaudeCodePanelProps> = ({
  workspaceId,
  className = '',
  maxHeight = 'h-full'
}) => {
  const [input, setInput] = useState('');
  const [maxTurns, setMaxTurns] = useState(5);
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sessionId,
    agentStatus,
    sendMessage,
    clearMessages,
    setMaxTurns: updateMaxTurns,
    setShowIntermediateSteps: updateShowIntermediateSteps
  } = useClaudeCode(workspaceId);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mettre à jour les configurations
  useEffect(() => {
    updateMaxTurns(maxTurns);
  }, [maxTurns, updateMaxTurns]);

  useEffect(() => {
    updateShowIntermediateSteps(showIntermediateSteps);
  }, [showIntermediateSteps, updateShowIntermediateSteps]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const messageContent = input.trim();
    setInput('');
    await sendMessage(messageContent);
  };

  const formatCost = (cost?: number) => {
    if (typeof cost !== 'number') return 'N/A';
    return `$${cost.toFixed(6)}`;
  };

  const formatDuration = (duration?: number) => {
    if (typeof duration !== 'number') return 'N/A';
    return `${duration}ms`;
  };

  return (
    <div className={`flex flex-col bg-white ${maxHeight} ${className}`}>
      {/* Header compact */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Claude Code</h3>
          {agentStatus && (
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                agentStatus.status === 'active' ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span className="text-xs text-gray-600">
                {agentStatus.status === 'active' ? 'Actif' : 'Inactif'}
              </span>
            </div>
          )}
        </div>

        {/* Configuration compacte */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 min-w-0">Tours max:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={maxTurns}
              onChange={(e) => setMaxTurns(parseInt(e.target.value) || 5)}
              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showSteps"
              checked={showIntermediateSteps}
              onChange={(e) => setShowIntermediateSteps(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showSteps" className="text-xs text-gray-600">
              Étapes intermédiaires
            </label>
          </div>

          {sessionId && (
            <div className="text-xs text-gray-500 truncate">
              Session: {sessionId.slice(0, 8)}...
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-sm mb-2">Expert en analyse de code</p>
            <p className="text-xs text-gray-400 mb-4">
              Posez vos questions sur le workspace actuel
            </p>
            <div className="text-xs space-y-1">
              <div>• Analyse de code et architecture</div>
              <div>• Détection de bugs et optimisations</div>
              <div>• Documentation et bonnes pratiques</div>
            </div>
          </div>
        )}

        {messages
          .filter(message => showIntermediateSteps || !message.isIntermediate)
          .map((message) => (
          <div key={message.id} className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : message.role === 'system'
                ? 'bg-yellow-50 text-yellow-800 border-l-2 border-yellow-400'
                : message.isIntermediate
                ? 'bg-gray-50 text-gray-600 border-l-2 border-gray-300 italic'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {/* Indicateur du type de message */}
              {message.role === 'system' && (
                <div className="text-xs font-semibold mb-1 text-yellow-700">
                  SYSTÈME
                </div>
              )}
              {message.isIntermediate && message.role === 'assistant' && (
                <div className="text-xs font-semibold mb-1 text-gray-500">
                  🤔 RÉFLEXION
                </div>
              )}
              
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Métadonnées pour les messages finaux */}
              {message.metadata && !message.isIntermediate && (
                <div className="text-xs mt-2 opacity-70 space-x-2 border-t border-gray-200 pt-1">
                  <span>⏱️ {formatDuration(message.metadata.duration_ms)}</span>
                  <span>🔄 {message.metadata.num_turns}</span>
                  <span>💰 {formatCost(message.metadata.total_cost_usd)}</span>
                </div>
              )}
              
              <div className="text-xs mt-1 opacity-60">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <span>Claude analyse...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie compacte */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Analysez ce code..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Actions rapides */}
        <div className="mt-2 flex gap-1 flex-wrap">
          <button
            onClick={clearMessages}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
            disabled={isLoading}
          >
            Effacer
          </button>
          {messages.length === 0 && (
            <>
              <button
                onClick={() => sendMessage('Analysez l\'architecture de ce projet')}
                className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                disabled={isLoading}
              >
                Architecture
              </button>
              <button
                onClick={() => sendMessage('Identifiez les problèmes potentiels')}
                className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                disabled={isLoading}
              >
                Problèmes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Indicateur d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center space-x-2 text-red-600">
            <span className="text-sm">⚠️</span>
            <span className="text-xs">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaudeCodePanel;
