import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Récupérer toutes les sessions de chat pour un workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const supabase = await createClient();

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération sessions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Erreur API chat-sessions GET:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle session de chat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Le nom de la session est requis' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        title: name.trim(),              // Utiliser 'title' au lieu de 'name'
        workspace_id: workspaceId,
        agent_id: 'claude-code',         // Champ requis
        user_id: (await supabase.auth.getUser()).data.user?.id, // Associer à l'utilisateur
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création session:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Erreur API chat-sessions POST:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
