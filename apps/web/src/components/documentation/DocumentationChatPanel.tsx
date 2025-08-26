'use client';

import React from 'react';
import ChatPanel from '@/components/ChatPanel';
import { DocumentationNode, ChatMessage } from '@/lib/types/documentation';

interface DocumentationChatPanelProps {
  selectedFile: DocumentationNode | null;
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isLoading?: boolean;
  workspaceId: string;
}

export default function DocumentationChatPanel({
  selectedFile,
  onSendMessage,
  messages,
  isLoading = false,
  workspaceId,
}: DocumentationChatPanelProps) {
  return (
    <div className="h-full">
      <ChatPanel
        onSendMessage={onSendMessage}
        messages={messages}
        isLoading={isLoading}
        placeholder="Demandez de l'aide pour enrichir votre documentation..."
      />
    </div>
  );
}
