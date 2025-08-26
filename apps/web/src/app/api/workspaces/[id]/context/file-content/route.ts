import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'
import { createErrorResponse, handleApiError } from '@/utils/api'
import { GitHubAPI, parseGitHubUrl } from '@/lib/server/github'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return createErrorResponse('Paramètre path requis', 'missing_path', 400)
    }

    const supabase = await createClient()
    
    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401)
    }

    // Récupérer le token GitHub depuis la session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.provider_token) {
      return createErrorResponse('Token GitHub non disponible', 'github_token_missing', 401)
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

    // Parser l'URL GitHub pour extraire owner/repo
    const repoInfo = parseGitHubUrl(workspace.url)
    if (!repoInfo) {
      return createErrorResponse('URL GitHub invalide', 'invalid_github_url', 400)
    }

    // Créer l'instance GitHub API
    const githubAPI = new GitHubAPI(session.provider_token)

    try {
      // Récupérer le contenu du fichier depuis GitHub
      const fileContent = await githubAPI.getFileContent(repoInfo.owner, repoInfo.repo, filePath)

      return NextResponse.json({
        success: true,
        data: {
          path: filePath,
          content: fileContent
        }
      })

    } catch (githubError: any) {
      if (githubError.message.includes('404')) {
        return createErrorResponse('Fichier non trouvé', 'file_not_found', 404)
      }
      
      if (githubError.message.includes('401')) {
        return createErrorResponse('Token GitHub expiré ou invalide', 'github_token_invalid', 401)
      }

      if (githubError.message.includes('403')) {
        return createErrorResponse('Rate limit GitHub atteint', 'github_rate_limit', 429)
      }

      console.error('Erreur GitHub API:', githubError)
      return createErrorResponse('Erreur lors de la récupération du fichier', 'github_api_error', 500)
    }

  } catch (error) {
    console.error('Erreur lors de la récupération du contenu de fichier:', error)
    return handleApiError(error)
  }
}
