/**
 * Types pour l'agent Claude Code
 * Version simple basée sur l'agent fonctionnel /test-claude-code
 */

export interface ClaudeCodeMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  isIntermediate?: boolean; // Pour les étapes intermédiaires
  metadata?: {
    duration_ms?: number;
    num_turns?: number;
    total_cost_usd?: number;
  };
  streamData?: any; // Pour les données de streaming (tool uses, etc.)
}

export interface ClaudeCodeConfig {
  workspaceId: string;
  maxTurns: number;
  showIntermediateSteps: boolean;
}

export interface AgentStatus {
  status: string;
  agent_type: string;
  capabilities: string[];
}

export interface ClaudeCodePanelProps {
  workspaceId: string;
  className?: string;
  maxHeight?: string;
}

export interface ChatSession {
  id: string;
  title: string;                    // Correspond au champ 'title' en base
  workspace_id: string;
  user_id?: string;
  agent_id: string;
  claude_session_id?: string;
  context?: Record<string, any>;
  investigation_context?: Record<string, any>;
  claude_config?: Record<string, any>;
  tab_order?: number;
  is_active?: boolean;
  is_dirty?: boolean;
  created_at: string;
  updated_at: string;
  
  // Propriété computed pour compatibilité avec l'UI existante
  name?: string;  // Alias pour title
}

export interface UseClaudeCodeReturn {
  messages: ClaudeCodeMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  agentStatus: AgentStatus | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setMaxTurns: (turns: number) => void;
  setShowIntermediateSteps: (show: boolean) => void;
  // Nouvelles fonctionnalités adaptatives
  adaptiveTurns: boolean;
  setAdaptiveTurns: (adaptive: boolean) => void;
  currentTaskComplexity: 'simple' | 'medium' | 'complex';
  getAdaptiveTurns: () => number;
  continueWithMoreTurns: (additionalTurns?: number) => Promise<void>;
  // Contrôle de l'exécution
  stopThinking: () => void;
  canStop: boolean;
  thinkingStartTime: number | null;
}
