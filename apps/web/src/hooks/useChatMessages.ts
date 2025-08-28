/**
 * Hook pour la gestion des messages de chat
 * Story 1.6.1 - Phase 1
 */

'use client';

import { useState, useCallback } from 'react';
import { 
  ChatMessage, 
  ChatError,
  UseChatMessagesResult
} from '@/types/chat/universal';

export function useChatMessages(
  initialMessages: ChatMessage[] = []
): UseChatMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);

  // Ajouter un message
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${message.role}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setError(null);
  }, []);

  // Mettre à jour un message
  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id 
        ? { ...msg, ...updates }
        : msg
    ));
  }, []);

  // Effacer tous les messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    addMessage,
    updateMessage,
    clearMessages
  };
}

