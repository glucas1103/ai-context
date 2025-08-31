import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Récupérer tous les messages d'une session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: workspaceId, sessionId } = await params;
    const supabase = await createClient();

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur récupération messages:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Erreur API messages GET:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: workspaceId, sessionId } = await params;
    const { role, content, metadata } = await request.json();

    if (!role || !content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Le rôle et le contenu du message sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que les rôles sont valides
    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Vérifier que la session existe et appartient au workspace
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      );
    }

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création message:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création du message' },
        { status: 500 }
      );
    }

    // Mettre à jour la date de modification de la session
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Erreur API messages POST:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer tous les messages d'une session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: workspaceId, sessionId } = await params;
    const supabase = await createClient();

    // Vérifier que la session existe et appartient au workspace
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer tous les messages de la session
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Erreur suppression messages:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des messages' },
        { status: 500 }
      );
    }

    // Réinitialiser le claude_session_id de la session
    await supabase
      .from('chat_sessions')
      .update({ 
        claude_session_id: null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API messages DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
