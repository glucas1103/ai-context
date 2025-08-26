import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateDocumentationContentRequest, DocumentationApiResponse } from '@/lib/types/documentation';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const workspaceId = resolvedParams.id;
    const itemId = resolvedParams.itemId;

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Non autorisé', code: 'AUTH_ERROR' } },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur a accès au workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { success: false, error: { message: 'Workspace non trouvé', code: 'WORKSPACE_NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Vérifier que l'élément existe et est un fichier
    const { data: item, error: itemError } = await supabase
      .from('custom_documentation')
      .select('id, type, name')
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: { message: 'Fichier non trouvé', code: 'FILE_NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (item.type !== 'file') {
      return NextResponse.json(
        { success: false, error: { message: 'Cet élément n\'est pas un fichier', code: 'NOT_A_FILE' } },
        { status: 400 }
      );
    }

    // Parser le body de la requête
    const body: UpdateDocumentationContentRequest = await request.json();
    
    // Validation
    if (typeof body.content !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'Le contenu doit être une chaîne de caractères', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Vérifier la taille du contenu (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (body.content.length > maxSize) {
      return NextResponse.json(
        { success: false, error: { message: 'Le contenu dépasse la taille maximale autorisée (2MB)', code: 'CONTENT_TOO_LARGE' } },
        { status: 413 }
      );
    }

    // Mettre à jour le contenu
    const { data: updatedItem, error: updateError } = await supabase
      .from('custom_documentation')
      .update({ 
        content: body.content,
        metadata: {
          ...item.metadata,
          last_edited: new Date().toISOString()
        }
      })
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .select('updated_at')
      .single();

    if (updateError) {
      console.error('Error updating content:', updateError);
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la sauvegarde du contenu', code: 'SAVE_ERROR' } },
        { status: 500 }
      );
    }

    const response: DocumentationApiResponse<{ updated_at: string }> = {
      success: true,
      data: {
        updated_at: updatedItem.updated_at
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in content update API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const workspaceId = resolvedParams.id;
    const itemId = resolvedParams.itemId;

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Non autorisé', code: 'AUTH_ERROR' } },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur a accès au workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { success: false, error: { message: 'Workspace non trouvé', code: 'WORKSPACE_NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Récupérer le contenu du fichier
    const { data: item, error: itemError } = await supabase
      .from('custom_documentation')
      .select('id, type, name, content, updated_at')
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: { message: 'Fichier non trouvé', code: 'FILE_NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (item.type !== 'file') {
      return NextResponse.json(
        { success: false, error: { message: 'Cet élément n\'est pas un fichier', code: 'NOT_A_FILE' } },
        { status: 400 }
      );
    }

    const response: DocumentationApiResponse<{ content: string; updated_at: string }> = {
      success: true,
      data: {
        content: item.content || '',
        updated_at: item.updated_at
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in content get API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
