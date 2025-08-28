/**
 * Script de migration pour initialiser les propriétés d'onglets
 * sur les sessions de chat existantes
 */

import { createClient } from '@/lib/supabase/server'

interface ChatSession {
  id: string
  title: string | null
  tab_order: number | null
  is_active: boolean | null
  is_dirty: boolean | null
  user_id: string
  workspace_id: string
}

export async function migrateSessions() {
  const supabase = await createClient()
  
  try {
    // Récupérer toutes les sessions sans propriétés d'onglets définies
    const { data: sessions, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('id, title, tab_order, is_active, is_dirty, user_id, workspace_id')
      .or('tab_order.is.null,is_active.is.null,is_dirty.is.null')

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération: ${fetchError.message}`)
    }

    if (!sessions || sessions.length === 0) {
      console.log('✅ Aucune session à migrer')
      return
    }

    console.log(`🔄 Migration de ${sessions.length} sessions...`)

    // Grouper par utilisateur et workspace pour définir l'ordre
    const sessionsByUserWorkspace = sessions.reduce((acc, session) => {
      const key = `${session.user_id}-${session.workspace_id}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(session)
      return acc
    }, {} as Record<string, ChatSession[]>)

    // Migrer chaque groupe
    for (const [key, groupSessions] of Object.entries(sessionsByUserWorkspace)) {
      console.log(`📝 Migration du groupe ${key} (${groupSessions.length} sessions)`)

      for (let i = 0; i < groupSessions.length; i++) {
        const session = groupSessions[i]
        const isFirstSession = i === 0

        const updates: Partial<ChatSession> = {}

        // Définir tab_order si non défini
        if (session.tab_order === null) {
          updates.tab_order = i
        }

        // Définir is_active si non défini (seule la première session sera active)
        if (session.is_active === null) {
          updates.is_active = isFirstSession
        }

        // Définir is_dirty si non défini
        if (session.is_dirty === null) {
          updates.is_dirty = false
        }

        // Définir title si non défini
        if (!session.title) {
          updates.title = `Conversation ${i + 1}`
        }

        // Appliquer les mises à jour si nécessaire
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('chat_sessions')
            .update(updates)
            .eq('id', session.id)

          if (updateError) {
            console.error(`❌ Erreur lors de la mise à jour de ${session.id}:`, updateError)
          } else {
            console.log(`✅ Session ${session.id} mise à jour`)
          }
        }
      }
    }

    console.log('🎉 Migration terminée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  }
}

// Exécuter si appelé directement
if (typeof window === 'undefined' && require.main === module) {
  migrateSessions()
    .then(() => {
      console.log('Migration terminée')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Échec de la migration:', error)
      process.exit(1)
    })
}
