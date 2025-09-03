import { MCPConfig, createMCPConfig } from './config';
import { 
  createDocumentationFile, 
  findDocumentationFolder,
  createDocumentationFileSchema,
  findDocumentationFolderSchema,
  CreateDocumentationFileParams,
  FindDocumentationFolderParams
} from './tools';

export class DocumentationMCPServer {
  private config: MCPConfig;

  constructor(workspaceId: string) {
    this.config = createMCPConfig(workspaceId);
  }

  // Méthode pour créer un fichier de documentation
  async createDocumentationFile(params: CreateDocumentationFileParams) {
    console.log('MCP: Création de fichier demandée:', params);
    
    try {
      const result = await createDocumentationFile(params, this.config);
      console.log('MCP: Fichier créé avec succès');
      return result;
    } catch (error) {
      console.error('MCP: Erreur lors de la création:', error);
      return {
        content: [{
          type: "text",
          text: `❌ Erreur lors de la création du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        }]
      };
    }
  }

  // Méthode pour rechercher un dossier de documentation
  async findDocumentationFolder(params: FindDocumentationFolderParams) {
    console.log('MCP: Recherche de dossier demandée:', params);
    
    try {
      const result = await findDocumentationFolder(params, this.config);
      console.log('MCP: Recherche terminée');
      return result;
    } catch (error) {
      console.error('MCP: Erreur lors de la recherche:', error);
      return {
        content: [{
          type: "text",
          text: `❌ Erreur lors de la recherche du dossier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        }]
      };
    }
  }

  // Méthode pour valider les paramètres de création de fichier
  validateCreateFileParams(params: any): params is CreateDocumentationFileParams {
    try {
      createDocumentationFileSchema.parse(params);
      return true;
    } catch {
      return false;
    }
  }

  // Méthode pour valider les paramètres de recherche de dossier
  validateFindFolderParams(params: any): params is FindDocumentationFolderParams {
    try {
      findDocumentationFolderSchema.parse(params);
      return true;
    } catch {
      return false;
    }
  }

  // Getter pour la configuration
  getConfig() {
    return this.config;
  }

  // Méthode pour obtenir les informations du serveur
  getServerInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      workspaceId: this.config.workspaceId,
      tools: [
        {
          name: "create_documentation_file",
          description: "Créer un nouveau fichier de documentation dans le workspace",
          parameters: createDocumentationFileSchema
        },
        {
          name: "find_documentation_folder",
          description: "Trouver un dossier de documentation par nom",
          parameters: findDocumentationFolderSchema
        }
      ]
    };
  }
}

// Fonction factory pour créer une instance du serveur
export function createDocumentationMCPServer(workspaceId: string): DocumentationMCPServer {
  return new DocumentationMCPServer(workspaceId);
}
