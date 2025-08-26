import { TreeNodeBase } from './common';

export interface DocumentationNode extends TreeNodeBase {
  type: 'folder' | 'file';
  content?: string; // pour fichiers .md, .doc, etc.
  fileExtension?: string; // extension du fichier (.md, .doc, etc.)
  parent_id?: string;
  children?: DocumentationNode[];
  metadata?: DocumentationMetadata;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentationMetadata {
  created_by: string;
  description?: string;
  tags?: string[];
  last_edited?: string;
  mimeType?: string; // pour différencier les types de fichiers
}

export interface DocumentationState {
  currentFile: DocumentationNode | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
}

export interface CreateDocumentationItemRequest {
  name: string;
  type: 'folder' | 'file';
  parent_id?: string;
  fileExtension?: string;
}

export interface UpdateDocumentationItemRequest {
  name?: string;
  parent_id?: string;
  order_index?: number;
}

export interface UpdateDocumentationContentRequest {
  content: string;
}

export interface DocumentationApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// Types pour React Arborist
export interface ArboristNodeData {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: ArboristNodeData[];
  isEditable?: boolean;
  isSelected?: boolean;
}

// Types pour les actions CRUD
export interface DocumentationCRUDActions {
  onCreate: (params: { parentId?: string; index?: number; type: 'folder' | 'file' }) => Promise<void>;
  onRename: (params: { id: string; name: string }) => Promise<void>;
  onMove: (params: { dragIds: string[]; parentId?: string; index: number }) => Promise<void>;
  onDelete: (params: { ids: string[] }) => Promise<void>;
  onSelect: (node: DocumentationNode) => void;
}

// Types pour TipTap
export interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onAutoSave?: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

// Types pour le panneau de chat
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatPanelProps {
  onSendMessage: (message: string) => void;
  messages: ChatMessage[];
  isLoading?: boolean;
  placeholder?: string;
}
