import { NextRequest, NextResponse } from 'next/server';
import { query } from '@anthropic-ai/claude-code';
import { createClient } from '@/lib/supabase/server';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
// Import des outils MCP simplifiés
import { 
  createDocumentationFile, 
  findDocumentationFolder,
  createDocumentationFileSchema,
  findDocumentationFolderSchema
} from '@/lib/mcp/tools';
import { createMCPConfig } from '@/lib/mcp/config';

// Fonction pour détecter les demandes MCP dans les messages
function detectMCPRequest(message: string): { tool: string; params: any } | null {
  const lowerMessage = message.toLowerCase();
  
  // Détecter les demandes de création de fichiers
  if (lowerMessage.includes('crée') || lowerMessage.includes('create')) {
    // Extraction des paramètres basiques
    const nameMatch = message.match(/(?:crée|create)\s+(?:un\s+)?fichier\s+([a-zA-Z0-9_-]+\.(?:md|txt|doc))/i);
    const folderMatch = message.match(/(?:dans\s+le\s+dossier|in\s+the\s+folder)\s+([a-zA-Z0-9_-]+)/i);
    const tagsMatch = message.match(/(?:avec\s+les\s+tags|with\s+tags)\s+([a-zA-Z0-9\s,]+)/i);
    
    if (nameMatch) {
      const fileName = nameMatch[1];
      const name = fileName.replace(/\.[^.]+$/, ''); // Enlever l'extension
      const fileExtension = fileName.split('.').pop() || 'md';
      
      const params: any = { name, fileExtension };
      
      if (folderMatch) {
        params.parentFolder = folderMatch[1];
      }
      
      if (tagsMatch) {
        params.tags = tagsMatch[1].split(',').map(tag => tag.trim());
      }
      
      return {
        tool: 'create_documentation_file',
        params
      };
    }
  }
  
  // Détecter les demandes de recherche de dossiers
  if (lowerMessage.includes('trouve') || lowerMessage.includes('find') || lowerMessage.includes('localise')) {
    const folderMatch = message.match(/(?:trouve|find|localise)\s+(?:le\s+)?dossier\s+([a-zA-Z0-9_-]+)/i);
    
    if (folderMatch) {
      return {
        tool: 'find_documentation_folder',
        params: { folderName: folderMatch[1] }
      };
    }
  }
  
  return null;
}

// Fonction pour gérer les outils MCP localement
async function handleMCPTool(toolName: string, params: any, mcpConfig: any) {
  try {
    switch (toolName) {
      case 'create_documentation_file':
        // Validation des paramètres
        const validatedParams = createDocumentationFileSchema.parse(params);
        return await createDocumentationFile(validatedParams, mcpConfig);
      
      case 'find_documentation_folder':
        // Validation des paramètres
        const validatedFolderParams = findDocumentationFolderSchema.parse(params);
        return await findDocumentationFolder(validatedFolderParams, mcpConfig);
      
      default:
        throw new Error(`Outil MCP non reconnu: ${toolName}`);
    }
  } catch (error) {
    console.error(`Erreur MCP ${toolName}:`, error);
    return {
      content: [{
        type: "text",
        text: `❌ Erreur lors de l'exécution de l'outil MCP ${toolName}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      }]
    };
  }
}

// Fonction pour configurer le repository du workspace
async function setupWorkspaceRepository(workspace: any): Promise<string> {
  const baseDir = '/tmp/claude-workspaces';
  const workspaceDir = path.join(baseDir, workspace.name);
  
  // Créer le répertoire de base s'il n'existe pas
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true });
  }

  // Vérifier si nous avons une URL GitHub dans le workspace
  const githubUrl = workspace.github_url || workspace.repository_url || workspace.url;
  
  if (githubUrl && githubUrl.includes('github.com')) {
    try {
      // Supprimer le répertoire existant s'il existe
      if (existsSync(workspaceDir)) {
        execSync(`rm -rf "${workspaceDir}"`, { stdio: 'pipe' });
      }
      
      // Cloner le repository
      execSync(`git clone "${githubUrl}" "${workspaceDir}"`, { 
        stdio: 'pipe',
        timeout: 30000 // 30 secondes timeout
      });
      
      return workspaceDir;
      
    } catch (error) {
      // Fallback: utiliser un répertoire temporaire avec le nom du workspace
      if (!existsSync(workspaceDir)) {
        mkdirSync(workspaceDir, { recursive: true });
      }
      return workspaceDir;
    }
  } else {
    // Créer un répertoire temporaire pour le workspace
    if (!existsSync(workspaceDir)) {
      mkdirSync(workspaceDir, { recursive: true });
    }
    return workspaceDir;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification de la clé API
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const { id: workspaceId } = await params;
    const { message, sessionId, chatSessionId, maxTurns = 5 } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Récupérer les données du workspace depuis Supabase
    const supabase = await createClient();
    
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { 
          error: 'Workspace not found',
          details: workspaceError?.message,
          workspaceId 
        },
        { status: 404 }
      );
    }

    // Configuration workspace-aware - cloner le vrai repository
    const workspacePath = await setupWorkspaceRepository(workspace);
    
    // Configuration MCP locale pour les outils de documentation
    const mcpLocalConfig = createMCPConfig(workspaceId);

    const options = {
      maxTurns,
      // Configurer le workspace spécifique
      cwd: workspacePath,
      additionalDirectories: [
        `${workspacePath}/src`,
        `${workspacePath}/apps`,
        `${workspacePath}/docs`,
        `${workspacePath}/README.md`
      ],
      customSystemPrompt: `Tu es un expert en analyse de code travaillant sur le projet "${workspace.name}".

CONTEXTE DU PROJET:
Projet de développement - ${workspace.name}

REPOSITORY: ${workspace.github_url || 'Repository GitHub'}

WORKSPACE PATH: ${workspacePath}

CAPACITÉS MCP INTÉGRÉES:
- Tu peux créer des fichiers de documentation dans la base de données Supabase
- Tu peux organiser la documentation de manière hiérarchique
- Tu peux ajouter des métadonnées (description, tags) aux fichiers

EXEMPLES D'UTILISATION MCP:
- "Crée un fichier README.md à la racine"
- "Crée un guide d'installation dans le dossier docs/"
- "Crée un fichier API.md avec les tags 'api' et 'documentation'"
- "Trouve le dossier docs"

INSTRUCTIONS MCP:
- Quand l'utilisateur demande de créer un fichier, utilise les outils MCP intégrés
- Les fichiers sont créés dans la base de données Supabase, pas dans le système de fichiers
- Valide les paramètres avant de créer le fichier
- Gère les erreurs et informe l'utilisateur du résultat
- Utilise les métadonnées pour organiser la documentation

Tes spécialités incluent :
- Analyse et révision de code
- Architecture de logiciels et systèmes
- Bonnes pratiques de développement
- Documentation technique
- Détection de bugs et optimisations
- Refactoring et amélioration du code

INSTRUCTIONS GÉNÉRALES:
- Analyse le code de ce projet spécifique
- Utilise Read et Grep pour explorer les fichiers
- Utilise les outils MCP pour créer et organiser la documentation
- Réponds toujours en français
- Sois précis et utilise des exemples concrets du projet
- Fournis des suggestions d'amélioration quand pertinent`,
      allowedTools: [
        'Read', 
        'Grep', 
        'WebSearch'
      ],
      pathToClaudeCodeExecutable: '/Users/lucasgaillard/.npm-global/lib/node_modules/@anthropic-ai/claude-code/cli.js',
      executable: 'node' as const,
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        PATH: `${process.env.PATH}:/usr/local/bin:/Users/lucasgaillard/.npm-global/bin`
      },
      ...(sessionId && { resume: sessionId })
    };

    // Utilisation de la fonction query du SDK Claude Code avec streaming
    const encoder = new TextEncoder();
    
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            const allMessages: any[] = [];
            
            // Vérifier si le message contient une demande MCP
            const mcpRequest = detectMCPRequest(message);
            
            let finalPrompt = message;
            
            if (mcpRequest) {
              console.log('MCP: Demande détectée:', mcpRequest);
              
              try {
                const mcpResult = await handleMCPTool(mcpRequest.tool, mcpRequest.params, mcpLocalConfig);
                
                // Ajouter le résultat MCP au message
                finalPrompt = `${message}\n\n${mcpResult.content[0].text}`;
                console.log('MCP: Message enrichi avec le résultat');
                
              } catch (error) {
                console.error('Erreur lors de l\'exécution MCP:', error);
                // En cas d'erreur MCP, continuer avec le message original
              }
            }
            
            // Traitement principal avec Claude Code
            for await (const responseMessage of query({
              prompt: finalPrompt,
              options
            })) {
              allMessages.push(responseMessage);
              
              // Streamer tous les types de messages pour debug/transparence
              const streamData = {
                type: 'stream',
                message: responseMessage
              };
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(streamData)}\n\n`)
              );
              
              // Gestion du résultat final
              if (responseMessage.type === 'result') {
                if (responseMessage.subtype === 'success') {
                  const finalResult = {
                    type: 'final',
                    success: true,
                    response: responseMessage.result,
                    sessionId: responseMessage.session_id,
                    metadata: {
                      duration_ms: responseMessage.duration_ms,
                      num_turns: responseMessage.num_turns,
                      total_cost_usd: responseMessage.total_cost_usd,
                      usage: responseMessage.usage
                    },
                    allMessages
                  };
                  
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(finalResult)}\n\n`)
                  );
                } else {
                  const errorResult = {
                    type: 'final',
                    success: false,
                    error: responseMessage.subtype === 'error_max_turns' 
                      ? 'Maximum number of turns reached' 
                      : 'Error during execution',
                    sessionId: responseMessage.session_id,
                    metadata: {
                      duration_ms: responseMessage.duration_ms,
                      num_turns: responseMessage.num_turns,
                      total_cost_usd: responseMessage.total_cost_usd,
                      usage: responseMessage.usage
                    },
                    allMessages
                  };
                  
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(errorResult)}\n\n`)
                  );
                }
                
                controller.close();
                return;
              }
            }
            
            // Si on arrive ici sans résultat, il y a eu un problème
            const errorResult = {
              type: 'final',
              success: false,
              error: 'No result received from Claude Code',
              allMessages
            };
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errorResult)}\n\n`)
            );
            
            controller.close();
            
          } catch (error) {
            console.error('Error in Claude Code streaming:', error);
            
            const errorResult = {
              type: 'final',
              success: false,
              error: 'Internal server error',
              details: error instanceof Error ? error.message : 'Unknown error'
            };
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errorResult)}\n\n`)
            );
            
            controller.close();
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      }
    );

  } catch (error) {
    console.error('Error in Claude Code API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Endpoint pour obtenir le statut de l'agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    
    // Récupérer les données du workspace depuis Supabase
    const supabase = await createClient();
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { 
          error: 'Workspace not found',
          details: workspaceError?.message,
          workspaceId 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'active',
      agent_type: 'claude_code_expert',
      workspace: workspace.name,
      capabilities: [
        'Code analysis and review',
        'Architecture documentation',
        'Bug detection and fixes',
        'Performance optimization',
        'Refactoring suggestions',
        'Best practices guidance'
      ]
    });
  } catch (error) {
    console.error('Error getting agent status:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
