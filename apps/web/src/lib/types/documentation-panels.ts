// Types pour les composants panel de documentation
import { DocumentationNode, ChatMessage } from './documentation';

export interface DocumentationTreePanelProps {
  data: DocumentationNode[];
  selectedId?: string;
  onSelect: (node: DocumentationNode | null) => void;
  workspaceId: string;
  onTreeUpdate: () => Promise<void>;
  isLoading?: boolean;
  onError: (error: string) => void;
}

export interface DocumentationContentPanelProps {
  selectedFile: DocumentationNode | null;
  content: string;
  onChange: (content: string) => void;
  onAutoSave: (content: string) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
}

export interface DocumentationChatPanelProps {
  selectedFile: DocumentationNode | null;
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isLoading?: boolean;
  workspaceId: string;
}

export interface CreateModalState {
  isOpen: boolean;
  type: 'folder' | 'file' | null;
  parentId?: string;
}

export interface DocumentationModalsProps {
  createModal: CreateModalState;
  onCreateFolder: (name: string, parentId?: string) => Promise<void>;
  onCreateFile: (name: string, parentId?: string) => Promise<void>;
  onClose: () => void;
}
