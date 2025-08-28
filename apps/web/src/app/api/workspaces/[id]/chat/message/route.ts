/**
 * API Route pour les messages de chat avec streaming Claude Code
 * Story 1.6.1 - Phase 4
 * POST /api/workspaces/[id]/chat/message - Envoyer un message et recevoir la réponse en streaming
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatService } from '@/lib/services/chatService';
import { ChatMessage, ChatRole, ANTHROPIC_STREAM_CONFIG } from '@/types/chat/universal';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Non authentifié', code: 'auth_required' } },
        { status: 401 }
      );
    }

    const { id: workspaceId } = await params;
    const body = await request.json();
    const { sessionId, message, context } = body;

    // Valider les paramètres
    if (!sessionId || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'sessionId et message sont requis', 
            code: 'invalid_parameters' 
          } 
        },
        { status: 400 }
      );
    }

    // Créer le message utilisateur
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user' as ChatRole,
      content: message,
      timestamp: new Date(),
      status: 'sent'
    };

    // Sauvegarder le message utilisateur
    await chatService.addMessage(sessionId, userMessage);

    // Configurer le streaming response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Simuler l'investigation et le streaming Claude
          // En production, ici on appellerait l'API Anthropic avec le SDK
          
          // Étape 1: Investigation
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'investigation_start',
              query: message,
              timestamp: new Date().toISOString()
            })}\n\n`)
          );

          await new Promise(resolve => setTimeout(resolve, 500));

          // Étape 2: Début de réponse
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'message_start',
              message_id: `msg_${Date.now()}_assistant`
            })}\n\n`)
          );

          // Étape 3: Streaming du contenu (simulation)
          const responseContent = `Bonjour ! J'ai analysé votre message : "${message}".

En tant qu'assistant Claude Code, je peux vous aider à :
- 🔍 Analyser votre code
- 📝 Améliorer votre documentation  
- 🔧 Identifier les problèmes potentiels
- 💡 Proposer des améliorations

Contexte détecté :
- Workspace: ${workspaceId}
- Fichier sélectionné: ${context?.selectedFile || 'Aucun'}
- Répertoire: ${context?.currentDirectory || '/'}

Que souhaitez-vous que j'analyse plus en détail ?`;

          const words = responseContent.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'content_delta',
                delta: chunk
              })}\n\n`)
            );
            
            // Délai pour simuler le streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          // Étape 4: Fin du message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'message_complete',
              usage: {
                input_tokens: message.length / 4,
                output_tokens: responseContent.length / 4
              }
            })}\n\n`)
          );

          // Créer et sauvegarder le message assistant
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_assistant`,
            role: 'assistant' as ChatRole,
            content: responseContent,
            timestamp: new Date(),
            status: 'sent',
            metadata: {
              toolsUsed: ['code_analysis', 'context_understanding'],
              investigationSteps: [{
                tool: 'context_analysis',
                query: message,
                result: 'Context analyzed successfully',
                timestamp: new Date(),
                duration: 500
              }],
              filesAnalyzed: context?.selectedFile ? [context.selectedFile] : []
            }
          };

          await chatService.addMessage(sessionId, assistantMessage);

          // Fermer le stream
          controller.close();

        } catch (error) {
          console.error('Erreur dans le streaming:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: {
                message: error instanceof Error ? error.message : 'Erreur inconnue',
                code: 'streaming_error'
              }
            })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Erreur interne du serveur',
          code: 'message_send_error'
        }
      },
      { status: 500 }
    );
  }
}
