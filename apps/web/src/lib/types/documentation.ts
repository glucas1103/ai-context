export interface DocumentationNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string; // chemin virtuel (ex: "/architecture/database.md")
  content?: string; // pour fichiers .md, .doc, etc.
  fileExtension?: string; // extension du fichier (.md, .doc, etc.)
  parent_id?: string;
  children?: DocumentationNode[];
  metadata?: {
    created_by: string;
    description?: string;
    tags?: string[];
    last_edited?: string;
    mimeType?: string; // pour différencier les types de fichiers
  };
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentationState {
  currentFile: DocumentationNode | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
}

export interface CreateDocumentationRequest {
  workspace_id: string;
  parent_id?: string;
  name: string;
  type: 'folder' | 'file';
  content?: string;
}

export interface UpdateDocumentationRequest {
  name?: string;
  content?: string;
  parent_id?: string;
  order_index?: number;
}

export interface MoveDocumentationRequest {
  parent_id?: string;
  order_index: number;
}
