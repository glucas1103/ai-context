'use client';

import React from 'react';
import ChatPanel from '@/components/workspace/ChatPanel';
import { 
  UniversalChatPanelProps, 
  AgentType,
  ANALYSIS_AGENT_CONFIG,
  DOCUMENTATION_AGENT_CONFIG 
} from '@/lib/types/universal-components';
import { ChatMessage } from '@/lib/types/documentation';

const UniversalChatPanel: React.FC<UniversalChatPanelProps> = ({
  agentType,
  selectedItem,
  workspaceId,
  onSendMessage,
  messages,
  isLoading = false,
  agentConfig
}) => {
  // Configuration par défaut selon le type d'agent
  const getDefaultConfig = (type: AgentType) => {
    switch (type) {
      case 'analysis':
        return ANALYSIS_AGENT_CONFIG;
      case 'documentation':
        return DOCUMENTATION_AGENT_CONFIG;
      default:
        return ANALYSIS_AGENT_CONFIG;
    }
  };

  // Utiliser la configuration fournie ou celle par défaut
  const config = agentConfig || getDefaultConfig(agentType);

  // Génération du placeholder contextuel
  const getPlaceholder = (): string => {
    const basePrompts = {
      analysis: "Posez une question sur le code sélectionné...",
      documentation: "Demandez de l'aide pour enrichir votre documentation..."
    };

    if (selectedItem) {
      const contexts = {
        analysis: `Analysez le fichier ${selectedItem.name}...`,
        documentation: `Améliorez la documentation de ${selectedItem.name}...`
      };
      return contexts[agentType];
    }

    return basePrompts[agentType];
  };

  // Génération des suggestions contextuelles
  const getContextualSuggestions = (): string[] => {
    if (!selectedItem) {
      return config.suggestions;
    }

    // Suggestions spécifiques selon le contexte et le type d'agent
    const contextualSuggestions = {
      analysis: [
        `Explique-moi le code de ${selectedItem.name}`,
        `Trouve les dépendances de ${selectedItem.name}`,
        `Identifie les problèmes dans ${selectedItem.name}`,
        `Propose des améliorations pour ${selectedItem.name}`
      ],
      documentation: [
        `Améliore la documentation de ${selectedItem.name}`,
        `Ajoute des exemples à ${selectedItem.name}`,
        `Restructure le contenu de ${selectedItem.name}`,
        `Génère du contenu manquant pour ${selectedItem.name}`
      ]
    };

    return contextualSuggestions[agentType];
  };

  // Fonction pour enrichir le message avec le contexte
  const handleSendMessage = async (message: string) => {
    // Enrichir le message avec le contexte si un élément est sélectionné
    let enrichedMessage = message;
    
    if (selectedItem) {
      const contextInfo = `[Contexte: ${selectedItem.type} "${selectedItem.name}" - ${selectedItem.path}]`;
      enrichedMessage = `${contextInfo}\n\n${message}`;
    }

    await onSendMessage(enrichedMessage);
  };

  return (
    <div className="h-full bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header avec informations de l'agent */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">
            {agentType === 'analysis' ? '🔍' : '📝'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {agentType === 'analysis' ? 'Assistant Analyse' : 'Assistant Documentation'}
            </h2>
            <p className="text-xs text-gray-400">
              {agentType === 'analysis' 
                ? 'Exploration et analyse de code'
                : 'Aide à la rédaction et amélioration'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Contexte sélectionné */}
      {selectedItem && (
        <div className="p-3 border-b border-gray-700 bg-gray-900/50">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Contexte:</span>
            <span className="text-sm text-white font-medium">{selectedItem.name}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{selectedItem.path}</p>
        </div>
      )}

      {/* Suggestions contextuelles */}
      {!isLoading && messages.length === 0 && (
        <div className="p-3 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Suggestions:</p>
          <div className="space-y-1">
            {getContextualSuggestions().slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(suggestion)}
                className="w-full text-left px-2 py-1 text-xs text-blue-300 hover:text-blue-200 hover:bg-gray-700 rounded transition-colors"
              >
                💡 {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Panel de chat principal */}
      <div className="flex-1">
        <ChatPanel
          onSendMessage={handleSendMessage}
          messages={messages}
          isLoading={isLoading}
          placeholder={getPlaceholder()}
        />
      </div>

      {/* Capacités de l'agent (info) */}
      {config.capabilities.length > 0 && (
        <div className="p-2 border-t border-gray-700 bg-gray-900/30">
          <div className="flex flex-wrap gap-1">
            {config.capabilities.filter(cap => cap.enabled).map((capability) => (
              <span
                key={capability.id}
                className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded border border-blue-700/30"
                title={capability.description}
              >
                {capability.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalChatPanel;
