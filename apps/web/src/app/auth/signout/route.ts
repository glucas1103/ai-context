import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { origin } = new URL(request.url)

  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Erreur lors de la déconnexion:', error.message)
      return NextResponse.json(
        { error: { message: 'Erreur lors de la déconnexion', code: 'signout_error' } },
        { status: 500 }
      )
    }

    // Redirection vers la page de connexion après déconnexion
    return NextResponse.redirect(`${origin}/login`)
    
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
