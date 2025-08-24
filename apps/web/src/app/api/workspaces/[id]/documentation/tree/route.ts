import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DocumentationNode } from '@/lib/types/documentation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
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

    // Récupérer tous les éléments de documentation du workspace
    const { data: documentationItems, error: docError } = await supabase
      .from('custom_documentation')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('order_index', { ascending: true })

    if (docError) {
      console.error('Erreur lors de la récupération de la documentation:', docError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Construire l'arborescence hiérarchique
    const buildTree = (items: any[], parentId: string | null = null): DocumentationNode[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          path: item.path,
          content: item.content,
          fileExtension: item.type === 'file' ? item.name.split('.').pop() : undefined,
          parent_id: item.parent_id,
          metadata: item.metadata || {},
          order_index: item.order_index,
          created_at: item.created_at,
          updated_at: item.updated_at,
          children: buildTree(items, item.id)
        }))
        .sort((a, b) => a.order_index - b.order_index)
    }

    const tree = buildTree(documentationItems || [])

    return NextResponse.json({ data: tree })
  } catch (error) {
    console.error('Erreur dans l\'API tree:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
