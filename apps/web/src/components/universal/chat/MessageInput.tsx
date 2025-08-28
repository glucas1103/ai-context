/**
 * Composant MessageInput - Story 1.6.1 Phase 2
 * Zone de saisie avec support markdown et raccourcis clavier
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageInputProps } from '@/types/chat/universal';

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Posez une question ou demandez de l\'aide...',
  maxHeight = '120px',
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajuster automatiquement la hauteur du textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeightPx = parseInt(maxHeight.replace('px', ''));
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeightPx)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, maxHeight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      
      // Reset hauteur du textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Suggestions prédéfinies
  const suggestions = [
    "Analysez ce fichier",
    "Expliquez cette fonction",
    "Trouvez les dépendances",
    "Identifiez les problèmes",
    "Améliorez cette documentation",
    "Générez des exemples"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      onSendMessage(suggestion);
    }
  };

  return (
    <div className={`border-t border-gray-700 bg-gray-800 ${className}`}>
      {/* Suggestions rapides */}
      {inputValue === '' && (
        <div className="px-4 py-2 border-b border-gray-700">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zone de saisie */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{ maxHeight }}
            />
            
            {/* Indicateur de support markdown */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              Markdown supporté
            </div>
          </div>

          {/* Bouton d'envoi */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Envoi...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="hidden sm:inline">Envoyer</span>
              </>
            )}
          </button>
        </div>

        {/* Raccourcis clavier */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          <kbd className="px-1 py-0.5 bg-gray-700 rounded">Enter</kbd> pour envoyer • 
          <kbd className="px-1 py-0.5 bg-gray-700 rounded ml-1">Shift+Enter</kbd> pour nouvelle ligne
        </div>
      </form>
    </div>
  );
};

export default MessageInput;

