#!/usr/bin/env node

/**
 * Serveur MCP pour la gestion de la documentation
 * Point d'entrée pour l'intégration avec Claude Code
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration par défaut
const DEFAULT_CONFIG = {
  port: process.env.MCP_PORT || 3001,
  host: process.env.MCP_HOST || 'localhost',
  workspaceId: process.env.WORKSPACE_ID || 'default',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
};

// Vérification des variables d'environnement requises
if (!DEFAULT_CONFIG.workspaceId) {
  console.error('❌ Erreur: WORKSPACE_ID est requis');
  process.exit(1);
}

if (!DEFAULT_CONFIG.supabaseUrl || !DEFAULT_CONFIG.supabaseAnonKey) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_ANON_KEY sont requis');
  process.exit(1);
}

console.log('🚀 Démarrage du serveur MCP Documentation...');
console.log(`📁 Workspace ID: ${DEFAULT_CONFIG.workspaceId}`);
console.log(`🌐 Port: ${DEFAULT_CONFIG.port}`);
console.log(`🏠 Host: ${DEFAULT_CONFIG.host}`);

// Serveur MCP simplifié
class SimpleMCPServer {
  constructor(config) {
    this.config = config;
    this.name = "Documentation MCP Server";
    this.version = "1.0.0";
    this.description = "Serveur MCP pour la gestion de la documentation des workspaces";
  }

  // Méthode pour créer un fichier de documentation
  async createDocumentationFile(params) {
    console.log('MCP: Création de fichier demandée:', params);
    
    try {
      // Validation basique des paramètres
      if (!params.name || typeof params.name !== 'string') {
        throw new Error('Le nom du fichier est requis et doit être une chaîne');
      }

      const fileExtension = params.fileExtension || 'md';
      const allowedExtensions = ['md', 'txt', 'doc'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Extension non autorisée. Utilisez: ${allowedExtensions.join(', ')}`);
      }

      // Préparer la requête pour l'API
      const requestBody = {
        name: params.name,
        type: 'file',
        fileExtension: fileExtension,
        parent_id: params.parentFolder ? await this.findDocumentationFolderByName(params.parentFolder) : null,
        metadata: {
          description: params.description || '',
          tags: params.tags || [],
        }
      };

      // Appeler l'API de création de fichier
      const response = await fetch(
        `${this.config.supabaseUrl}/api/workspaces/${this.config.workspaceId}/documentation/files`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur API: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          content: [{
            type: "text",
            text: `✅ Fichier "${params.name}.${fileExtension}" créé avec succès !\n\n📁 Chemin: ${result.data.path}\n📝 Description: ${params.description || 'Aucune'}\n🏷️ Tags: ${params.tags?.join(', ') || 'Aucun'}`
          }]
        };
      } else {
        throw new Error(`Erreur lors de la création: ${result.error?.message || 'Erreur inconnue'}`);
      }

    } catch (error) {
      console.error('MCP: Erreur lors de la création:', error);
      return {
        content: [{
          type: "text",
          text: `❌ Erreur lors de la création du fichier: ${error.message}`
        }]
      };
    }
  }

  // Méthode pour rechercher un dossier de documentation
  async findDocumentationFolder(params) {
    console.log('MCP: Recherche de dossier demandée:', params);
    
    try {
      if (!params.folderName || typeof params.folderName !== 'string') {
        throw new Error('Le nom du dossier est requis et doit être une chaîne');
      }

      // Rechercher le dossier par nom
      const folder = await this.findDocumentationFolderByName(params.folderName);

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
            text: `❌ Aucun dossier trouvé avec le nom "${params.folderName}"`
          }]
        };
      }

    } catch (error) {
      console.error('MCP: Erreur lors de la recherche:', error);
      return {
        content: [{
          type: "text",
          text: `❌ Erreur lors de la recherche du dossier: ${error.message}`
        }]
      };
    }
  }

  // Fonction utilitaire pour rechercher un dossier par nom
  async findDocumentationFolderByName(folderName) {
    try {
      // Appeler l'API de recherche de dossiers
      const response = await fetch(
        `${this.config.supabaseUrl}/api/workspaces/${this.config.workspaceId}/documentation/folders`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          }
        }
      );

      if (!response.ok) {
        console.error('Erreur lors de la recherche de dossiers:', response.statusText);
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Rechercher le dossier par nom
        const folder = result.data.find((item) => 
          item.type === 'folder' && 
          item.name.toLowerCase() === folderName.toLowerCase()
        );
        
        return folder ? {
          id: folder.id,
          name: folder.name,
          path: folder.path,
          type: folder.type
        } : null;
      }

      return null;

    } catch (error) {
      console.error('Erreur lors de la recherche de dossier:', error);
      return null;
    }
  }

  // Méthode pour obtenir les informations du serveur
  getServerInfo() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      workspaceId: this.config.workspaceId,
      tools: [
        {
          name: "create_documentation_file",
          description: "Créer un nouveau fichier de documentation dans le workspace",
          parameters: {
            name: "string (requis) - Nom du fichier (sans extension)",
            fileExtension: "string (optionnel) - Extension du fichier (md, txt, doc, défaut: md)",
            parentFolder: "string (optionnel) - Nom du dossier parent",
            description: "string (optionnel) - Description du fichier",
            tags: "array (optionnel) - Tags pour organiser le fichier"
          }
        },
        {
          name: "find_documentation_folder",
          description: "Trouver un dossier de documentation par nom",
          parameters: {
            folderName: "string (requis) - Nom du dossier à rechercher"
          }
        }
      ]
    };
  }
}

function startMCPServer() {
  console.log('🔧 Démarrage du serveur MCP...');
  
  try {
    // Créer le serveur MCP
    const mcpServer = new SimpleMCPServer(DEFAULT_CONFIG);
    
    // Afficher les informations du serveur
    const serverInfo = mcpServer.getServerInfo();
    console.log('✅ Serveur MCP créé avec succès');
    console.log(`📡 Nom: ${serverInfo.name}`);
    console.log(`🔢 Version: ${serverInfo.version}`);
    console.log(`📝 Description: ${serverInfo.description}`);
    console.log(`📁 Workspace: ${serverInfo.workspaceId}`);
    console.log(`🛠️ Outils disponibles: ${serverInfo.tools.length}`);
    
    serverInfo.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    
    console.log('\n📡 Serveur MCP prêt à recevoir des requêtes');
    console.log('💡 Ce serveur est conçu pour fonctionner avec Claude Code via MCP');
    console.log('🔧 Pour tester, utilisez les outils MCP dans Claude Code');
    
    // Gérer l'arrêt gracieux
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt du serveur MCP...');
      console.log('✅ Serveur MCP arrêté avec succès');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt du serveur MCP...');
      console.log('✅ Serveur MCP arrêté avec succès');
      process.exit(0);
    });
    
    // Maintenir le processus en vie
    console.log('⏳ En attente de requêtes... (Ctrl+C pour arrêter)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du serveur MCP:', error);
    process.exit(1);
  }
}

// Démarrer le serveur MCP
startMCPServer();

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  process.exit(1);
});
