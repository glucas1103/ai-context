import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DocumentationNode, DocumentationApiResponse } from '@/lib/types/documentation';

export async function GET(
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

    // Récupérer tous les documents de ce workspace
    const { data: documents, error: documentsError } = await supabase
      .from('custom_documentation')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('order_index', { ascending: true });

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      console.error('Workspace ID:', workspaceId);
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la récupération des documents', code: 'FETCH_ERROR', details: documentsError.message } },
        { status: 500 }
      );
    }

    // Si aucun document trouvé, retourner un tableau vide (pas une erreur)
    if (!documents) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Construire l'arborescence
    const documentMap = new Map<string, DocumentationNode>();
    const rootNodes: DocumentationNode[] = [];

    // Première passe : créer tous les nœuds
    documents?.forEach(doc => {
      const node: DocumentationNode = {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        path: doc.path,
        content: doc.content,
        parent_id: doc.parent_id,
        children: [],
        metadata: doc.metadata || {},
        order_index: doc.order_index || 0,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      };
      documentMap.set(doc.id, node);
    });

    // Deuxième passe : construire la hiérarchie
    documentMap.forEach(node => {
      if (node.parent_id) {
        const parent = documentMap.get(node.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Trier les enfants par order_index
    const sortChildren = (nodes: DocumentationNode[]) => {
      nodes.sort((a, b) => a.order_index - b.order_index);
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortChildren(node.children);
        }
      });
    };

    sortChildren(rootNodes);

    const response: DocumentationApiResponse<DocumentationNode[]> = {
      success: true,
      data: rootNodes
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in documentation tree API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
