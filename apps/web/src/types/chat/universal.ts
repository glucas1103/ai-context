/**
 * Types pour le composant UniversalChatPanel optimisé pour Claude Code
 * Conforme à la Story 1.6.1 et au SDK TypeScript Anthropic officiel
 */

// =====================================
// Types de base pour Claude Code
// =====================================

export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatStatus = 'sending' | 'sent' | 'error' | 'investigating' | 'reasoning';
export type AgentType = 'analysis' | 'documentation';

// =====================================
// Contexte Claude Code
// =====================================

export interface ClaudeCodeContext {
  selectedFile?: string;
  currentDirectory?: string;
  investigationHistory?: InvestigationStep[];
  workspacePath?: string;
  sessionId?: string;
}

export interface InvestigationStep {
  tool: string;
  query: string;
  result: any;
  timestamp: Date;
  duration: number;
}

export interface ReasoningStep {
  step: number;
  thought: string;
  action?: string;
  timestamp: Date;
}

export interface InvestigationResult {
  tool: string;
  query: string;
  result: any;
  files: string[];
}

// =====================================
// Messages Claude Code
// =====================================

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date | string | null | undefined; // Support pour les dates venant de Supabase (string) et valeurs invalides
  metadata?: {
    // Métadonnées spécifiques Claude Code
    claudeActions?: string[];
    filesAnalyzed?: string[];
    investigationSteps?: InvestigationStep[];
    reasoningSteps?: ReasoningStep[];
    toolsUsed?: string[];
    [key: string]: any;
  };
  status?: ChatStatus;
}

// =====================================
// Sessions Claude Code
// =====================================

export interface ChatSession {
  id: string;
  workspaceId: string;
  context: ClaudeCodeContext;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  // Propriétés pour la gestion des onglets
  tabOrder?: number;
  isActive?: boolean;
  isDirty?: boolean;
  title?: string;
  agentId?: string;
}

// =====================================
// Callbacks et événements
// =====================================

export interface ChatCallbacks {
  onMessageSent?: (message: ChatMessage) => void;
  onMessageReceived?: (message: ChatMessage) => void;
  onSessionCreated?: (sessionId: string) => void;
  onError?: (error: ChatError) => void;
  onInvestigationStart?: (query: string) => void;
  onInvestigationComplete?: (results: InvestigationResult[]) => void;
}

export interface ChatError {
  code: string;
  message: string;
  details?: any;
}

// =====================================
// Configuration UniversalChatPanel
// =====================================

export interface UniversalChatPanelProps {
  // Configuration Claude Code
  sessionId?: string;
  workspaceId?: string;
  context?: ClaudeCodeContext;
  
  // Callbacks Claude Code
  onMessageSent?: (message: ChatMessage) => void;
  onMessageReceived?: (message: ChatMessage) => void;
  onSessionCreated?: (sessionId: string) => void;
  onError?: (error: ChatError) => void;
  onInvestigationStart?: (query: string) => void;
  onInvestigationComplete?: (results: InvestigationResult[]) => void;
  
  // UI Configuration
  showHeader?: boolean;
  showControls?: boolean;
  autoScroll?: boolean;
  maxHeight?: string;
  
  // Styling
  className?: string;
  theme?: 'light' | 'dark';
}

// =====================================
// Sous-composants
// =====================================

export interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  autoScroll?: boolean;
  className?: string;
}

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxHeight?: string;
  className?: string;
}

export interface ChatHeaderProps {
  sessionId?: string;
  agentType?: AgentType;
  isConnected?: boolean;
  className?: string;
}

export interface MessageProps {
  message: ChatMessage;
  className?: string;
}

export interface ChatControlsProps {
  onClear?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  className?: string;
}

// =====================================
// Hooks et gestion d'état
// =====================================

export interface UseChatSessionResult {
  session: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: ChatError | null;
  
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  createSession: (context: ClaudeCodeContext) => Promise<string>;
  updateContext: (context: Partial<ClaudeCodeContext>) => void;
  loadSession: (sessionId: string) => Promise<void>;
}

export interface UseChatMessagesResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: ChatError | null;
  
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
}

// =====================================
// Services de persistance
// =====================================

export interface ChatService {
  createSession(workspaceId: string, context: ClaudeCodeContext): Promise<string>;
  getSession(sessionId: string): Promise<ChatSession>;
  addMessage(sessionId: string, message: ChatMessage): Promise<void>;
  getMessages(sessionId: string): Promise<ChatMessage[]>;
  updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<void>;
  updateInvestigationContext(sessionId: string, investigation: InvestigationStep[]): Promise<void>;
}

// =====================================
// Configuration streaming Anthropic
// =====================================

export interface AnthropicStreamConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  stream: boolean;
}

export interface StreamingMessage {
  delta: string;
  isComplete: boolean;
  metadata?: {
    toolsUsed?: string[];
    investigationSteps?: InvestigationStep[];
  };
}

// =====================================
// Types pour la gestion des onglets
// =====================================

export interface ChatTab {
  id: string;
  sessionId: string;
  title: string;
  type: 'analysis' | 'documentation' | 'custom';
  isActive: boolean;
  isDirty: boolean; // Indique s'il y a des changements non sauvegardés
  lastActivity: Date;
  context?: ClaudeCodeContext;
  tabOrder: number;
}

export interface ChatTabManager {
  tabs: ChatTab[];
  activeTabId: string | null;
  workspaceId: string;
  
  addTab(context?: ClaudeCodeContext, type?: 'analysis' | 'documentation' | 'custom'): Promise<string>;
  switchTab(tabId: string): void;
  closeTab(tabId: string): Promise<void>;
  renameTab(tabId: string, title: string): void;
  duplicateTab(tabId: string): Promise<string>;
  markTabDirty(tabId: string, isDirty: boolean): void;
  updateTabActivity(tabId: string): void;
  saveTabsToLocalStorage(): void;
  loadTabsFromLocalStorage(): ChatTab[];
}

export interface UseChatTabsResult {
  tabs: ChatTab[];
  activeTab: ChatTab | null;
  activeTabId: string | null;
  isLoading: boolean;
  error: ChatError | null;
  
  addTab: (context?: ClaudeCodeContext, type?: 'analysis' | 'documentation' | 'custom') => Promise<string>;
  switchTab: (tabId: string) => void;
  closeTab: (tabId: string) => Promise<void>;
  renameTab: (tabId: string, title: string) => void;
  duplicateTab: (tabId: string) => Promise<string>;
  markTabDirty: (tabId: string, isDirty: boolean) => void;
  updateTabActivity: (tabId: string) => void;
}

// =====================================
// Constantes
// =====================================

export const DEFAULT_CHAT_CONFIG = {
  autoScroll: true,
  showHeader: true,
  showControls: true,
  theme: 'dark' as const,
  maxHeight: '400px'
};

export const CLAUDE_CODE_MODELS = {
  SONNET: 'claude-3-5-sonnet-20241022',
  HAIKU: 'claude-3-haiku-20240307',
  OPUS: 'claude-3-opus-20240229'
} as const;

export const ANTHROPIC_STREAM_CONFIG: AnthropicStreamConfig = {
  model: CLAUDE_CODE_MODELS.SONNET,
  maxTokens: 4000,
  temperature: 0.3,
  stream: true
};

