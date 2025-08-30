'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useClaudeCode } from '@/hooks/useClaudeCode';
import { useChatSessions } from '@/hooks/useChatSessions';
import { ClaudeCodeMessage, AgentStatus } from '@/types/claude-code';

interface ClaudeCodePanelProps {
  workspaceId: string;
}

const ClaudeCodePanel: React.FC<ClaudeCodePanelProps> = ({ workspaceId }) => {
  const [input, setInput] = useState('');
  const [maxTurns, setMaxTurns] = useState(5);
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(true);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hooks pour les sessions
  const {
    sessions,
    activeSessionId,
    isLoading: sessionsLoading,
    createSession,
    deleteSession,
    setActiveSession,
  } = useChatSessions({ workspaceId });

  // Hook pour Claude Code
  const {
    messages,
    isLoading,
    error,
    sessionId,
    agentStatus,
    sendMessage,
    clearMessages,
    adaptiveTurns,
    setAdaptiveTurns,
    currentTaskComplexity,
    getAdaptiveTurns,
    continueWithMoreTurns,
    stopThinking,
    canStop,
    thinkingStartTime,
  } = useClaudeCode(workspaceId);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Raccourci clavier pour arrêter la réflexion (Escape)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && canStop) {
        event.preventDefault();
        stopThinking();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canStop, stopThinking]);

  // Timer pour afficher le temps écoulé
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (thinkingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - thinkingStartTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [thinkingStartTime]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const messageContent = input.trim();
    setInput('');
    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    
    const session = await createSession(newSessionName.trim());
    if (session) {
      setNewSessionName('');
      setShowNewSessionDialog(false);
    }
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
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header avec onglets */}
      <div className="bg-gray-800 border-b border-gray-700">
        {/* Status de l'agent */}
        <div className="px-4 py-2 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                agentStatus?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <h2 className="text-sm font-medium text-white">Claude Code Assistant</h2>
            </div>
            {agentStatus && (
              <span className="text-xs text-gray-400">{agentStatus.agent_type}</span>
            )}
          </div>
        </div>

        {/* Onglets des sessions */}
        <div className="flex items-center px-2 py-1 overflow-x-auto">
          <div className="flex space-x-1 min-w-0 flex-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`px-3 py-1.5 text-xs rounded-t-md whitespace-nowrap transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                }`}
              >
                <span className="truncate max-w-24">{session.title || session.name}</span>
                {activeSessionId === session.id && sessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="ml-2 text-gray-500 hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </button>
            ))}
          </div>
          
          {/* Bouton nouvelle session */}
          <button
            onClick={() => setShowNewSessionDialog(true)}
            className="ml-2 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-lg mb-2">Assistant Claude Code</p>
            <p className="text-sm">Expert en analyse de code et documentation technique</p>
            <div className="mt-4 text-xs text-gray-600">
              <p>Vous pouvez me demander de :</p>
              <ul className="mt-2 space-y-1">
                <li>• Analyser votre code</li>
                <li>• Réviser l'architecture</li>
                <li>• Détecter des problèmes</li>
                <li>• Suggérer des améliorations</li>
              </ul>
            </div>
          </div>
        )}

        {messages
          .filter(message => showIntermediateSteps || !message.isIntermediate)
          .map((message) => (
          <div key={message.id} className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            <div className={`max-w-[85%] px-4 py-2 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : message.role === 'system'
                ? 'bg-yellow-900/20 text-yellow-400 border-l-4 border-yellow-600'
                : message.isIntermediate
                ? 'bg-gray-800 text-gray-400 border-l-4 border-gray-600 italic'
                : 'bg-gray-700 text-gray-200'
            }`}>
              {message.role === 'system' && (
                <div className="text-xs font-semibold mb-1 text-yellow-500">
                  SYSTÈME
                </div>
              )}
              {message.isIntermediate && message.role === 'assistant' && (
                <div className="text-xs font-semibold mb-1 text-gray-500">
                  🤔 RÉFLEXION
                </div>
              )}

              <div className="whitespace-pre-wrap break-words">{message.content}</div>

              {message.streamData && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-300">
                    Détails techniques
                  </summary>
                  <pre className="mt-1 p-2 bg-gray-800 text-green-400 rounded text-xs overflow-x-auto">
                    {JSON.stringify(message.streamData, null, 2)}
                  </pre>
                </details>
              )}

              {message.metadata && !message.isIntermediate && (
                <div className="text-xs mt-2 opacity-70 space-x-3">
                  <span>⏱️ {formatDuration(message.metadata.duration_ms)}</span>
                  <span>🔄 {message.metadata.num_turns} tours</span>
                  <span>💰 {formatCost(message.metadata.total_cost_usd)}</span>
                </div>
              )}

              {/* Boutons d'action pour les messages de limite de tours */}
              {message.role === 'system' && message.content.includes('Limite de tours atteinte') && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => continueWithMoreTurns(5)}
                    disabled={isLoading}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    +5 tours
                  </button>
                  <button
                    onClick={() => continueWithMoreTurns(10)}
                    disabled={isLoading}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    +10 tours
                  </button>
                  <button
                    onClick={() => setAdaptiveTurns(true)}
                    disabled={isLoading || adaptiveTurns}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    Mode adaptatif
                  </button>
                </div>
              )}

              <div className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  <span>Agent en cours de réflexion...</span>
                  {elapsedTime > 0 && (
                    <span className="text-xs text-gray-400">
                      ({elapsedTime}s)
                    </span>
                  )}
                </div>
                {canStop && (
                  <button
                    onClick={stopThinking}
                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    title="Arrêter la réflexion (Escape)"
                  >
                    ⏹️ Stop
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={canStop ? "Appuyez sur Escape pour arrêter..." : "Posez votre question sur le code..."}
            className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {canStop ? (
            <button
              onClick={stopThinking}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="6" y="6" width="8" height="8" rx="1"/>
              </svg>
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Envoyer
            </button>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 text-sm text-gray-400">
          {/* Première ligne - Options de base */}
          <div className="flex justify-between items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showIntermediateSteps}
                onChange={(e) => setShowIntermediateSteps(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
              />
              <span>Étapes intermédiaires</span>
            </label>
            
            <button
              onClick={clearMessages}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Effacer
            </button>
          </div>

          {/* Deuxième ligne - Gestion des tours */}
          <div className="flex justify-between items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={adaptiveTurns}
                onChange={(e) => setAdaptiveTurns(e.target.checked)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
              />
              <span>Tours adaptatifs</span>
            </label>
            
            <div className="flex items-center space-x-2">
              <span>Max tours:</span>
              <input
                type="number"
                min="1"
                max="20"
                value={maxTurns}
                onChange={(e) => setMaxTurns(parseInt(e.target.value) || 5)}
                className="w-16 px-2 py-1 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={adaptiveTurns}
              />
            </div>
          </div>

          {/* Indicateur de complexité */}
          {adaptiveTurns && (
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center space-x-2">
                <span>Complexité:</span>
                <span className={`px-2 py-1 rounded ${
                  currentTaskComplexity === 'simple' ? 'bg-green-900 text-green-400' :
                  currentTaskComplexity === 'complex' ? 'bg-red-900 text-red-400' :
                  'bg-yellow-900 text-yellow-400'
                }`}>
                  {currentTaskComplexity === 'simple' ? 'Simple' : 
                   currentTaskComplexity === 'complex' ? 'Complexe' : 'Moyenne'}
                </span>
              </span>
              <span className="text-gray-500">
                Tours alloués: {getAdaptiveTurns()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dialog nouvelle session */}
      {showNewSessionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-white mb-4">Nouvelle session</h3>
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Nom de la session..."
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateSession();
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNewSessionDialog(false);
                  setNewSessionName('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!newSessionName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaudeCodePanel;
