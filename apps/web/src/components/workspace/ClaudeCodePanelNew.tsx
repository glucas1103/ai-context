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
  const [maxTurns, setMaxTurns] = useState(50);
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

        {messages.map((message) => {
          // Messages d'utilisateur - bulles bleues
          if (message.role === 'user') {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] px-4 py-2 rounded-lg bg-blue-600 text-white">
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                </div>
              </div>
            );
          }
          
          // Messages d'outils - petite bulle jaune compacte
          if (message.isToolUsage) {
            return (
              <div key={message.id} className="flex justify-start">
                <div className="inline-block px-3 py-1 rounded-full bg-yellow-900/20 text-yellow-400 border border-yellow-600 text-sm">
                  {message.content}
                </div>
              </div>
            );
          }
          
          // Messages système (limite de tours, etc.) - bulles jaunes
          if (message.role === 'system') {
            return (
              <div key={message.id} className="flex justify-start">
                <div className="max-w-[85%] px-4 py-2 rounded-lg bg-yellow-900/20 text-yellow-400 border-l-4 border-yellow-600">
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                </div>
              </div>
            );
          }
          
          // Messages assistant - texte direct sans bulle
          return (
            <div key={message.id} className="text-gray-300 whitespace-pre-wrap break-words">
              {message.content}
            </div>
          );
        })}

        {/* Boutons d'action pour les messages de limite de tours atteinte */}
        {messages.map((message) => 
          message.role === 'system' && message.content.includes('Limite de') && message.content.includes('tours atteinte') ? (
            <div key={`buttons-${message.id}`} className="mt-3 flex gap-2 flex-wrap">
              <button
                onClick={() => continueWithMoreTurns(50)}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                Continuer (+50 tours)
              </button>
              <button
                onClick={() => {
                  sendMessage('Peux-tu me donner un résumé de ce que tu as trouvé jusqu\'ici et les points clés de ton analyse ?');
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                Réponse partielle
              </button>
            </div>
          ) : null
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

        {/* Options simplifiées */}
        <div className="flex justify-center">
          <button
            onClick={clearMessages}
            className="px-4 py-1 text-xs bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Effacer l'historique
          </button>
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
