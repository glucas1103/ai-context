import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const body = await request.json()
    const { content } = body

    // Vérifier que l'élément existe et est un fichier
    const { data: existingItem, error: itemError } = await supabase
      .from('custom_documentation')
      .select('*')
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .single()

    if (itemError || !existingItem) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 })
    }

    if (existingItem.type !== 'file') {
      return NextResponse.json({ error: 'Seuls les fichiers peuvent avoir du contenu' }, { status: 400 })
    }

    // Validation du contenu
    if (content === undefined) {
      return NextResponse.json({ error: 'Le contenu est requis' }, { status: 400 })
    }

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Le contenu doit être une chaîne de caractères' }, { status: 400 })
    }

    // Limiter la taille du contenu (2MB)
    const contentSizeInBytes = new TextEncoder().encode(content).length
    const maxSizeInBytes = 2 * 1024 * 1024 // 2MB
    
    if (contentSizeInBytes > maxSizeInBytes) {
      return NextResponse.json({ 
        error: `Le contenu est trop volumineux. Taille maximale: 2MB (actuel: ${Math.round(contentSizeInBytes / 1024 / 1024 * 100) / 100}MB)` 
      }, { status: 400 })
    }

    // Mettre à jour le contenu et les métadonnées
    const { data: updatedItem, error: updateError } = await supabase
      .from('custom_documentation')
      .update({
        content,
        metadata: {
          ...existingItem.metadata,
          last_edited: new Date().toISOString(),
          last_edited_by: user.id,
          content_size: contentSizeInBytes
        }
      })
      .eq('id', itemId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur lors de la sauvegarde du contenu:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedItem })
  } catch (error) {
    console.error('Erreur dans l\'API content:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
