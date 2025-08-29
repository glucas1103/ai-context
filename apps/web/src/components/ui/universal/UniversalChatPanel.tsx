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
import { useSimpleClaudeCode } from '@/hooks/useSimpleClaudeCode';
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

  // Hook Claude Code Ultra-Simple - RÉVISÉ Story 1.6.2
  const claudeCode = useSimpleClaudeCode({
    workspaceId: workspaceId || '',
    sessionId: activeTab?.sessionId, // Session ID de l'onglet actif
    // API key gérée côté serveur pour la sécurité - pas d'exposition côté client
    apiKey: undefined
  });

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

  // Gestionnaire d'envoi de message avec Claude Code SDK - Story 1.6.2
  const handleSendMessage = async (content: string) => {
    try {
      // Vérifier qu'on a une session active
      if (!activeTab?.sessionId) {
        console.error('Aucune session active');
        return;
      }

      // Déclencher callback d'investigation si défini
      if (onInvestigationStart) {
        onInvestigationStart(content);
      }

      // Utiliser Claude Code SDK directement - Version simplifiée
      try {
        const response = await claudeCode.sendMessage(content);

        // Créer un message enrichi simple
        const enrichedMessage: EnrichedMessageType = {
          id: `assistant_${Date.now()}`,
          role: 'assistant' as ChatRole,
          content: response,
          timestamp: new Date(),
          status: 'sent' as ChatStatus,
          metadata: {
            claudeActions: ['investigation'],
            toolsUsed: ['Claude Code SDK']
          }
        };

        // Ajouter le message enrichi à la liste locale pour l'affichage immédiat
        setLocalMessages(prev => [...prev, enrichedMessage]);

        // Marquer l'onglet comme modifié
        if (activeTab) {
          markTabDirty(activeTab.id, true);
        }

        // Déclencher callback de fin d'investigation si défini
        if (onInvestigationComplete) {
          const results = [{
            tool: 'Claude Code SDK',
            query: content,
            result: 'Investigation terminée',
            files: [effectiveContext.selectedFile || effectiveContext.workspacePath || '']
          }];
          onInvestigationComplete(results);
        }
      } catch (error) {
        console.error('Erreur Claude Code:', error);
        // Afficher un message d'erreur simple
        const errorMessage: EnrichedMessageType = {
          id: `error_${Date.now()}`,
          role: 'assistant' as ChatRole,
          content: 'Désolé, j\'ai rencontré une erreur lors de l\'analyse de votre demande. Pouvez-vous réessayer ?',
          timestamp: new Date(),
          status: 'error' as ChatStatus
        };
        setLocalMessages(prev => [...prev, errorMessage]);
      }

    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      
      // Créer un message d'erreur
      const errorMessage: EnrichedMessageType = {
        id: `error_${Date.now()}`,
        role: 'assistant' as ChatRole,
        content: 'Désolé, j\'ai rencontré une erreur lors de l\'analyse de votre demande. Pouvez-vous reformuler votre question ?',
        timestamp: new Date(),
        status: 'error' as ChatStatus,
        actions: [{
          type: 'investigation',
          status: 'failed',
          description: 'Erreur lors de l\'investigation',
          progress: 0,
          startTime: new Date(),
          endTime: new Date(),
          tools: [],
          files: [],
          details: err instanceof Error ? err.message : 'Erreur inconnue'
        }]
      };

      setLocalMessages(prev => [...prev, errorMessage]);
      setActiveActions([]);
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
            <h3 className="text-xl font-medium mb-2">Claude Code Assistant</h3>
            <p className="text-sm text-center mb-6 max-w-md">
              Je suis votre assistant IA avec <strong>investigation autonome</strong> de votre codebase. 
              Je peux explorer, analyser et comprendre votre code automatiquement.
            </p>
            <div className="mb-4 text-xs text-center">
              <div className="inline-flex items-center space-x-2 bg-blue-900/20 px-3 py-1 rounded-full border border-blue-500/20">
                <span className="text-blue-400">⚡</span>
                <span>Alimenté par Claude Code SDK</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-center text-gray-500">
              <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="text-lg mb-1">🔍</div>
                <p>Investigation autonome</p>
                <p className="text-xs text-gray-600 mt-1">Read, Grep, Glob, LS</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="text-lg mb-1">🧠</div>
                <p>Raisonnement multi-étapes</p>
                <p className="text-xs text-gray-600 mt-1">Analyse transparente</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="text-lg mb-1">📊</div>
                <p>Analyse avancée</p>
                <p className="text-xs text-gray-600 mt-1">Code & architecture</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="text-lg mb-1">📝</div>
                <p>Documentation auto</p>
                <p className="text-xs text-gray-600 mt-1">Génération intelligente</p>
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
          
                     {/* Suggestions rapides Claude Code - Story 1.6.2 */}
           {displayMessages.length === 0 && (
             <div className="mt-3 flex flex-wrap gap-2">
               {[
                 "Analysez l'architecture de ce projet",
                 "Investiguer les patterns de sécurité", 
                 "Explorer les dépendances critiques",
                 "Identifier les problèmes de performance",
                 "Générer la documentation manquante",
                 "Expliquer ce composant React"
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
export { UniversalChatPanel };
