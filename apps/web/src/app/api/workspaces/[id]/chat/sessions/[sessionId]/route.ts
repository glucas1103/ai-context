/**
 * API Route pour une session de chat spécifique
 * GET /api/workspaces/[id]/chat/sessions/[sessionId] - Récupérer une session et ses messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
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

    const { id: workspaceId, sessionId } = await params;

    // Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { message: 'Session non trouvée', code: 'session_not_found' } },
          { status: 404 }
        );
      }
      throw sessionError;
    }

    // Récupérer les messages de la session
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // Formater les messages pour le front-end
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
      metadata: msg.metadata || {},
      status: 'sent'
    }));

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          workspace_id: session.workspace_id,
          context: session.context || {},
          created_at: session.created_at,
          updated_at: session.updated_at,
          title: session.title,
          agent_id: session.agent_id
        },
        messages: formattedMessages
      },
      status: 200
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Erreur interne du serveur',
          code: 'session_get_error'
        }
      },
      { status: 500 }
    );
  }
}
