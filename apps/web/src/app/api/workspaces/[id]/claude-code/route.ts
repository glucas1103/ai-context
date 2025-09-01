import { NextRequest, NextResponse } from 'next/server';
import { query } from '@anthropic-ai/claude-code';
import { createClient } from '@/lib/supabase/server';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

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

Tes spécialités incluent :
- Analyse et révision de code
- Architecture de logiciels et systèmes
- Bonnes pratiques de développement
- Documentation technique
- Détection de bugs et optimisations
- Refactoring et amélioration du code

INSTRUCTIONS:
- Analyse le code de ce projet spécifique
- Utilise Read et Grep pour explorer les fichiers
- Réponds toujours en français
- Sois précis et utilise des exemples concrets du projet
- Fournis des suggestions d'amélioration quand pertinent`,
      allowedTools: ['Read', 'Grep', 'WebSearch'],
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
            
            for await (const responseMessage of query({
              prompt: message,
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
