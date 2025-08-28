/**
 * Composant MessageList - Story 1.6.1 Phase 2
 * Affichage optimisé des messages avec auto-scroll
 */

'use client';

import React, { useEffect, useRef } from 'react';
import Message from './Message';
import { MessageListProps } from '@/types/chat/universal';

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  autoScroll = true,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, autoScroll]);

  const LoadingIndicator = () => (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center space-x-2 text-gray-400">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <span className="text-sm ml-2">Claude réfléchit...</span>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
      <div className="text-6xl mb-4">🤖</div>
      <h3 className="text-lg font-medium mb-2">Bonjour !</h3>
      <p className="text-sm text-center mb-4 max-w-md">
        Je suis Claude, votre assistant IA spécialisé dans l'analyse de code et la documentation.
      </p>
      <div className="text-xs text-center text-gray-600 space-y-1">
        <p>💡 Je peux analyser votre code et répondre à vos questions</p>
        <p>📝 Je peux vous aider à améliorer votre documentation</p>
        <p>🔍 Je peux investiguer votre codebase de manière autonome</p>
      </div>
    </div>
  );

  return (
    <div className={`flex-1 overflow-hidden ${className}`}>
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-y-auto px-4 py-3 space-y-4 bg-gray-900"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((message) => (
              <Message 
                key={message.id} 
                message={message}
              />
            ))}
            
            {isLoading && <LoadingIndicator />}
            
            {/* Élément invisible pour le scroll automatique */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default MessageList;

