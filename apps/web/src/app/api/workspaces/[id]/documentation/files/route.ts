import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateDocumentationRequest } from '@/lib/types/documentation'

export async function POST(
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

    const body: CreateDocumentationRequest = await request.json()
    const { name, parent_id, content = '' } = body

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Le nom du fichier est requis' }, { status: 400 })
    }

    if (name.length > 255) {
      return NextResponse.json({ error: 'Le nom du fichier ne peut pas dépasser 255 caractères' }, { status: 400 })
    }

    // Validation du nom (caractères autorisés)
    const nameRegex = /^[a-zA-Z0-9\s\-_\.]+$/
    if (!nameRegex.test(name)) {
      return NextResponse.json({ 
        error: 'Le nom du fichier ne peut contenir que des lettres, chiffres, espaces, tirets, underscores et points' 
      }, { status: 400 })
    }

    // Vérifier l'extension du fichier
    const fileExtension = name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['md', 'txt', 'doc', 'docx']
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: `Extension de fichier non supportée. Extensions autorisées: ${allowedExtensions.join(', ')}` 
      }, { status: 400 })
    }

    // Vérifier si le parent existe si spécifié
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
    }

    // Générer le chemin virtuel
    let path = `/${name}`
    if (parent_id) {
      const { data: parent } = await supabase
        .from('custom_documentation')
        .select('path')
        .eq('id', parent_id)
        .single()
      
      if (parent) {
        path = `${parent.path}/${name}`
      }
    }

    // Vérifier si le chemin existe déjà
    const { data: existingPath, error: pathError } = await supabase
      .from('custom_documentation')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('path', path)
      .single()

    if (existingPath) {
      return NextResponse.json({ error: 'Un élément avec ce nom existe déjà à cet emplacement' }, { status: 409 })
    }

    // Récupérer le prochain order_index
    const { data: siblings, error: siblingsError } = await supabase
      .from('custom_documentation')
      .select('order_index')
      .eq('workspace_id', workspaceId)
      .eq('parent_id', parent_id || null)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = siblings && siblings.length > 0 ? siblings[0].order_index + 1 : 0

    // Créer le fichier
    const { data: newFile, error: createError } = await supabase
      .from('custom_documentation')
      .insert({
        workspace_id: workspaceId,
        parent_id: parent_id || null,
        name: name.trim(),
        type: 'file',
        path,
        content,
        order_index: nextOrderIndex,
        metadata: {
          created_by: user.id,
          created_at: new Date().toISOString(),
          mimeType: `text/${fileExtension === 'md' ? 'markdown' : fileExtension}`,
          fileExtension
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Erreur lors de la création du fichier:', createError)
      return NextResponse.json({ error: 'Erreur lors de la création du fichier' }, { status: 500 })
    }

    return NextResponse.json({ data: newFile }, { status: 201 })
  } catch (error) {
    console.error('Erreur dans l\'API files:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
