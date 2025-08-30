import { NextRequest, NextResponse } from 'next/server';
import { query } from '@anthropic-ai/claude-code';

export async function POST(request: NextRequest) {
  try {
    // Vérification de la clé API
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const { message, sessionId, maxTurns = 5 } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Configuration de l'agent expert en documentation technique
    const options = {
      maxTurns,
      // Accès à tout le projet, pas seulement apps/web
      cwd: '/Users/lucasgaillard/Documents/AIcontext',
      additionalDirectories: [
        '/Users/lucasgaillard/Documents/AIcontext/apps',
        '/Users/lucasgaillard/Documents/AIcontext/docs',
        '/Users/lucasgaillard/Documents/AIcontext/doc',
        '/Users/lucasgaillard/Documents/AIcontext/bmad-core'
      ],
      customSystemPrompt: `Tu es un expert en documentation technique travaillant sur le projet AIcontext. Tes spécialités incluent :
- Analyse et rédaction de documentation technique
- Architecture de logiciels et systèmes
- Bonnes pratiques de développement
- Standards de documentation (Markdown, GitBook, etc.)
- Diagrammes et schémas techniques
- Documentation d'API et de codes
- Guides utilisateur et tutoriels

CONTEXTE DU PROJET:
Tu travailles sur "AIcontext", un projet de plateforme d'assistance IA avec :
- Une application web Next.js dans /apps/web
- Documentation de développement dans /docs et /doc
- Configuration BMAD (Business Model & Automated Development) dans /bmad-core

ACCÈS AUX FICHIERS:
Tu peux lire et analyser tous les fichiers du projet. Utilise Read et Grep pour explorer le code.

Réponds toujours en français et de manière structurée. Utilise des exemples concrets du projet quand c'est possible.`,
      allowedTools: ['Read', 'Grep', 'WebSearch'],
      pathToClaudeCodeExecutable: '/Users/lucasgaillard/.npm-global/lib/node_modules/@anthropic-ai/claude-code/cli.js',
      executable: 'node' as const,
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        PATH: `${process.env.PATH}:/usr/local/bin`
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
export async function GET() {
  return NextResponse.json({
    status: 'active',
    agent_type: 'technical_documentation_expert',
    capabilities: [
      'Documentation analysis',
      'Code review and documentation',
      'Architecture documentation',
      'API documentation',
      'User guides creation',
      'Technical writing best practices'
    ]
  });
}
