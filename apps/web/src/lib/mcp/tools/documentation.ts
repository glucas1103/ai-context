import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schéma de validation pour la création de fichiers
export const createDocumentationFileSchema = z.object({
  name: z.string().min(1).max(100),
  fileExtension: z.enum(['md', 'txt', 'doc']),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  parentFolder: z.string().optional()
});

// Schéma de validation pour la recherche de dossiers
export const findDocumentationFolderSchema = z.object({
  folderName: z.string().min(1)
});

export type CreateDocumentationFileParams = z.infer<typeof createDocumentationFileSchema>;
export type FindDocumentationFolderParams = z.infer<typeof findDocumentationFolderSchema>;

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface MCPConfig {
  name: string;
  version: string;
  description: string;
  workspaceId: string;
  baseUrl: string;
  supabaseAnonKey: string;
}

// Outil de création de fichiers de documentation
export async function createDocumentationFile(
  params: CreateDocumentationFileParams,
  config: MCPConfig
): Promise<MCPResponse> {
  try {
    // Validation des paramètres
    const validatedParams = createDocumentationFileSchema.parse(params);
    
    // Créer le client Supabase
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        content: [{
          type: "text",
          text: "❌ Erreur: Vous devez être connecté pour créer des fichiers de documentation."
        }]
      };
    }

    // Préparer le body de la requête
    const requestBody = {
      name: validatedParams.name,
      type: 'file' as const,
      fileExtension: validatedParams.fileExtension,
      description: validatedParams.description || '',
      tags: validatedParams.tags || [],
      parent_id: null // Pour l'instant, on crée à la racine
    };

    // Si un dossier parent est spécifié, le rechercher
    if (validatedParams.parentFolder) {
      const { data: parentFolder } = await supabase
        .from('custom_documentation')
        .select('id')
        .eq('workspace_id', config.workspaceId)
        .eq('name', validatedParams.parentFolder)
        .eq('type', 'folder')
        .single();

      if (parentFolder) {
        requestBody.parent_id = parentFolder.id;
      } else {
        return {
          content: [{
            type: "text",
            text: `❌ Erreur: Le dossier parent "${validatedParams.parentFolder}" n'a pas été trouvé.`
          }]
        };
      }
    }

    // Créer le fichier directement dans la base de données
    const { data: result, error: createError } = await supabase
      .from('custom_documentation')
      .insert({
        workspace_id: config.workspaceId,
        name: `${validatedParams.name}.${validatedParams.fileExtension}`,
        type: 'file',
        path: requestBody.parent_id ? `/${validatedParams.name}.${validatedParams.fileExtension}` : `/${validatedParams.name}.${validatedParams.fileExtension}`,
        metadata: {
          description: validatedParams.description || '',
          tags: validatedParams.tags || [],
          fileExtension: validatedParams.fileExtension
        },
        order_index: 0
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Erreur lors de la création: ${createError.message}`);
    }

    return {
      content: [{
        type: "text",
        text: `✅ Fichier "${validatedParams.name}.${validatedParams.fileExtension}" créé avec succès !\n\n📁 Chemin: ${result.path}\n📝 Description: ${validatedParams.description || 'Aucune'}\n🏷️ Tags: ${validatedParams.tags?.join(', ') || 'Aucun'}`
      }]
    };

  } catch (error) {
    console.error('Erreur MCP createDocumentationFile:', error);
    return {
      content: [{
        type: "text",
        text: `❌ Erreur lors de la création du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      }]
    };
  }
}

// Outil de recherche de dossiers de documentation
export async function findDocumentationFolder(
  params: FindDocumentationFolderParams,
  config: MCPConfig
): Promise<MCPResponse> {
  try {
    // Validation des paramètres
    const validatedParams = findDocumentationFolderSchema.parse(params);
    
    // Créer le client Supabase
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        content: [{
          type: "text",
          text: "❌ Erreur: Vous devez être connecté pour rechercher des dossiers de documentation."
        }]
      };
    }

    // Rechercher le dossier par nom
    const { data: folder } = await supabase
      .from('custom_documentation')
      .select('*')
      .eq('workspace_id', config.workspaceId)
      .eq('name', validatedParams.folderName)
      .eq('type', 'folder')
      .single();

    if (folder) {
      return {
        content: [{
          type: "text",
          text: `✅ Dossier trouvé: "${folder.name}"\n\n📁 ID: ${folder.id}\n📍 Chemin: ${folder.path}\n📝 Type: ${folder.type}`
        }]
      };
    } else {
      return {
        content: [{
          type: "text",
          text: `❌ Aucun dossier trouvé avec le nom "${validatedParams.folderName}"`
        }]
      };
    }

  } catch (error) {
    console.error('Erreur MCP findDocumentationFolder:', error);
    return {
      content: [{
        type: "text",
        text: `❌ Erreur lors de la recherche du dossier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      }]
    };
  }
}
