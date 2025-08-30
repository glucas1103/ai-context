/**
 * Hook pour l'agent Claude Code
 * Version simple basée sur l'agent fonctionnel /test-claude-code
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ClaudeCodeMessage, AgentStatus, UseClaudeCodeReturn } from '@/types/claude-code';

export function useClaudeCode(workspaceId: string): UseClaudeCodeReturn {
  const [messages, setMessages] = useState<ClaudeCodeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [maxTurns, setMaxTurns] = useState(5);
  const [adaptiveTurns, setAdaptiveTurns] = useState(true);
  const [currentTaskComplexity, setCurrentTaskComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);

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
    setIsLoading(true);
    setError(null);
    setThinkingStartTime(Date.now());

    // Ajouter un message informatif sur la complexité détectée
    if (adaptiveTurns) {
      const complexityMessage: ClaudeCodeMessage = {
        id: `complexity-${Date.now()}`,
        content: `🎯 Tâche ${complexity === 'simple' ? 'simple' : complexity === 'complex' ? 'complexe' : 'moyenne'} détectée - ${adaptiveMaxTurns} tours alloués`,
        role: 'system',
        timestamp: new Date(),
        isIntermediate: true
      };
      setMessages(prev => [...prev, complexityMessage]);
    }

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
          sessionId,
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
              
              if (streamMessage.type === 'assistant') {
                // Message de l'assistant (pensées, réflexions)
                const assistantStep: ClaudeCodeMessage = {
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
                const toolStep: ClaudeCodeMessage = {
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
                const initStep: ClaudeCodeMessage = {
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
              } else {
                // Gestion spéciale pour la limite de tours atteinte
                if (jsonData.error === 'Maximum number of turns reached') {
                  const turnLimitMessage: ClaudeCodeMessage = {
                    id: `turn-limit-${Date.now()}`,
                    content: `⚠️ Limite de tours atteinte (${jsonData.metadata?.num_turns || 'N/A'} tours utilisés).\n\nLa tâche semble plus complexe que prévu. Vous pouvez :\n• Reformuler votre question de manière plus spécifique\n• Augmenter la limite de tours\n• Diviser la tâche en plusieurs parties`,
                    role: 'system',
                    timestamp: new Date(),
                    metadata: jsonData.metadata,
                    isIntermediate: false
                  };
                  setMessages(prev => [...prev, turnLimitMessage]);
                  setSessionId(jsonData.sessionId);
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
    }
  };

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
    thinkingStartTime
  };
}
