/**
 * API Route Claude Code Ultra-Simple - Story 1.6.2 RÉVISÉ
 * Utilise directement le service ultra-simple qui gère Claude Code SDK nativement
 * 
 * PHILOSOPHIE: Laisser Claude Code SDK gérer l'investigation, juste forward les requêtes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createErrorResponse, handleApiError } from '@/utils/api';
import { createSimpleClaudeCodeService, type SimpleClaudeCodeConfig } from '@/lib/services/simple-claude-code-service';

/**
 * POST /api/workspaces/[id]/chat/claude-code
 * Endpoint ultra-simple : forward directement vers Claude Code SDK
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401);
    }

    // Récupérer les données du workspace pour obtenir l'URL GitHub
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, url')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return createErrorResponse('Workspace non trouvé ou accès non autorisé', 'workspace_not_found', 404);
    }

    // Parser le body de la requête
    const body = await request.json();
    const { 
      message,
      sessionId,
      apiKey,
      action = 'chat'
    }: {
      message: string;
      sessionId?: string;
      apiKey?: string;
      action?: 'chat' | 'analyze' | 'document';
    } = body;

    // Valider la session fournie ou récupérer une session par défaut
    let effectiveSessionId = sessionId;

    console.log('🔍 Analyse des sessions:', {
      sessionIdFournie: !!sessionId,
      sessionId: sessionId,
      workspaceId,
      userId: user.id
    });

    if (effectiveSessionId) {
      // Vérifier que la session appartient bien à l'utilisateur et au workspace
      const { data: sessionCheck, error: sessionCheckError } = await supabase
        .from('chat_sessions')
        .select('id, workspace_id, user_id')
        .eq('id', effectiveSessionId)
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();

      console.log('🔍 Vérification session fournie:', {
        sessionCheck,
        sessionCheckError: sessionCheckError?.message
      });

      if (sessionCheckError || !sessionCheck) {
        console.warn('⚠️ Session ID invalide ou non autorisée:', effectiveSessionId, sessionCheckError?.message);
        effectiveSessionId = undefined;
      } else {
        console.log('✅ Session fournie validée:', effectiveSessionId);
      }
    }

    // Si pas de session valide, récupérer une session par défaut
    if (!effectiveSessionId) {
      console.log('🔍 Recherche de sessions existantes...');
      
      const { data: existingSessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('🔍 Sessions trouvées:', {
        count: existingSessions?.length || 0,
        sessions: existingSessions?.map(s => ({ id: s.id, title: s.title })),
        sessionError: sessionError?.message
      });

      if (sessionError) {
        console.error('❌ Erreur récupération sessions:', sessionError);
      }

      effectiveSessionId = existingSessions && existingSessions.length > 0 
        ? existingSessions[0].id 
        : undefined;

      // Si aucune session trouvée, créer une session par défaut
      if (!effectiveSessionId) {
        console.log('🆕 Aucune session trouvée, création d\'une session par défaut...');
        
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            workspace_id: workspaceId,
            agent_id: 'analysis',
            title: `Conversation Claude Code`,
            context: {},
            tab_order: 1,
            is_active: true,
            is_dirty: false
          })
          .select('id')
          .single();

        if (createError || !newSession) {
          console.error('Erreur création session par défaut:', createError);
          return createErrorResponse('Impossible de créer une session de chat pour ce workspace', 'session_creation_failed', 500);
        }

        effectiveSessionId = newSession.id;
        console.log('✅ Session par défaut créée:', effectiveSessionId);
      }
    }

    // Validation des paramètres
    if (!message) {
      return createErrorResponse(
        'Paramètre message requis',
        'validation_error',
        400
      );
    }

    // Construire le workspace path depuis l'URL GitHub
    // Pour Claude Code, on peut utiliser un path temporaire ou simulé
    // basé sur le nom du repo GitHub
    const githubUrlMatch = workspace.url.match(/github\.com\/([^\/]+)\/([^\/\?]+)/);
    const repoName = githubUrlMatch ? githubUrlMatch[2] : workspace.name;
    const workspacePath = `/tmp/claude-code-repos/${repoName}`;

    // Obtenir l'API key depuis les variables d'environnement si non fournie
    const effectiveApiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    
    if (!effectiveApiKey) {
      return createErrorResponse(
        'API key Claude manquante. Configurez ANTHROPIC_API_KEY ou fournissez la clé.',
        'missing_api_key',
        400
      );
    }

    // Créer le service Claude Code ultra-simple
    console.log('🔧 Création du service Claude Code...', {
      workspacePath,
      model: 'sonnet',
      hasApiKey: !!effectiveApiKey,
      action,
      sessionIdProvided: !!sessionId,
      effectiveSessionId,
      workspaceName: workspace.name,
      repoName
    });

    let service;
    try {
      service = createSimpleClaudeCodeService({
        workspacePath,
        model: 'sonnet',
        apiKey: effectiveApiKey
      });
      console.log('✅ Service Claude Code créé avec succès');
    } catch (serviceError) {
      console.error('❌ Erreur création service:', serviceError);
      return createErrorResponse(
        `Erreur de création du service Claude Code: ${serviceError instanceof Error ? serviceError.message : 'Erreur inconnue'}`,
        'service_creation_error',
        500
      );
    }

    let result: string;

    // Exécuter l'action - Claude Code SDK gère tout automatiquement
    console.log('📨 Exécution de l\'action:', action, 'message:', message.substring(0, 50) + '...');
    
    try {
      switch (action) {
        case 'chat':
          result = await service.sendMessage(message);
          break;

      case 'analyze':
        // Extract file path from message or use selected file
        const filePath = message.includes('analyze') ? 
          message.replace(/.*analyze\s+/, '').trim() : 
          message;
        result = await service.analyzeFile(filePath);
        break;

      case 'document':
        result = await service.generateDocumentation(message);
        break;

      default:
        result = await service.sendMessage(message);
    }
    
    console.log('✅ Réponse Claude Code reçue:', result.substring(0, 100) + '...');
    
    } catch (executionError) {
      console.error('❌ Erreur exécution Claude Code:', executionError);
      return createErrorResponse(
        `Erreur d'exécution Claude Code: ${executionError instanceof Error ? executionError.message : 'Erreur inconnue'}`,
        'execution_error',
        500
      );
    }

    // Sauvegarder dans la session existante (réutilise chatService)
    try {
      const { chatService } = await import('@/lib/services/chatService');
      
      // Message utilisateur
      await chatService.addMessage(effectiveSessionId, {
        id: `user_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
        status: 'sent'
      });

      // Réponse Claude Code
      await chatService.addMessage(effectiveSessionId, {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result,
        timestamp: new Date(),
        status: 'sent',
        metadata: {
          claudeActions: [action],
          toolsUsed: ['Claude Code SDK'],
          workspaceInfo: {
            name: workspace.name,
            url: workspace.url,
            repoName
          }
        }
      });
    } catch (saveError) {
      console.warn('Erreur lors de la sauvegarde:', saveError);
      // Continue même si la sauvegarde échoue
    }

    // Retourner le résultat
    return NextResponse.json({
      success: true,
      data: {
        message: result,
        action,
        workspaceId,
        sessionId: effectiveSessionId,
        workspaceInfo: {
          name: workspace.name,
          url: workspace.url,
          repoName,
          workspacePath
        },
        timestamp: new Date().toISOString()
      },
      status: 200
    });

  } catch (error) {
    console.error('Erreur dans l\'API Claude Code:', error);
    return handleApiError(error);
  }
}

/**
 * GET /api/workspaces/[id]/chat/claude-code
 * Simple health check pour le service Claude Code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Service Claude Code actif',
        workspaceId,
        timestamp: new Date().toISOString()
      },
      status: 200
    });

  } catch (error) {
    console.error('Erreur Claude Code health check:', error);
    return handleApiError(error);
  }
}