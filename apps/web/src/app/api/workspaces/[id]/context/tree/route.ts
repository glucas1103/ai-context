import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'
import { createErrorResponse, handleApiError } from '@/utils/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const supabase = await createClient()
    
    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401)
    }

    // Vérifier que le workspace appartient à l'utilisateur
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return createErrorResponse('Workspace non trouvé ou accès non autorisé', 'workspace_not_found', 404)
    }

    // Récupérer la knowledge_base pour ce workspace
    const { data: knowledgeBase, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('structure')
      .eq('workspace_id', workspaceId)
      .single()

    if (kbError || !knowledgeBase) {
      return createErrorResponse('Base de connaissances non trouvée. Lancez d\'abord une analyse.', 'knowledge_base_not_found', 404)
    }

    return NextResponse.json({
      success: true,
      data: {
        structure: knowledgeBase.structure
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'arborescence:', error)
    return handleApiError(error)
  }
}
