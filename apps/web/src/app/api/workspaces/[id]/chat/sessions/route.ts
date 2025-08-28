/**
 * API Routes pour les sessions de chat Claude Code
 * Story 1.6.1 - Phase 4
 * POST /api/workspaces/[id]/chat/sessions - Créer une nouvelle session
 * GET /api/workspaces/[id]/chat/sessions - Récupérer les sessions du workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatService } from '@/lib/services/chatService';
import { ClaudeCodeContext } from '@/types/chat/universal';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Non authentifié', code: 'auth_required' } },
        { status: 401 }
      );
    }

    const { id: workspaceId } = await params;
    const body = await request.json();
    const { context, agentType } = body;

    // Valider le contexte
    const claudeContext: ClaudeCodeContext = {
      selectedFile: context?.selectedFile,
      currentDirectory: context?.currentDirectory || '/',
      investigationHistory: context?.investigationHistory || [],
      workspacePath: context?.workspacePath || '/workspace',
      sessionId: undefined // Sera généré
    };

    // Créer la session via le service
    const sessionId = await chatService.createSession(workspaceId, claudeContext);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        context: claudeContext,
        agentType: agentType || 'analysis'
      },
      status: 201
    });

  } catch (error) {
    console.error('Erreur lors de la création de session:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Erreur interne du serveur',
          code: 'session_create_error'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Non authentifié', code: 'auth_required' } },
        { status: 401 }
      );
    }

    const { id: workspaceId } = await params;

    // Récupérer les sessions via le service
    const sessions = await chatService.getWorkspaceSessions(workspaceId);

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        total: sessions.length
      },
      status: 200
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Erreur interne du serveur',
          code: 'sessions_get_error'
        }
      },
      { status: 500 }
    );
  }
}
