'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    duration_ms?: number;
    num_turns?: number;
    total_cost_usd?: number;
  };
  streamData?: any; // Pour les données de streaming (tool uses, etc.)
  isIntermediate?: boolean; // Pour les étapes intermédiaires
}

interface AgentStatus {
  status: string;
  agent_type: string;
  capabilities: string[];
}

export default function TestClaudeCodePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [maxTurns, setMaxTurns] = useState(5);
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Récupérer le statut de l'agent au chargement
  useEffect(() => {
    const fetchAgentStatus = async () => {
      try {
        const response = await fetch('/api/test-claude-code');
        if (response.ok) {
          const status = await response.json();
          setAgentStatus(status);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du statut:', error);
      }
    };

    fetchAgentStatus();
  }, []);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/test-claude-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageInput,
          sessionId,
          maxTurns
        })
      });

      if (!response.ok) {
        throw new Error('Erreur réseau');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Impossible de lire la réponse streaming');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse les données ligne par ligne
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Garde la dernière ligne partielle

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const jsonData = JSON.parse(line.slice(6)); // Retire 'data: '
            
            if (jsonData.type === 'stream') {
              // Afficher les étapes intermédiaires
              const streamMessage = jsonData.message;
              
              if (streamMessage.type === 'assistant') {
                // Message de l'assistant (pensées, réflexions)
                const assistantStep: Message = {
                  id: `stream-${Date.now()}-${Math.random()}`,
                  content: streamMessage.message?.content?.[0]?.text || 'Assistant réfléchit...',
                  role: 'assistant',
                  timestamp: new Date(),
                  isIntermediate: true,
                  streamData: streamMessage
                };
                setMessages(prev => [...prev, assistantStep]);
              } 
              else if (streamMessage.type === 'system' && streamMessage.subtype === 'tool_use') {
                // Utilisation d'outil
                const toolStep: Message = {
                  id: `tool-${Date.now()}-${Math.random()}`,
                  content: `🔧 Utilise l'outil: ${streamMessage.tool_name}`,
                  role: 'system',
                  timestamp: new Date(),
                  isIntermediate: true,
                  streamData: streamMessage
                };
                setMessages(prev => [...prev, toolStep]);
              }
              else if (streamMessage.type === 'system' && streamMessage.subtype === 'init') {
                // Initialisation de session
                const initStep: Message = {
                  id: `init-${Date.now()}`,
                  content: `🚀 Session démarrée (${streamMessage.session_id})`,
                  role: 'system',
                  timestamp: new Date(),
                  isIntermediate: true,
                  streamData: streamMessage
                };
                setMessages(prev => [...prev, initStep]);
                setSessionId(streamMessage.session_id);
              }
            }
            else if (jsonData.type === 'final') {
              // Résultat final
              if (jsonData.success) {
                const finalMessage: Message = {
                  id: `final-${Date.now()}`,
                  content: jsonData.response,
                  role: 'assistant',
                  timestamp: new Date(),
                  metadata: jsonData.metadata,
                  isIntermediate: false
                };
                setMessages(prev => [...prev, finalMessage]);
                setSessionId(jsonData.sessionId);
              } else {
                throw new Error(jsonData.error || 'Erreur inconnue');
              }
            }
          } catch (parseError) {
            console.error('Erreur parsing JSON:', parseError, line);
          }
        }
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Test Claude Code - Agent Documentation Technique
          </h1>
          
          {agentStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Statut de l'agent</h3>
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${
                    agentStatus.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-sm text-gray-600">
                    {agentStatus.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Type: {agentStatus.agent_type}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Capacités</h3>
                <div className="flex flex-wrap gap-1">
                  {agentStatus.capabilities.slice(0, 3).map((capability, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {capability}
                    </span>
                  ))}
                  {agentStatus.capabilities.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{agentStatus.capabilities.length - 3} autres
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Configuration */}
          <div className="w-1/4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-4">Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tours maximum
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxTurns}
                    onChange={(e) => setMaxTurns(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session ID
                  </label>
                  <input
                    type="text"
                    value={sessionId || ''}
                    readOnly
                    placeholder="Aucune session active"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showIntermediateSteps}
                      onChange={(e) => setShowIntermediateSteps(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Afficher les étapes intermédiaires</span>
                  </label>
                </div>
                
                <button
                  onClick={clearChat}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Nouveau chat
                </button>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">📁 Contexte du projet</h4>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>• Application web Next.js</div>
                    <div>• Documentation technique complète</div>
                    <div>• Configuration BMAD</div>
                    <div>• Tests automatisés</div>
                  </div>
                  <p className="text-xs text-blue-500 mt-2 italic">
                    L'agent peut lire tous les fichiers du projet
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <p className="text-lg mb-2">👋 Bonjour !</p>
                    <p>Je suis un expert en documentation technique.</p>
                    <p className="text-sm mt-4">Vous pouvez me demander de :</p>
                    <ul className="text-sm text-left mt-2 space-y-1 max-w-md mx-auto">
                      <li>• Analyser et améliorer une documentation</li>
                      <li>• Créer des guides techniques</li>
                      <li>• Réviser du code et sa documentation</li>
                      <li>• Structurer de l'information technique</li>
                    </ul>
                  </div>
                )}

                {messages
                  .filter(message => showIntermediateSteps || !message.isIntermediate)
                  .map((message) => (
                  <div key={message.id} className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <div className={`max-w-3xl px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.role === 'system'
                        ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400'
                        : message.isIntermediate
                        ? 'bg-gray-50 text-gray-600 border-l-4 border-gray-300 italic'
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
                      
                      {/* Détails des données de streaming pour debug */}
                      {message.streamData && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                            Détails technique
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
                      
                      <div className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                        <span>L'agent réfléchit...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Posez votre question sur la documentation technique..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
