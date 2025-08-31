/**
 * Hook pour l'agent Claude Code
 * Version simple basée sur l'agent fonctionnel /test-claude-code
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ClaudeCodeMessage, AgentStatus, UseClaudeCodeReturn } from '@/types/claude-code';

export function useClaudeCode(workspaceId: string, chatSessionId?: string | null): UseClaudeCodeReturn {
  const [messages, setMessages] = useState<ClaudeCodeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [maxTurns, setMaxTurns] = useState(50);
  const [adaptiveTurns, setAdaptiveTurns] = useState(true);
  const [currentTaskComplexity, setCurrentTaskComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  // Récupérer le statut de l'agent au chargement
  useEffect(() => {
    const fetchAgentStatus = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/claude-code`);
        if (response.ok) {
          const status = await response.json();
          setAgentStatus(status);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du statut:', error);
      }
    };

    if (workspaceId) {
      fetchAgentStatus();
    }
  }, [workspaceId]);

  // Fonction pour détecter la complexité d'une tâche
  const detectTaskComplexity = (message: string): 'simple' | 'medium' | 'complex' => {
    const lowerMessage = message.toLowerCase();
    
    // Mots-clés pour tâches complexes
    const complexKeywords = [
      'architecture', 'refactor', 'migration', 'optimisation', 'performance',
      'sécurité', 'audit', 'analyse complète', 'documentation complète',
      'restructuration', 'conception', 'design pattern', 'intégration'
    ];
    
    // Mots-clés pour tâches simples
    const simpleKeywords = [
      'bug', 'erreur', 'correction', 'fix', 'syntaxe', 'typo',
      'import', 'export', 'variable', 'fonction simple'
    ];
    
    // Détection basée sur la longueur et les mots-clés
    const hasComplexKeywords = complexKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasSimpleKeywords = simpleKeywords.some(keyword => lowerMessage.includes(keyword));
    const isLongMessage = message.length > 200;
    const hasMultipleQuestions = (message.match(/\?/g) || []).length > 2;
    
    if (hasComplexKeywords || isLongMessage || hasMultipleQuestions) {
      return 'complex';
    } else if (hasSimpleKeywords) {
      return 'simple';
    }
    return 'medium';
  };

  // Calculer le nombre de tours adaptatif
  const getAdaptiveTurns = (complexity: 'simple' | 'medium' | 'complex'): number => {
    if (!adaptiveTurns) return maxTurns;
    
    switch (complexity) {
      case 'simple': return Math.max(3, Math.floor(maxTurns * 0.6));
      case 'medium': return maxTurns;
      case 'complex': return Math.min(20, Math.floor(maxTurns * 2));
      default: return maxTurns;
    }
  };

  





  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Détecter la complexité de la tâche
    const complexity = detectTaskComplexity(content);
    setCurrentTaskComplexity(complexity);
    
    // Calculer le nombre de tours adaptatif
    const adaptiveMaxTurns = getAdaptiveTurns(complexity);

    const userMessage: ClaudeCodeMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Sauvegarder le message utilisateur si on a une session
    if (chatSessionId) {
      await saveMessage(userMessage, chatSessionId);
    }
    
    setIsLoading(true);
    setError(null);
    setThinkingStartTime(Date.now());



    try {
      // Créer un nouveau AbortController pour cette requête
      const controller = new AbortController();
      setAbortController(controller);

      const response = await fetch(`/api/workspaces/${workspaceId}/claude-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content.trim(),
          sessionId, // Le sessionId Claude Code pour reprendre la conversation
          chatSessionId, // Notre ID de session en base pour la persistance
          maxTurns: adaptiveMaxTurns,
          complexity,
          adaptiveTurns
        }),
        signal: controller.signal
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
              
              // Debug: afficher seulement les types de messages pour debug
              console.log('Stream message type:', streamMessage.type, 'subtype:', streamMessage.subtype);
              
              if (streamMessage.type === 'assistant') {
                // Message de l'assistant - afficher directement le contenu de Claude Code
                const content = streamMessage.message?.content?.[0]?.text || '';
                
                if (content.trim()) {
                  console.log('Assistant message:', content.substring(0, 200)); // Debug
                  
                  // Afficher directement le message de Claude Code sans formatage
                  setCurrentAction(content);
                  
                  const assistantStep: ClaudeCodeMessage = {
                    id: `stream-${Date.now()}-${Math.random()}`,
                    content: content,
                    role: 'assistant',
                    timestamp: new Date(),
                    isIntermediate: true,
                    streamData: streamMessage
                  };
                  setMessages(prev => [...prev, assistantStep]);
                  
                  // Sauvegarder le message assistant si on a une session
                  if (chatSessionId) {
                    saveMessage(assistantStep, chatSessionId);
                  }
                }
                
                // Vérifier s'il y a des utilisations d'outils dans le message assistant
                const messageContent = streamMessage.message?.content || [];
                for (const contentItem of messageContent) {
                  if (contentItem.type === 'tool_use') {
                    console.log('Tool use in assistant message:', contentItem);
                    
                    // Créer un message informatif basé sur l'outil et ses paramètres
                    let toolMessage = '';
                    switch (contentItem.name) {
                      case 'Glob':
                        const pattern = contentItem.input?.pattern || 'pattern';
                        toolMessage = `🔍 Recherche de fichiers avec le pattern: "${pattern}"`;
                        break;
                      case 'Read':
                        const filePath = contentItem.input?.file_path || 'fichier';
                        toolMessage = `📖 Lecture du fichier: "${filePath}"`;
                        break;
                      case 'Grep':
                        const grepPattern = contentItem.input?.pattern || 'pattern';
                        const grepPath = contentItem.input?.path || '';
                        toolMessage = `🔎 Recherche "${grepPattern}"${grepPath ? ` dans ${grepPath}` : ''}`;
                        break;
                      case 'List':
                        const dirPath = contentItem.input?.target_directory || 'dossier';
                        toolMessage = `📁 Exploration du dossier: "${dirPath}"`;
                        break;
                      default:
                        toolMessage = `🔧 Utilisation de l'outil: ${contentItem.name}`;
                    }
                    
                    const toolUseMessage: ClaudeCodeMessage = {
                      id: `tool-use-${Date.now()}-${Math.random()}`,
                      content: toolMessage,
                      role: 'system',
                      timestamp: new Date(),
                      isIntermediate: true,
                      streamData: contentItem,
                      isToolUsage: true // Nouveau flag pour identifier les messages d'outils
                    };
                    setMessages(prev => [...prev, toolUseMessage]);
                    
                    // Sauvegarder le message d'outil si on a une session
                    if (chatSessionId) {
                      saveMessage(toolUseMessage, chatSessionId);
                    }
                  }
                }
              } 
              else if (streamMessage.type === 'system' && streamMessage.subtype === 'init') {
                // Initialisation de session - juste définir le sessionId sans afficher de message
                setSessionId(streamMessage.session_id);
              }
              // Capturer tous les autres types de messages pour debug
              else {
                console.log('Other message type:', streamMessage.type);
              }
            }
            else if (jsonData.type === 'final') {
              // Résultat final
              if (jsonData.success) {
                const finalMessage: ClaudeCodeMessage = {
                  id: `final-${Date.now()}`,
                  content: jsonData.response,
                  role: 'assistant',
                  timestamp: new Date(),
                  metadata: jsonData.metadata,
                  isIntermediate: false
                };
                setMessages(prev => [...prev, finalMessage]);
                setSessionId(jsonData.sessionId);
                
                // Sauvegarder le message final et mettre à jour la session Claude Code ID
                if (chatSessionId) {
                  saveMessage(finalMessage, chatSessionId);
                  // Mettre à jour le claude_session_id dans la session
                  fetch(`/api/workspaces/${workspaceId}/chat-sessions/${chatSessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ claude_session_id: jsonData.sessionId })
                  });
                }
              } else {
                // Gestion spéciale pour la limite de tours atteinte (50 tours)
                if (jsonData.error === 'Maximum number of turns reached') {
                  const turnsUsed = jsonData.metadata?.num_turns || 50;
                  const turnLimitMessage: ClaudeCodeMessage = {
                    id: `turn-limit-${Date.now()}`,
                    content: `Limite de ${turnsUsed} tours atteinte.\n\nL'analyse progresse bien mais la tâche s'avère plus complexe que prévu.\n\nOptions disponibles :\n• Continuer avec 50 tours supplémentaires\n• Obtenir une réponse partielle basée sur l'analyse actuelle\n\nQue souhaitez-vous faire ?`,
                    role: 'system',
                    timestamp: new Date(),
                    metadata: jsonData.metadata,
                    isIntermediate: false
                  };
                  setMessages(prev => [...prev, turnLimitMessage]);
                  setSessionId(jsonData.sessionId);
                  
                  // Sauvegarder le message de limite de tours
                  if (chatSessionId) {
                    saveMessage(turnLimitMessage, chatSessionId);
                  }
                } else {
                  throw new Error(jsonData.error || 'Erreur inconnue');
                }
              }
            }
          } catch (parseError) {
            console.error('Erreur parsing JSON:', parseError, line);
          }
        }
      }

    } catch (err) {
      // Vérifier si c'est une interruption volontaire
      if (err instanceof Error && err.name === 'AbortError') {
        const stopMessage: ClaudeCodeMessage = {
          id: (Date.now() + 1).toString(),
          content: '🛑 Réflexion interrompue par l\'utilisateur',
          role: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, stopMessage]);
      } else {
        const errorMessage: ClaudeCodeMessage = {
          id: (Date.now() + 1).toString(),
          content: `Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
      setThinkingStartTime(null);
      setCurrentAction(null);
    }
  };

  // Charger les messages d'une session depuis la base de données
  const loadSessionMessages = async (chatSessionId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/chat-sessions/${chatSessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        // Convertir les messages de la DB vers le format ClaudeCodeMessage
        const loadedMessages: ClaudeCodeMessage[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata,
          isIntermediate: msg.metadata?.isIntermediate || false,
          isToolUsage: msg.metadata?.isToolUsage || false
        }));
        setMessages(loadedMessages);
        
        // Récupérer le claude_session_id s'il existe
        const sessionResponse = await fetch(`/api/workspaces/${workspaceId}/chat-sessions/${chatSessionId}`);
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.session?.claude_session_id) {
            setSessionId(sessionData.session.claude_session_id);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  // Sauvegarder un message en base de données
  const saveMessage = async (message: ClaudeCodeMessage, chatSessionId: string) => {
    try {
      await fetch(`/api/workspaces/${workspaceId}/chat-sessions/${chatSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: message.role,
          content: message.content,
          metadata: {
            ...message.metadata,
            isIntermediate: message.isIntermediate,
            isToolUsage: message.isToolUsage,
            streamData: message.streamData
          }
        })
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du message:', error);
    }
  };

  // Charger les messages quand la session change
  useEffect(() => {
    if (chatSessionId) {
      loadSessionMessages(chatSessionId);
    } else {
      // Nouvelle session vide
      setMessages([]);
      setSessionId(null);
      setError(null);
    }
  }, [chatSessionId]);

  const clearMessages = () => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  };

  // Fonction pour arrêter la réflexion en cours
  const stopThinking = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  // Fonction pour continuer une tâche avec plus de tours
  const continueWithMoreTurns = async (additionalTurns: number = 5) => {
    if (!sessionId) return;
    
    const continueMessage = `Continuez la tâche précédente avec ${additionalTurns} tours supplémentaires.`;
    
    // Augmenter temporairement la limite
    const originalMaxTurns = maxTurns;
    setMaxTurns(maxTurns + additionalTurns);
    
    await sendMessage(continueMessage);
    
    // Restaurer la limite originale après un délai
    setTimeout(() => setMaxTurns(originalMaxTurns), 1000);
  };

  return {
    messages,
    isLoading,
    error,
    sessionId,
    agentStatus,
    sendMessage,
    clearMessages,
    setMaxTurns,
    setShowIntermediateSteps,
    // Nouvelles fonctionnalités adaptatives
    adaptiveTurns,
    setAdaptiveTurns,
    currentTaskComplexity,
    getAdaptiveTurns: () => getAdaptiveTurns(currentTaskComplexity),
    continueWithMoreTurns,
    // Contrôle de l'exécution
    stopThinking,
    canStop: isLoading && abortController !== null,
    thinkingStartTime,
    currentAction
  };
}
