import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Récupérer une session spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: workspaceId, sessionId } = await params;
    const supabase = await createClient();

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      console.error('Erreur récupération session:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de la session' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Erreur API session GET:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une session de chat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: workspaceId, sessionId } = await params;
    const { name, claude_session_id } = await request.json();

    const supabase = await createClient();

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name) updateData.title = name.trim();  // Utiliser 'title' au lieu de 'name'
    if (claude_session_id) updateData.claude_session_id = claude_session_id;

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour session:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la session' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Erreur API chat-sessions PUT:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une session de chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: workspaceId, sessionId } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Erreur suppression session:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API chat-sessions DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
