import { TreeNodeBase } from './common';
import { FileTreeNode } from './context';
import { DocumentationNode, ChatMessage } from './documentation';

// =====================================
// Types pour les modes des composants
// =====================================

export type PanelMode = 'readonly' | 'editable';
export type ContentType = 'code' | 'document';
export type AgentType = 'analysis' | 'documentation';

// =====================================
// Configuration du Layout
// =====================================

export interface ThreePanelsLayoutConfig {
  defaultSizes?: [number, number, number]; // ex: [25, 50, 25]
  minSizes?: [number, number, number];     // ex: [15, 30, 15] 
  maxSizes?: [number, number, number];     // ex: [40, 70, 40]
  persistKey?: string;                     // pour sauvegarde layout
}

// =====================================
// Configuration UniversalTreePanel
// =====================================

export interface TreeIconConfig {
  folder: string;
  file: string;
  folderOpen?: string;
}

export interface TreeContextAction {
  id: string;
  label: string;
  icon: string;
  action: (nodeId: string) => void;
}

export interface TreeCRUDActions<T extends TreeNodeBase> {
  onCreate: (params: { parentId?: string; index?: number; type: string }) => Promise<void>;
  onRename: (params: { id: string; name: string }) => Promise<void>;
  onMove: (params: { dragIds: string[]; parentId?: string; index: number }) => Promise<void>;
  onDelete: (params: { ids: string[] }) => Promise<void>;
}

export interface UniversalTreePanelProps<T extends TreeNodeBase> {
  data: T[];
  selectedId?: string;
  mode: PanelMode;
  onSelect: (node: T | null) => void;
  
  // Conditionnel selon mode
  crudActions?: TreeCRUDActions<T>;  // Si mode = 'editable'
  
  // Configuration UI
  config: {
    title: string;
    showCount: boolean;
    icons: TreeIconConfig;
    contextActions?: TreeContextAction[];
  };
  
  // Props additionnelles
  workspaceId?: string;
  isLoading?: boolean;
  onError?: (error: string) => void;
  onTreeUpdate?: () => void;
}

// =====================================
// Configuration UniversalContentPanel
// =====================================

export interface MonacoConfig {
  language?: string;
  theme?: string;
  readOnly?: boolean;
  minimap?: { enabled: boolean };
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
}

export interface TipTapConfig {
  placeholder?: string;
  editable?: boolean;
  extensions?: any[];
  editorProps?: Record<string, any>;
}

export interface UniversalContentPanelProps {
  selectedItem: TreeNodeBase | null;
  content: string;
  mode: ContentType;
  
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  
  // Configuration selon mode
  editorConfig: MonacoConfig | TipTapConfig;
  
  // États communs
  isLoading?: boolean;
  isSaving?: boolean;
}

// =====================================
// Configuration UniversalChatPanel
// =====================================

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AgentConfig {
  systemPrompt: string;
  suggestions: string[];
  capabilities: AgentCapability[];
}

export interface UniversalChatPanelProps {
  agentType: AgentType;
  selectedItem?: TreeNodeBase | null;
  workspaceId: string;
  
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isLoading?: boolean;
  
  // Configuration agent IA (Story 1.6)
  agentConfig?: AgentConfig;
}

// =====================================
// Types union pour compatibilité
// =====================================

export type UniversalTreeNode = FileTreeNode | DocumentationNode;

// =====================================
// Constantes de configuration
// =====================================

export const DEFAULT_LAYOUT_CONFIG: ThreePanelsLayoutConfig = {
  defaultSizes: [25, 50, 25],
  minSizes: [15, 30, 15],
  maxSizes: [40, 70, 40]
};

export const CODE_ICONS: TreeIconConfig = {
  folder: '📁',
  file: '📄',
  folderOpen: '📂'
};

export const DOC_ICONS: TreeIconConfig = {
  folder: '📂',
  file: '📝',
  folderOpen: '📂'
};

export const MONACO_CONFIG: MonacoConfig = {
  theme: 'vs-dark',
  readOnly: true,
  minimap: { enabled: false },
  wordWrap: 'on'
};

export const TIPTAP_CONFIG: TipTapConfig = {
  placeholder: 'Commencez à écrire votre documentation...',
  editable: true
};

// =====================================
// Configuration des agents IA (Préparation Story 1.6)
// =====================================

export const ANALYSIS_AGENT_CONFIG: AgentConfig = {
  systemPrompt: "Tu es un assistant IA spécialisé dans l'analyse de code et l'exploration de codebase.",
  suggestions: [
    "Explique-moi ce code",
    "Trouve les dépendances",
    "Identifie les problèmes potentiels",
    "Propose des améliorations"
  ],
  capabilities: [
    { id: 'code-analysis', name: 'Analyse de Code', description: 'Analyse du code sélectionné', enabled: true },
    { id: 'dependency-tracking', name: 'Suivi Dépendances', description: 'Identification des dépendances', enabled: true },
    { id: 'security-scan', name: 'Scan Sécurité', description: 'Détection problèmes sécurité', enabled: true }
  ]
};

export const DOCUMENTATION_AGENT_CONFIG: AgentConfig = {
  systemPrompt: "Tu es un assistant IA spécialisé dans la création et l'enrichissement de documentation.",
  suggestions: [
    "Améliore cette documentation",
    "Ajoute des exemples",
    "Restructure le contenu",
    "Génère du contenu manquant"
  ],
  capabilities: [
    { id: 'doc-enhancement', name: 'Amélioration Doc', description: 'Amélioration de la documentation', enabled: true },
    { id: 'content-generation', name: 'Génération Contenu', description: 'Génération de contenu', enabled: true },
    { id: 'structure-optimization', name: 'Optimisation Structure', description: 'Optimisation de la structure', enabled: true }
  ]
};
