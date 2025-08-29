/**
 * Composant EnrichedMessage - Phase 7 Story 1.6.1
 * Affichage avancé des messages avec métadonnées Claude Code, preview de code et indicateurs d'actions
 */

'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  EnrichedMessage as EnrichedMessageType, 
  ChatRole, 
  ClaudeCodeAction,
  CodePreview,
  FileAnalysisResult
} from '@/types/chat/universal';

interface EnrichedMessageProps {
  message: EnrichedMessageType;
  className?: string;
}

const EnrichedMessage: React.FC<EnrichedMessageProps> = ({ 
  message, 
  className = '' 
}) => {
  const [expandedActions, setExpandedActions] = useState<string[]>([]);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<FileAnalysisResult | null>(null);

  // Fonction pour formater l'heure du message
  const formatTimestamp = (timestamp: Date | string | null | undefined): string => {
    try {
      if (!timestamp) return '--:--';
      
      const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      
      if (isNaN(dateObj.getTime())) {
        return '--:--';
      }
      
      return dateObj.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '--:--';
    }
  };

  // Fonction pour obtenir l'icône d'action
  const getActionIcon = (type: ClaudeCodeAction['type']) => {
    switch (type) {
      case 'investigation': return '🔍';
      case 'analysis': return '📊';
      case 'refactoring': return '🔧';
      case 'documentation': return '📝';
      default: return '⚙️';
    }
  };

  // Fonction pour obtenir la couleur de statut
  const getStatusColor = (status: ClaudeCodeAction['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'in_progress': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Fonction pour basculer l'expansion d'une action
  const toggleActionExpansion = (actionId: string) => {
    setExpandedActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  // Composant pour afficher une action Claude Code
  const ActionIndicator: React.FC<{ action: ClaudeCodeAction; index: number }> = ({ action, index }) => {
    const actionId = `${message.id}-action-${index}`;
    const isExpanded = expandedActions.includes(actionId);

    return (
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleActionExpansion(actionId)}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getActionIcon(action.type)}</span>
            <span className="text-sm font-medium text-white">{action.description}</span>
            <span className={`text-xs ${getStatusColor(action.status)}`}>
              {action.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {action.progress !== undefined && (
              <div className="flex items-center space-x-1">
                <div className="w-16 h-1 bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${action.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{action.progress}%</span>
              </div>
            )}
            <button className="text-gray-400 hover:text-white">
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400">Outils utilisés:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {action.tools.map((tool, idx) => (
                    <span key={idx} className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Fichiers analysés:</span>
                <div className="mt-1 text-gray-300">
                  {action.files.length > 0 ? (
                    action.files.slice(0, 3).map((file, idx) => (
                      <div key={idx} className="truncate">{file}</div>
                    ))
                  ) : (
                    <span>Aucun fichier</span>
                  )}
                  {action.files.length > 3 && (
                    <div className="text-gray-500">+{action.files.length - 3} autres</div>
                  )}
                </div>
              </div>
            </div>
            {action.details && (
              <div className="mt-2">
                <span className="text-gray-400">Détails:</span>
                <p className="text-sm text-gray-300 mt-1">{action.details}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Composant pour afficher le preview de code
  const CodePreviewComponent: React.FC<{ preview: CodePreview }> = ({ preview }) => (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-300">
          Preview de code ({preview.language})
        </span>
        <button 
          className="text-gray-400 hover:text-white text-xs"
          onClick={() => setShowCodePreview(!showCodePreview)}
        >
          {showCodePreview ? 'Réduire' : 'Agrandir'}
        </button>
      </div>
      <div className={showCodePreview ? 'h-64' : 'h-32'}>
        <Editor
          height="100%"
          language={preview.language}
          value={preview.content}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: false,
            automaticLayout: true,
            contextmenu: false,
          }}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('custom-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#111827',
              }
            });
          }}
          onMount={(editor, monaco) => {
            monaco.editor.setTheme('custom-dark');
            
            // Surligner les lignes spécifiées
            if (preview.highlightedLines && preview.highlightedLines.length > 0) {
              const decorations = preview.highlightedLines.map(lineNumber => ({
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                  isWholeLine: true,
                  className: 'highlighted-line',
                  glyphMarginClassName: 'highlighted-glyph'
                }
              }));
              editor.deltaDecorations([], decorations);
            }
          }}
        />
      </div>
    </div>
  );

  // Composant pour afficher les résultats d'analyse
  const AnalysisResults: React.FC<{ results: FileAnalysisResult[] }> = ({ results }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-300">Analyses de fichiers:</h4>
      <div className="grid grid-cols-1 gap-2">
        {results.map((result, index) => (
          <div 
            key={index} 
            className="bg-gray-800 rounded p-3 border border-gray-700 cursor-pointer hover:border-gray-600"
            onClick={() => setSelectedAnalysis(selectedAnalysis === result ? null : result)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white truncate">{result.filePath}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  result.complexity === 'high' ? 'bg-red-900 text-red-300' :
                  result.complexity === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                  'bg-green-900 text-green-300'
                }`}>
                  {result.complexity}
                </span>
              </div>
              <span className="text-xs text-gray-400">{result.language}</span>
            </div>
            {selectedAnalysis === result && (
              <div className="mt-3 pt-3 border-t border-gray-600 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Fonctions: </span>
                    <span className="text-white">{result.functions.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Classes: </span>
                    <span className="text-white">{result.classes.length}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Dépendances: </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {result.dependencies.slice(0, 5).map((dep, idx) => (
                        <span key={idx} className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                          {dep}
                        </span>
                      ))}
                      {result.dependencies.length > 5 && (
                        <span className="text-gray-500">+{result.dependencies.length - 5}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Rendu principal du message
  return (
    <div className={`flex flex-col ${className}`}>
      {message.role === 'user' ? (
        /* Message utilisateur - Bulle bleue (inchangé) */
        <div className="flex justify-end mb-4">
          <div className="max-w-3xl">
            <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      ) : (
        /* Message assistant enrichi - Nouvelles fonctionnalités */
        <div className="mb-6">
          {/* Actions Claude Code en cours */}
          {message.actions && message.actions.length > 0 && (
            <div className="mb-4">
              <div className="space-y-2">
                {message.actions.map((action, index) => (
                  <ActionIndicator key={index} action={action} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Contenu du message principal */}
          <div className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">
            {message.content}
          </div>

          {/* Preview de code si disponible */}
          {message.codePreview && (
            <div className="mt-4">
              <CodePreviewComponent preview={message.codePreview} />
            </div>
          )}

          {/* Résultats d'analyse si disponibles */}
          {message.analysisResults && message.analysisResults.length > 0 && (
            <div className="mt-4">
              <AnalysisResults results={message.analysisResults} />
            </div>
          )}

          {/* Contexte d'investigation si disponible */}
          {message.investigationContext && (
            <div className="mt-4 bg-gray-800 rounded-lg p-3 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Investigation:</h4>
              <div className="text-xs text-gray-400">
                <div><strong>Requête:</strong> {message.investigationContext.query}</div>
                <div><strong>Périmètre:</strong> {message.investigationContext.scope.join(', ')}</div>
                <div><strong>Résultats:</strong> {message.investigationContext.findings.length} éléments trouvés</div>
              </div>
            </div>
          )}

          {/* Outils utilisés */}
          {message.toolsUsed && message.toolsUsed.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Outils utilisés:</span>
                <div className="flex flex-wrap gap-1">
                  {message.toolsUsed.map((tool, index) => (
                    <span 
                      key={index}
                      className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300"
                      title={tool.description}
                    >
                      {tool.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Actions sur le message (existantes) */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <button className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors">
                Copier
              </button>
              <button className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors">
                Réutiliser
              </button>
              {message.codePreview && (
                <button 
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                  onClick={() => setShowCodePreview(!showCodePreview)}
                >
                  {showCodePreview ? 'Réduire code' : 'Voir code'}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrichedMessage;
