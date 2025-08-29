/**
 * API Route pour les interactions Claude Code
 * Conforme à la Story 1.6.2 - Phase 6: Intégration avec UniversalChatPanel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClaudeCodeAssistant } from '@/lib/services/claude-code-assistant';
import { getClaudeSessionManager } from '@/lib/services/claude-session-manager';
import { createErrorResponse, handleApiError } from '@/utils/api';
import type { ClaudeCodeConfig } from '@/types/claude-code';

// Initialiser Claude Code avec investigation autonome
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401);
    }

    const { id: workspaceId } = await params;
    const body = await request.json();
    const { query, sessionId, action = 'investigate', config } = body;

    if (!query) {
      return createErrorResponse('Query manquante', 'missing_query', 400);
    }

    // Récupérer les informations du workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return createErrorResponse('Workspace introuvable', 'workspace_not_found', 404);
    }

    // Obtenir l'assistant Claude Code
    const assistant = getClaudeCodeAssistant(config);
    const sessionManager = getClaudeSessionManager();

    let claudeSessionId = sessionId;

    // Créer une nouvelle session Claude si nécessaire
    if (!claudeSessionId) {
      const workspacePath = workspace.url || '/tmp/workspace'; // TODO: Utiliser le vrai chemin du workspace
      claudeSessionId = await assistant.createSession(workspaceId, workspacePath);
      
      // Créer aussi la session de chat dans Supabase
      await sessionManager.createSession(user.id, workspaceId, workspacePath, config);
    }

    let response;

    // Exécuter l'action demandée
    switch (action) {
      case 'investigate':
        response = await assistant.investigateCodebase(query, claudeSessionId);
        break;
        
      case 'analyze_file':
        const { filePath } = body;
        if (!filePath) {
          return createErrorResponse('Chemin de fichier manquant', 'missing_file_path', 400);
        }
        response = await assistant.analyzeFile(filePath, claudeSessionId);
        break;
        
      case 'search_code':
        response = await assistant.searchCode(query, claudeSessionId);
        break;
        
      case 'explore_structure':
        const { path = '.' } = body;
        response = await assistant.exploreStructure(path, claudeSessionId);
        break;
        
      case 'generate_documentation':
        const { scope } = body;
        if (!scope) {
          return createErrorResponse('Scope manquant pour la documentation', 'missing_scope', 400);
        }
        response = await assistant.generateDocumentation(scope, claudeSessionId);
        break;
        
      case 'analyze_quality':
        response = await assistant.analyzeCodeQuality(claudeSessionId);
        break;
        
      case 'suggest_optimizations':
        response = await assistant.suggestOptimizations(claudeSessionId);
        break;
        
      default:
        return createErrorResponse(`Action inconnue: ${action}`, 'unknown_action', 400);
    }

    // Sauvegarder la réponse dans Supabase
    if (response) {
      await sessionManager.saveMessage(
        claudeSessionId,
        'assistant',
        response.content,
        response.metadata
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: claudeSessionId,
        response,
        workspacePath: workspace.url
      },
      status: 200
    });

  } catch (error) {
    console.error('Erreur Claude Code API:', error);
    return handleApiError(error);
  }
}

// Obtenir l'historique d'investigation d'une session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401);
    }

    const { id: workspaceId } = await params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return createErrorResponse('Session ID manquant', 'missing_session_id', 400);
    }

    // Vérifier l'accès au workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return createErrorResponse('Workspace introuvable', 'workspace_not_found', 404);
    }

    const sessionManager = getClaudeSessionManager();
    
    // Obtenir l'historique d'investigation
    const investigationHistory = await sessionManager.getInvestigationHistory(sessionId);
    
    // Obtenir les messages de la session
    const messages = await sessionManager.getMessages(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        investigationHistory,
        messages,
        totalInvestigations: investigationHistory.length
      },
      status: 200
    });

  } catch (error) {
    console.error('Erreur récupération historique Claude:', error);
    return handleApiError(error);
  }
}

// Configurer Claude Code pour un workspace
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401);
    }

    const { id: workspaceId } = await params;
    const body = await request.json();
    const { config, sessionId } = body;

    if (!config || !sessionId) {
      return createErrorResponse('Configuration ou session ID manquant', 'missing_params', 400);
    }

    // Vérifier l'accès au workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return createErrorResponse('Workspace introuvable', 'workspace_not_found', 404);
    }

    // Configurer l'assistant Claude Code
    const assistant = getClaudeCodeAssistant();
    assistant.configure(config);

    // Mettre à jour la session avec la nouvelle configuration
    const sessionManager = getClaudeSessionManager();
    await sessionManager.updateSession(sessionId, {
      config
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Configuration Claude Code mise à jour',
        sessionId,
        config: assistant.getConfig()
      },
      status: 200
    });

  } catch (error) {
    console.error('Erreur configuration Claude Code:', error);
    return handleApiError(error);
  }
}
