/**
 * Composant UniversalChatPanel - Story 1.6.1 Phase 6
 * Composant principal de chat universel optimisé pour Claude Code avec gestion des onglets
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import { ChatTabBar } from '@/components/universal/chat/ChatTabBar';
import { EnrichedMessage, ClaudeCodeIndicator } from '@/components/universal/chat';
import { useChatSession } from '@/hooks/useChatSession';
import { useChatTabs } from '@/hooks/useChatTabs';
import { useAuth } from '@/hooks/useAuth';
import { 
  UniversalChatPanelProps,
  DEFAULT_CHAT_CONFIG,
  ClaudeCodeContext,
  ChatRole,
  ChatStatus,
  EnrichedMessage as EnrichedMessageType,
  ClaudeCodeAction
} from '@/types/chat/universal';

interface UniversalChatPanelComponentProps extends UniversalChatPanelProps {
  // Props supplémentaires pour l'interface
  agentType?: 'analysis' | 'documentation';
  selectedItem?: {
    path?: string;
    name?: string;
  };
}

const UniversalChatPanel: React.FC<UniversalChatPanelComponentProps> = ({
  // Props Claude Code
  sessionId,
  workspaceId,
  context,
  onMessageSent,
  onMessageReceived,
  onSessionCreated,
  onError,
  onInvestigationStart,
  onInvestigationComplete,
  showHeader = DEFAULT_CHAT_CONFIG.showHeader,
  showControls = DEFAULT_CHAT_CONFIG.showControls,
  autoScroll = DEFAULT_CHAT_CONFIG.autoScroll,
  maxHeight = DEFAULT_CHAT_CONFIG.maxHeight,
  theme = DEFAULT_CHAT_CONFIG.theme,
  className = '',
  
  // Props d'interface
  agentType = 'analysis',
  selectedItem
}) => {
  // TOUS LES HOOKS DOIVENT ÊTRE APPELÉS AU DÉBUT - RÈGLES DES HOOKS REACT
  const { user } = useAuth();
  
  // État local pour les messages de test
  const [localMessages, setLocalMessages] = React.useState<any[]>([]);
  
  // État pour la zone de saisie
  const [inputValue, setInputValue] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  // État pour les actions Claude Code actives
  const [activeActions, setActiveActions] = React.useState<ClaudeCodeAction[]>([]);
  
  // Gestion des onglets avec valeurs par défaut pour éviter les erreurs
  const {
    tabs,
    activeTab,
    activeTabId,
    isLoading: tabsLoading,
    error: tabsError,
    addTab,
    switchTab,
    closeTab,
    renameTab,
    markTabDirty
  } = useChatTabs(workspaceId || '', user?.id || '');

  // Construire le contexte Claude Code depuis les props (mémorisé pour éviter les re-créations)
  const claudeContext = useMemo(() => ({
    selectedFile: selectedItem?.path,
    currentDirectory: selectedItem?.path ? selectedItem.path.split('/').slice(0, -1).join('/') : '/',
    investigationHistory: [],
    workspacePath: '/workspace',
    sessionId: activeTab?.sessionId
  }), [selectedItem?.path, activeTab?.sessionId]);

  const effectiveContext = context || claudeContext;

  // Hook de gestion de session pour l'onglet actif
  const {
    session,
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    createSession,
    updateContext
  } = useChatSession(workspaceId || '', effectiveContext, activeTab?.sessionId);

  // Gestion des callbacks - TOUS LES useEffect DOIVENT ÊTRE AVANT LES RETURNS
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (session?.id && onSessionCreated && session.id !== sessionId) {
      onSessionCreated(session.id);
    }
  }, [session?.id, onSessionCreated, sessionId]);

  // Mettre à jour le contexte quand selectedItem change
  useEffect(() => {
    if (selectedItem && activeTab) {
      const updatedContext: Partial<ClaudeCodeContext> = {
        selectedFile: selectedItem.path,
        currentDirectory: selectedItem.path ? selectedItem.path.split('/').slice(0, -1).join('/') : '/'
      };
      updateContext(updatedContext);
    }
  }, [selectedItem, activeTab, updateContext]);

  // Ajuster la hauteur du textarea automatiquement
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // VALIDATION DES PROPS - APRÈS TOUS LES HOOKS
  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-red-400">
        <p>Erreur: workspaceId est requis pour le composant UniversalChatPanel</p>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <p>Authentification requise...</p>
      </div>
    );
  }

  // Gestionnaire d'envoi de message (version simplifiée pour les tests)
  const handleSendMessage = async (content: string) => {
    try {
      // Créer le message utilisateur
      const userMessage = {
        id: `user_${Date.now()}`,
        role: 'user' as ChatRole,
        content: content,
        timestamp: new Date(),
        status: 'sent' as ChatStatus
      };

      // Ajouter le message utilisateur
      setLocalMessages(prev => [...prev, userMessage]);

      // Créer des actions Claude Code pour démonstration
      const investigationAction: ClaudeCodeAction = {
        type: 'investigation',
        status: 'in_progress',
        description: 'Analyse du code en cours...',
        progress: 0,
        startTime: new Date(),
        tools: ['codebase_search', 'grep', 'read_file'],
        files: [],
        details: `Investigation de: "${content}"`
      };

      setActiveActions([investigationAction]);

      // Simuler le progrès de l'action
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 20;
        setActiveActions(prev => prev.map(action => 
          action.type === 'investigation' 
            ? { ...action, progress, status: progress >= 100 ? 'completed' : 'in_progress' }
            : action
        ));
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Créer un message enrichi avec les résultats
          const enrichedMessage: EnrichedMessageType = {
            id: `agent_${Date.now()}`,
            role: 'assistant' as ChatRole,
            content: `J'ai analysé votre requête "${content}" et trouvé plusieurs éléments intéressants dans votre codebase.`,
            timestamp: new Date(),
            status: 'sent' as ChatStatus,
            actions: [{
              ...investigationAction,
              status: 'completed',
              progress: 100,
              endTime: new Date(),
              files: selectedItem ? [selectedItem.path || ''] : []
            }],
            codePreview: selectedItem ? {
              content: `// Exemple de code analysé
function analyzeCode(input: string) {
  // Cette fonction simule l'analyse du code
  console.log('Analyzing:', input);
  return {
    complexity: 'medium',
    suggestions: ['Optimiser les performances', 'Ajouter des tests']
  };
}`,
              language: 'typescript',
              highlightedLines: [2, 4],
              startLine: 1,
              endLine: 8
            } : undefined,
            analysisResults: selectedItem ? [{
              filePath: selectedItem.path || '/example.ts',
              language: 'typescript',
              complexity: 'medium' as const,
              dependencies: ['react', '@types/node'],
              functions: [
                {
                  name: 'analyzeCode',
                  lineStart: 1,
                  lineEnd: 8,
                  parameters: ['input: string'],
                  returnType: 'object'
                }
              ],
              classes: [],
              lastAnalyzed: new Date()
            }] : undefined,
            toolsUsed: [
              {
                name: 'codebase_search',
                description: 'Recherche sémantique dans la base de code',
                isActive: true,
                usageCount: 1
              },
              {
                name: 'read_file',
                description: 'Lecture et analyse de fichiers',
                isActive: true,
                usageCount: 1
              }
            ],
            investigationContext: {
              query: content,
              scope: selectedItem ? [selectedItem.path || ''] : ['workspace'],
              findings: ['Fonction analysée', 'Dépendances identifiées', 'Suggestions générées']
            }
          };

          setLocalMessages(prev => [...prev, enrichedMessage]);
          setActiveActions([]);
        }
      }, 500);

      // Déclencher callback d'investigation si défini
      if (onInvestigationStart) {
        onInvestigationStart(content);
      }

      // Marquer l'onglet comme modifié
      if (activeTab) {
        markTabDirty(activeTab.id, true);
      }

    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
    }
  };

  // Gestionnaire d'effacement
  const handleClear = () => {
    setLocalMessages([]);
    clearMessages();
  };

  // Gestionnaire d'export
  const handleExport = () => {
    if (messages.length === 0 && localMessages.length === 0) return;

    const allMessages = localMessages.length > 0 ? localMessages : messages;
    const exportData = {
      sessionId: activeTab?.sessionId,
      workspaceId: workspaceId,
      context: effectiveContext,
      messages: allMessages,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${activeTab?.sessionId || 'session'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Gestionnaire de paramètres (placeholder)
  const handleSettings = () => {
    console.log('Paramètres du chat (à implémenter)');
  };

  // Classes CSS selon le thème
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white' 
    : 'bg-white text-gray-900';

  // État des messages effectifs
  const effectiveIsLoading = isLoading;

  // Messages d'exemple pour tester l'affichage
  const testMessages = [
    {
      id: 'test-1',
      role: 'assistant' as ChatRole,
      content: 'Bonjour ! Je suis Claude, votre assistant IA spécialisé dans l\'analyse de code. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(),
      status: 'sent' as ChatStatus
    },
    {
      id: 'test-2', 
      role: 'user' as ChatRole,
      content: 'Pouvez-vous analyser ce fichier pour moi ?',
      timestamp: new Date(),
      status: 'sent' as ChatStatus
    },
    {
      id: 'test-3',
      role: 'assistant' as ChatRole,
      content: 'Bien sûr ! Je vois que vous avez sélectionné un fichier. Je vais l\'analyser pour vous et vous donner des insights sur le code.',
      timestamp: new Date(),
      status: 'sent' as ChatStatus
    }
  ];

  // Utiliser les messages locaux en priorité, puis les messages de session, puis les messages de test
  const displayMessages = localMessages.length > 0 
    ? localMessages 
    : messages.length > 0 
      ? messages 
      : testMessages;

  // Mode debug pour diagnostiquer les problèmes
  const debugInfo = {
    messagesCount: messages.length,
    localMessagesCount: localMessages.length,
    displayMessagesCount: displayMessages.length,
    isLoading: effectiveIsLoading,
    hasError: !!error,
    activeTabId,
    tabsCount: tabs.length,
    workspaceId,
    selectedItem: selectedItem?.name
  };

  console.log('UniversalChatPanel Debug:', debugInfo);

  // Gestionnaire de saisie
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Gestionnaire de soumission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !effectiveIsLoading) {
      handleSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  // Gestionnaire de touches
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-gray-900 text-white"
      style={{ minHeight: '400px' }}
    >
      {/* Barre d'onglets */}
      <ChatTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSwitch={switchTab}
        onTabClose={closeTab}
        onTabAdd={() => addTab(effectiveContext, agentType)}
        onTabRename={renameTab}
      />

      {/* Zone des messages - Style Cursor avec nouveaux composants */}
      <div className="flex-1 overflow-y-auto bg-gray-900">
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-medium mb-2">Claude Analyste</h3>
            <p className="text-sm text-center mb-6 max-w-md">
              Je suis votre assistant IA spécialisé dans l'analyse de code et l'exploration de codebase.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-center text-gray-500">
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-lg mb-1">💡</div>
                <p>Analyser le code</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-lg mb-1">🔍</div>
                <p>Explorer la codebase</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-lg mb-1">📝</div>
                <p>Améliorer la doc</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-lg mb-1">🚀</div>
                <p>Optimiser le code</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-4">
            {/* Indicateur des actions Claude Code actives */}
            {activeActions.length > 0 && (
              <ClaudeCodeIndicator actions={activeActions} />
            )}
            
            {/* Messages avec nouveau composant enrichi */}
            {displayMessages.map((message, index) => (
              <EnrichedMessage 
                key={message.id || index} 
                message={message as EnrichedMessageType}
              />
            ))}
            
            {/* Indicateur de chargement */}
            {effectiveIsLoading && (
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">Claude réfléchit...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone de saisie style Cursor */}
      <div className="border-t border-gray-700 bg-gray-800">
        <div className="p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                placeholder="Posez une question sur votre code ou demandez de l'aide..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                rows={1}
                disabled={effectiveIsLoading}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                Entrée pour envoyer • Shift+Entrée pour nouvelle ligne
              </div>
            </div>
                         <button
               type="submit"
               className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               disabled={effectiveIsLoading || !inputValue.trim()}
               onClick={handleSubmit}
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
               </svg>
             </button>
          </div>
          
                     {/* Suggestions rapides style Cursor */}
           {displayMessages.length === 0 && (
             <div className="mt-3 flex flex-wrap gap-2">
               {[
                 "Analysez ce fichier",
                 "Expliquez cette fonction", 
                 "Trouvez les dépendances",
                 "Identifiez les problèmes"
               ].map((suggestion, index) => (
                 <button
                   key={index}
                   className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                   disabled={effectiveIsLoading}
                   onClick={() => {
                     if (!effectiveIsLoading) {
                       handleSendMessage(suggestion);
                     }
                   }}
                 >
                   {suggestion}
                 </button>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* Indicateur d'erreur */}
      {(error || tabsError) && (
        <div className="p-4 bg-red-900/20 border-t border-red-500/20">
          <div className="flex items-center space-x-2 text-red-400">
            <span>⚠️</span>
            <span className="text-sm">{error?.message || tabsError?.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalChatPanel;
