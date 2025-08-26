'use client';

import React from 'react';
import Editor from '@monaco-editor/react';
import RichTextEditor from '@/components/RichTextEditor';
import { 
  UniversalContentPanelProps, 
  ContentType, 
  MonacoConfig, 
  TipTapConfig 
} from '@/lib/types/universal-components';
import { TreeNodeBase } from '@/lib/types/common';

const UniversalContentPanel: React.FC<UniversalContentPanelProps> = ({
  selectedItem,
  content,
  mode,
  onChange,
  onSave,
  editorConfig,
  isLoading = false,
  isSaving = false
}) => {
  // Configuration pour Monaco Editor
  const monacoConfig = editorConfig as MonacoConfig;
  
  // Configuration pour TipTap Editor  
  const tipTapConfig = editorConfig as TipTapConfig;

  // Fonction pour déterminer le langage Monaco basé sur l'extension du fichier
  const getMonacoLanguage = (item: TreeNodeBase | null): string => {
    if (!item || !item.path) return 'plaintext';
    
    const extension = item.path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'md': 'markdown',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'dockerfile': 'dockerfile',
      'go': 'go',
      'rust': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kotlin': 'kotlin'
    };

    return languageMap[extension || ''] || 'plaintext';
  };

  // Fonction pour déterminer si c'est un fichier
  const isFile = (item: TreeNodeBase | null): boolean => {
    if (!item) return false;
    return item.type === 'file';
  };

  // Fonction pour déterminer si c'est un dossier
  const isFolder = (item: TreeNodeBase | null): boolean => {
    if (!item) return false;
    return item.type === 'directory' || item.type === 'folder';
  };

  // Composant Header avec informations du fichier
  const renderHeader = () => {
    if (!selectedItem) return null;

    return (
      <div className="p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {selectedItem.name}
            </h3>
            <p className="text-sm text-gray-400">
              {selectedItem.path}
              {mode === 'code' && selectedItem.type === 'file' && (
                <>
                  {' • '}
                  {getMonacoLanguage(selectedItem)}
                  {(selectedItem as any).size && ` • ${(selectedItem as any).size} octets`}
                </>
              )}
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center space-x-2 text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm">Sauvegarde...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rendu du contenu selon le mode
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Chargement du contenu...</p>
          </div>
        </div>
      );
    }

    if (!selectedItem) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {mode === 'code' ? '📄' : '📝'}
            </div>
            <p className="text-lg">
              {mode === 'code' ? 'Aucun fichier sélectionné' : 'Aucun document sélectionné'}
            </p>
            <p className="text-sm">
              {mode === 'code' 
                ? "Sélectionnez un fichier dans l'arborescence pour l'afficher"
                : "Sélectionnez un fichier dans l'arborescence pour l'éditer"
              }
            </p>
          </div>
        </div>
      );
    }

    if (isFolder(selectedItem)) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg">Dossier sélectionné</p>
            <p className="text-sm">
              {mode === 'code' 
                ? "Sélectionnez un fichier pour l'afficher."
                : "Sélectionnez un fichier pour l'éditer ou créez-en un nouveau."
              }
            </p>
          </div>
        </div>
      );
    }

    if (!isFile(selectedItem)) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <div className="text-6xl mb-4">❓</div>
            <p className="text-lg">Type d'élément non pris en charge</p>
          </div>
        </div>
      );
    }

    // Rendu selon le mode de contenu
    if (mode === 'code') {
      return (
        <Editor
          height="100%"
          theme={monacoConfig.theme || 'vs-dark'}
          language={getMonacoLanguage(selectedItem)}
          value={content}
          path={selectedItem.path}
          loading={
            <div className="flex items-center justify-center h-full text-gray-400">
              Chargement de l'éditeur...
            </div>
          }
          options={{
            readOnly: monacoConfig.readOnly ?? true,
            minimap: monacoConfig.minimap || { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: monacoConfig.wordWrap || 'on',
            lineNumbers: 'on',
            folding: true,
            automaticLayout: true,
            contextmenu: false,
            selectOnLineNumbers: true,
          }}
          beforeMount={(monaco) => {
            // Configuration du thème sombre personnalisé
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
          }}
          onChange={(value) => {
            if (onChange && !monacoConfig.readOnly) {
              onChange(value || '');
            }
          }}
        />
      );
    }

    if (mode === 'document') {
      return (
        <RichTextEditor
          content={content}
          onChange={onChange || (() => {})}
          onAutoSave={onSave}
          placeholder={tipTapConfig.placeholder || `Commencez à écrire dans ${selectedItem.name}...`}
        />
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-lg">Mode non supporté</p>
          <p className="text-sm">Mode de contenu '{mode}' non reconnu</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {renderHeader()}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default UniversalContentPanel;
