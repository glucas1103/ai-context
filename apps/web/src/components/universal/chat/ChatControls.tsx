/**
 * Composant ChatControls - Story 1.6.1 Phase 2
 * Contrôles pour le chat (clear, export, settings)
 */

'use client';

import React, { useState } from 'react';
import { ChatControlsProps } from '@/types/chat/universal';

const ChatControls: React.FC<ChatControlsProps> = ({
  onClear,
  onExport,
  onSettings,
  className = ''
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleClearClick = () => {
    if (onClear) {
      if (showConfirmClear) {
        onClear();
        setShowConfirmClear(false);
      } else {
        setShowConfirmClear(true);
        // Auto-hide confirmation après 3 secondes
        setTimeout(() => setShowConfirmClear(false), 3000);
      }
    }
  };

  const handleExportClick = () => {
    if (onExport) {
      onExport();
    }
  };

  const handleSettingsClick = () => {
    if (onSettings) {
      onSettings();
    }
  };

  return (
    <div className={`flex items-center justify-between p-2 border-t border-gray-700 bg-gray-800/50 ${className}`}>
      {/* Contrôles de gauche */}
      <div className="flex items-center space-x-2">
        {onClear && (
          <button
            onClick={handleClearClick}
            className={`p-2 rounded-lg transition-colors ${
              showConfirmClear
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
            }`}
            title={showConfirmClear ? 'Confirmer la suppression' : 'Effacer la conversation'}
          >
            {showConfirmClear ? (
              <span className="text-xs font-medium">Confirmer ?</span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        )}

        {onExport && (
          <button
            onClick={handleExportClick}
            className="p-2 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-lg transition-colors"
            title="Exporter la conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Indicateurs du milieu */}
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <span>🧠</span>
          <span>Claude-3.5-Sonnet</span>
        </div>
        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
        <div className="flex items-center space-x-1">
          <span>⚡</span>
          <span>Streaming activé</span>
        </div>
      </div>

      {/* Contrôles de droite */}
      <div className="flex items-center space-x-2">
        {onSettings && (
          <button
            onClick={handleSettingsClick}
            className="p-2 hover:bg-gray-700 text-gray-400 hover:text-gray-200 rounded-lg transition-colors"
            title="Paramètres"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Indicateur de version */}
        <div className="text-xs text-gray-600 font-mono">
          v1.6.1
        </div>
      </div>
    </div>
  );
};

export default ChatControls;

