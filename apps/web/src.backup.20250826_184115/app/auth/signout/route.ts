import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { origin } = new URL(request.url)

  try {
    // Récupérer le scope depuis le body de la requête
    const body = await request.json().catch(() => ({}))
    const scope = body.scope || 'local'

    const { error } = await supabase.auth.signOut({ scope })
    
    if (error) {
      console.error('Erreur lors de la déconnexion:', error.message)
      return NextResponse.json(
        { error: { message: 'Erreur lors de la déconnexion', code: 'signout_error', details: error.message } },
        { status: 500 }
      )
    }

    // Redirection vers la page de connexion après déconnexion
    return NextResponse.json({ success: true, scope })
    
  } catch (err) {
    console.error('Erreur inattendue lors de la déconnexion:', err)
    return NextResponse.json(
      { error: { message: 'Erreur inattendue lors de la déconnexion', code: 'unexpected_error' } },
      { status: 500 }
    )
  }
}

// Permet aussi les requêtes GET pour un lien de déconnexion simple
export async function GET(request: Request) {
  return POST(request)
}
