import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateDocumentationItemRequest, DocumentationApiResponse, DocumentationNode } from '@/types/api/documentation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const workspaceId = resolvedParams.id;

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

    // Parser le body de la requête
    const body: CreateDocumentationItemRequest = await request.json();
    
    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Le nom du fichier est requis', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    if (body.type !== 'file') {
      return NextResponse.json(
        { success: false, error: { message: 'Ce endpoint est uniquement pour créer des fichiers', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Validation du nom (caractères autorisés)
    const nameRegex = /^[a-zA-Z0-9\s\-_àáâäçéèêëíìîïñóòôöúùûüýÿ]+$/;
    if (!nameRegex.test(body.name)) {
      return NextResponse.json(
        { success: false, error: { message: 'Le nom contient des caractères non autorisés', code: 'INVALID_NAME' } },
        { status: 400 }
      );
    }

    // Déterminer l'extension du fichier
    const fileExtension = body.fileExtension || 'md';
    const allowedExtensions = ['md', 'txt', 'doc'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: { message: 'Extension de fichier non autorisée', code: 'INVALID_EXTENSION' } },
        { status: 400 }
      );
    }

    const fileName = `${body.name}.${fileExtension}`;

    // Construire le chemin
    let path = `/${fileName}`;
    if (body.parent_id) {
      // Récupérer le parent pour construire le chemin complet
      const { data: parent, error: parentError } = await supabase
        .from('custom_documentation')
        .select('path')
        .eq('id', body.parent_id)
        .eq('workspace_id', workspaceId)
        .single();

      if (parentError || !parent) {
        return NextResponse.json(
          { success: false, error: { message: 'Dossier parent non trouvé', code: 'PARENT_NOT_FOUND' } },
          { status: 404 }
        );
      }

      path = `${parent.path}/${fileName}`;
    }

    // Vérifier que le chemin n'existe pas déjà
    const { data: existing, error: existingError } = await supabase
      .from('custom_documentation')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('path', path)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Un fichier avec ce nom existe déjà à cet emplacement', code: 'ALREADY_EXISTS' } },
        { status: 409 }
      );
    }

    // Calculer l'order_index (dernier élément + 1)
    const { data: siblings, error: siblingsError } = await supabase
      .from('custom_documentation')
      .select('order_index')
      .eq('workspace_id', workspaceId)
      .eq('parent_id', body.parent_id || null)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = siblings && siblings.length > 0 ? siblings[0].order_index + 1 : 0;

    // Contenu initial par défaut
    const initialContent = fileExtension === 'md' 
      ? `# ${body.name}\n\nCommencez à écrire votre documentation ici...`
      : `${body.name}\n\nContenu du document...`;

    // Créer le fichier
    const { data: newFile, error: insertError } = await supabase
      .from('custom_documentation')
      .insert({
        workspace_id: workspaceId,
        parent_id: body.parent_id || null,
        name: fileName,
        type: 'file',
        path: path,
        content: initialContent,
        metadata: {
          created_by: user.id,
          description: '',
          tags: [],
          mimeType: fileExtension === 'md' ? 'text/markdown' : 'text/plain'
        },
        order_index: nextOrderIndex
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating file:', insertError);
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la création du fichier', code: 'CREATE_ERROR' } },
        { status: 500 }
      );
    }

    const createdNode: DocumentationNode = {
      id: newFile.id,
      name: newFile.name,
      type: newFile.type,
      path: newFile.path,
      content: newFile.content,
      fileExtension: fileExtension,
      parent_id: newFile.parent_id,
      children: [],
      metadata: newFile.metadata,
      order_index: newFile.order_index,
      created_at: newFile.created_at,
      updated_at: newFile.updated_at
    };

    const response: DocumentationApiResponse<DocumentationNode> = {
      success: true,
      data: createdNode
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in files API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
