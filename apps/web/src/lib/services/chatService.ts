/**
 * Service de persistance pour les sessions de chat Claude Code
 * Story 1.6.1 - Phase 4
 * Intégration avec les tables Supabase existantes
 */

import { createClient } from '@/lib/supabase/server';
import { 
  ChatSession, 
  ChatMessage, 
  ClaudeCodeContext,
  InvestigationStep,
  ChatError 
} from '@/types/chat/universal';

class ChatServiceImpl {
  private async getSupabase() {
    return await createClient();
  }

  /**
   * Créer une nouvelle session de chat
   */
  async createSession(workspaceId: string, context: ClaudeCodeContext): Promise<string> {
    try {
      const supabase = await this.getSupabase();
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Utilisateur non authentifié');
      }

      const sessionData = {
        user_id: user.user.id,
        workspace_id: workspaceId,
        agent_id: 'claude-code-analysis',
        title: context.selectedFile ? `Analyse de ${context.selectedFile}` : 'Session Claude Code',
        context: context,
        investigation_context: {
          selectedFile: context.selectedFile,
          currentDirectory: context.currentDirectory,
          workspacePath: context.workspacePath
        },
        claude_config: {
          model: 'claude-3-5-sonnet-20241022',
          maxTokens: 4000,
          temperature: 0.3,
          permissionMode: 'acceptEdits',
          reasoningSteps: true,
          transparencyLevel: 'detailed'
        }
      };

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
      const chatError: ChatError = {
        code: 'SESSION_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      throw new Error(chatError.message);
    }
  }

  /**
   * Récupérer une session existante
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          workspace_id,
          title,
          context,
          investigation_context,
          created_at,
          updated_at
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Session non trouvée');
      }

      // Récupérer les messages associés
      const messages = await this.getMessages(sessionId);

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        context: data.context as ClaudeCodeContext,
        messages: messages,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      const chatError: ChatError = {
        code: 'SESSION_GET_ERROR',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      throw new Error(chatError.message);
    }
  }

  /**
   * Ajouter un message à une session
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const messageData = {
        session_id: sessionId,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        status: message.status || 'sent',
        claude_actions: message.metadata?.claudeActions || [],
        investigation_steps: message.metadata?.investigationSteps || [],
        reasoning_steps: message.metadata?.reasoningSteps || [],
        files_analyzed: message.metadata?.filesAnalyzed || [],
        tools_used: message.metadata?.toolsUsed || [],
        tool_executions: [] // À remplir avec les exécutions d'outils Claude Code
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (error) {
        throw error;
      }

      // Mettre à jour la timestamp de la session
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Erreur lors de l\'ajout du message:', error);
      const chatError: ChatError = {
        code: 'MESSAGE_ADD_ERROR',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      throw new Error(chatError.message);
    }
  }

  /**
   * Récupérer les messages d'une session
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          role,
          content,
          metadata,
          status,
          claude_actions,
          investigation_steps,
          reasoning_steps,
          files_analyzed,
          tools_used,
          created_at
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as ChatMessage['role'],
        content: msg.content,
        timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
        status: msg.status as ChatMessage['status'],
        metadata: {
          ...msg.metadata,
          claudeActions: msg.claude_actions,
          investigationSteps: msg.investigation_steps,
          reasoningSteps: msg.reasoning_steps,
          filesAnalyzed: msg.files_analyzed,
          toolsUsed: msg.tools_used
        }
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      const chatError: ChatError = {
        code: 'MESSAGES_GET_ERROR',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      throw new Error(chatError.message);
    }
  }

  /**
   * Mettre à jour une session
   */
  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.context) {
        updateData.context = updates.context;
        updateData.investigation_context = {
          selectedFile: updates.context.selectedFile,
          currentDirectory: updates.context.currentDirectory,
          workspacePath: updates.context.workspacePath
        };
      }

      const { error } = await supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la session:', error);
      const chatError: ChatError = {
        code: 'SESSION_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      throw new Error(chatError.message);
    }
  }

  /**
   * Mettre à jour le contexte d'investigation
   */
  async updateInvestigationContext(sessionId: string, investigation: InvestigationStep[]): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          investigation_context: {
            investigationHistory: investigation
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du contexte d\'investigation:', error);
      const chatError: ChatError = {
        code: 'INVESTIGATION_UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      throw new Error(chatError.message);
    }
  }

  /**
   * Récupérer les sessions d'un workspace
   */
  async getWorkspaceSessions(workspaceId: string): Promise<ChatSession[]> {
    try {
      const supabase = await this.getSupabase();
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          workspace_id,
          title,
          context,
          investigation_context,
          created_at,
          updated_at
        `)
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(session => ({
        id: session.id,
        workspaceId: session.workspace_id,
        context: session.context as ClaudeCodeContext,
        messages: [], // À charger séparément si nécessaire
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at)
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des sessions du workspace:', error);
      const chatError: ChatError = {
        code: 'WORKSPACE_SESSIONS_ERROR',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      throw new Error(chatError.message);
    }
  }
}

// Instance singleton
export const chatService = new ChatServiceImpl();
export default chatService;
