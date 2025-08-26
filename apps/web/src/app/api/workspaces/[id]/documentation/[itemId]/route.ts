import { API_ENDPOINTS } from "@/constants/api";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateDocumentationItemRequest, DocumentationApiResponse, DocumentationNode } from '@/types/api/documentation';

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

    // Récupérer l'élément actuel
    const { data: currentItem, error: currentError } = await supabase
      .from('custom_documentation')
      .select('*')
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .single();

    if (currentError || !currentItem) {
      return NextResponse.json(
        { success: false, error: { message: 'Élément non trouvé', code: 'ITEM_NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Parser le body de la requête
    const body: UpdateDocumentationItemRequest = await request.json();
    
    // Préparer les champs à mettre à jour
    const updateFields: any = {};
    let newPath = currentItem.path;

    // Mise à jour du nom
    if (body.name && body.name !== currentItem.name) {
      // Validation du nom
      const nameRegex = /^[a-zA-Z0-9\s\-_àáâäçéèêëíìîïñóòôöúùûüýÿ\.]+$/;
      if (!nameRegex.test(body.name)) {
        return NextResponse.json(
          { success: false, error: { message: 'Le nom contient des caractères non autorisés', code: 'INVALID_NAME' } },
          { status: 400 }
        );
      }

      updateFields.name = body.name.trim();
      
      // Reconstruire le chemin avec le nouveau nom
      const pathParts = currentItem.path.split('/');
      pathParts[pathParts.length - 1] = body.name.trim();
      newPath = pathParts.join('/');
      updateFields.path = newPath;
    }

    // Mise à jour du parent (déplacement)
    if (body.parent_id !== undefined && body.parent_id !== currentItem.parent_id) {
      updateFields.parent_id = body.parent_id;

      // Recalculer le chemin complet
      if (body.parent_id) {
        const { data: newParent, error: parentError } = await supabase
          .from('custom_documentation')
          .select('path')
          .eq('id', body.parent_id)
          .eq('workspace_id', workspaceId)
          .single();

        if (parentError || !newParent) {
          return NextResponse.json(
            { success: false, error: { message: 'Nouveau parent non trouvé', code: 'PARENT_NOT_FOUND' } },
            { status: 404 }
          );
        }

        const fileName = updateFields.name || currentItem.name;
        newPath = `${newParent.path}/${fileName}`;
      } else {
        // Déplacement vers la racine
        const fileName = updateFields.name || currentItem.name;
        newPath = `/${fileName}`;
      }
      updateFields.path = newPath;
    }

    // Mise à jour de l'ordre
    if (body.order_index !== undefined) {
      updateFields.order_index = body.order_index;
    }

    // Vérifier que le nouveau chemin n'existe pas déjà (si le chemin a changé)
    if (newPath !== currentItem.path) {
      const { data: existing, error: existingError } = await supabase
        .from('custom_documentation')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('path', newPath)
        .neq('id', itemId)
        .single();

      if (existing) {
        return NextResponse.json(
          { success: false, error: { message: 'Un élément avec ce chemin existe déjà', code: 'ALREADY_EXISTS' } },
          { status: 409 }
        );
      }
    }

    // Effectuer la mise à jour
    const { data: updatedItem, error: updateError } = await supabase
      .from('custom_documentation')
      .update(updateFields)
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating item:', updateError);
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la mise à jour', code: 'UPDATE_ERROR' } },
        { status: 500 }
      );
    }

    // Si on a déplacé un dossier, mettre à jour tous les chemins des enfants
    if (currentItem.type === 'folder' && newPath !== currentItem.path) {
      await updateChildrenPaths(supabase, workspaceId, currentItem.path, newPath);
    }

    const updatedNode: DocumentationNode = {
      id: updatedItem.id,
      name: updatedItem.name,
      type: updatedItem.type,
      path: updatedItem.path,
      content: updatedItem.content,
      parent_id: updatedItem.parent_id,
      children: [],
      metadata: updatedItem.metadata,
      order_index: updatedItem.order_index,
      created_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at
    };

    const response: DocumentationApiResponse<DocumentationNode> = {
      success: true,
      data: updatedNode
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in item update API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Vérifier que l'élément existe
    const { data: item, error: itemError } = await supabase
      .from('custom_documentation')
      .select('id, type')
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: { message: 'Élément non trouvé', code: 'ITEM_NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Supprimer l'élément (CASCADE s'occupera des enfants)
    const { error: deleteError } = await supabase
      .from('custom_documentation')
      .delete()
      .eq('id', itemId)
      .eq('workspace_id', workspaceId);

    if (deleteError) {
      console.error('Error deleting item:', deleteError);
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la suppression', code: 'DELETE_ERROR' } },
        { status: 500 }
      );
    }

    const response: DocumentationApiResponse = {
      success: true
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in item delete API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour mettre à jour les chemins des enfants récursivement
async function updateChildrenPaths(
  supabase: any,
  workspaceId: string,
  oldParentPath: string,
  newParentPath: string
) {
  // Récupérer tous les enfants qui commencent par l'ancien chemin
  const { data: children, error: childrenError } = await supabase
    .from('custom_documentation')
    .select('id, path')
    .eq('workspace_id', workspaceId)
    .like('path', `${oldParentPath}/%`);

  if (childrenError || !children) {
    console.error('Error fetching children for path update:', childrenError);
    return;
  }

  // Mettre à jour chaque enfant
  for (const child of children) {
    const newChildPath = child.path.replace(oldParentPath, newParentPath);
    
    const { error: updateError } = await supabase
      .from('custom_documentation')
      .update({ path: newChildPath })
      .eq('id', child.id);

    if (updateError) {
      console.error('Error updating child path:', updateError);
    }
  }
}
