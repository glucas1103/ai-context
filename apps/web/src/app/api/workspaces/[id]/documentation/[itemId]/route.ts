import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateDocumentationRequest } from '@/lib/types/documentation'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: workspaceId, itemId } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur a accès au workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 })
    }

    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body: UpdateDocumentationRequest = await request.json()
    const { name, parent_id, order_index } = body

    // Vérifier que l'élément existe
    const { data: existingItem, error: itemError } = await supabase
      .from('custom_documentation')
      .select('*')
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .single()

    if (itemError || !existingItem) {
      return NextResponse.json({ error: 'Élément non trouvé' }, { status: 404 })
    }

    // Validation du nom si fourni
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json({ error: 'Le nom ne peut pas être vide' }, { status: 400 })
      }

      if (name.length > 255) {
        return NextResponse.json({ error: 'Le nom ne peut pas dépasser 255 caractères' }, { status: 400 })
      }

      const nameRegex = /^[a-zA-Z0-9\s\-_\.]+$/
      if (!nameRegex.test(name)) {
        return NextResponse.json({ 
          error: 'Le nom ne peut contenir que des lettres, chiffres, espaces, tirets, underscores et points' 
        }, { status: 400 })
      }
    }

    // Vérifier le parent si spécifié
    if (parent_id !== undefined) {
      if (parent_id) {
        const { data: parent, error: parentError } = await supabase
          .from('custom_documentation')
          .select('id, type, path')
          .eq('id', parent_id)
          .eq('workspace_id', workspaceId)
          .single()

        if (parentError || !parent) {
          return NextResponse.json({ error: 'Dossier parent non trouvé' }, { status: 404 })
        }

        if (parent.type !== 'folder') {
          return NextResponse.json({ error: 'Le parent doit être un dossier' }, { status: 400 })
        }

        // Éviter les références circulaires
        if (parent_id === itemId) {
          return NextResponse.json({ error: 'Un élément ne peut pas être son propre parent' }, { status: 400 })
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    
    if (parent_id !== undefined) {
      updateData.parent_id = parent_id
    }
    
    if (order_index !== undefined) {
      updateData.order_index = order_index
    }

    // Mettre à jour l'élément
    const { data: updatedItem, error: updateError } = await supabase
      .from('custom_documentation')
      .update(updateData)
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedItem })
  } catch (error) {
    console.error('Erreur dans l\'API item update:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: workspaceId, itemId } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur a accès au workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 })
    }

    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Vérifier que l'élément existe
    const { data: existingItem, error: itemError } = await supabase
      .from('custom_documentation')
      .select('*')
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .single()

    if (itemError || !existingItem) {
      return NextResponse.json({ error: 'Élément non trouvé' }, { status: 404 })
    }

    // Supprimer l'élément (la suppression en cascade sera gérée par la base de données)
    const { error: deleteError } = await supabase
      .from('custom_documentation')
      .delete()
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)

    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Élément supprimé avec succès' })
  } catch (error) {
    console.error('Erreur dans l\'API item delete:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
