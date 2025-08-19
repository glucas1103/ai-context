import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/repos'

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Redirection réussie vers la page des dépôts
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      } else {
        console.error('Erreur lors de l\'échange du code OAuth:', error.message)
        return NextResponse.redirect(`${origin}/login?error=auth_error`)
      }
    } catch (err) {
      console.error('Erreur inattendue lors du callback OAuth:', err)
      return NextResponse.redirect(`${origin}/login?error=unexpected_error`)
    }
  }

  // Retourner une erreur si pas de code
  console.error('Aucun code OAuth reçu dans le callback')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
