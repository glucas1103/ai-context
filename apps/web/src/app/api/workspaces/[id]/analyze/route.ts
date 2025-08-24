import { createClient } from '@/lib/supabase/server'
import { FileTreeNode } from '@/lib/types/context'
import { NextResponse, NextRequest } from 'next/server'
import { createErrorResponse, handleApiError } from '@/lib/errors'

export async function POST(
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

    // Extraire owner/repo de l'URL GitHub
    const urlMatch = workspace.url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/)
    if (!urlMatch) {
      return createErrorResponse('URL GitHub invalide', 'invalid_github_url', 400)
    }

    const [, owner, repo] = urlMatch

    // Appeler l'API GitHub Trees pour récupérer l'arborescence complète
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
      headers: {
        'Authorization': `Bearer ${session.provider_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AIcontext-App'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        return createErrorResponse('Token GitHub expiré ou invalide', 'github_token_invalid', 401)
      }
      
      if (response.status === 404) {
        return createErrorResponse('Dépôt non trouvé ou inaccessible', 'repo_not_found', 404)
      }

      if (response.status === 403) {
        return createErrorResponse('Rate limit GitHub atteint', 'github_rate_limit', 429)
      }

      console.error('Erreur API GitHub Trees:', response.status, response.statusText)
      return createErrorResponse('Erreur lors de l\'analyse du dépôt', 'github_api_error', 500)
    }

    const treeData = await response.json()

    // Générer la structure JSON standardisée pour React Arborist
    const fileTreeStructure = await buildFileTreeStructure(treeData.tree, owner, repo)

    // Vérifier si une knowledge_base existe déjà pour ce workspace
    let { data: knowledgeBase, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single()

    if (kbError && kbError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw kbError
    }

    // Créer ou mettre à jour la knowledge_base
    const kbData = {
      workspace_id: workspaceId,
      structure: fileTreeStructure
    }

    if (knowledgeBase) {
      // Mettre à jour
      const { data: updatedKb, error: updateError } = await supabase
        .from('knowledge_bases')
        .update(kbData)
        .eq('id', knowledgeBase.id)
        .select()
        .single()

      if (updateError) throw updateError
      knowledgeBase = updatedKb
    } else {
      // Créer
      const { data: newKb, error: createError } = await supabase
        .from('knowledge_bases')
        .insert(kbData)
        .select()
        .single()

      if (createError) throw createError
      knowledgeBase = newKb
    }

    return NextResponse.json({
      success: true,
      data: {
        knowledgeBaseId: knowledgeBase.id,
        fileCount: treeData.tree.length,
        structure: fileTreeStructure
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'analyse du workspace:', error)
    return handleApiError(error)
  }
}

// Interface pour les éléments de l'arbre GitHub
interface GitHubTreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
  url: string
}

// Import du type centralisé au lieu de duplication

// Fonction pour construire l'arborescence structurée
async function buildFileTreeStructure(
  treeItems: GitHubTreeItem[], 
  owner: string, 
  repo: string
): Promise<FileTreeNode[]> {
  const rootNodes: FileTreeNode[] = []
  const nodeMap = new Map<string, FileTreeNode>()

  // Créer tous les nœuds
  for (const item of treeItems) {
    const pathParts = item.path.split('/')
    const fileName = pathParts[pathParts.length - 1]
    
    const node: FileTreeNode = {
      id: item.path,
      name: fileName,
      path: item.path,
      type: item.type === 'blob' ? 'file' : 'directory',
      size: item.size,
      sha: item.sha,
      url: item.url,
      children: item.type === 'tree' ? [] : undefined
    }

    // Ajouter la détection de langage pour les fichiers
    if (item.type === 'blob') {
      node.language = detectLanguage(fileName)
      node.download_url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${item.path}`
    }

    nodeMap.set(item.path, node)
  }

  // Construire la hiérarchie
  for (const [path, node] of nodeMap) {
    const pathParts = path.split('/')
    
    if (pathParts.length === 1) {
      // Nœud racine
      rootNodes.push(node)
    } else {
      // Trouver le parent
      const parentPath = pathParts.slice(0, -1).join('/')
      const parent = nodeMap.get(parentPath)
      
      if (parent && parent.children) {
        parent.children.push(node)
      }
    }
  }

  // Trier les nœuds (dossiers en premier, puis alphabétique)
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
    
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children)
      }
    })
  }

  sortNodes(rootNodes)
  return rootNodes
}

// Fonction de détection de langage pour Monaco Editor
function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'java': 'java',
    'css': 'css',
    'scss': 'scss',
    'html': 'html',
    'md': 'markdown',
    'json': 'json',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
    'sh': 'shell',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp'
  }
  return languageMap[ext || ''] || 'plaintext'
}
