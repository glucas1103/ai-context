import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/repos'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('OAuth Callback - Code:', !!code, 'Error:', error, 'Error Description:', errorDescription)

  // Gérer les erreurs OAuth
  if (error) {
    console.error('Erreur OAuth:', error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=oauth_error&message=${encodeURIComponent(errorDescription || error)}`)
  }

  if (!code) {
    console.error('Aucun code OAuth reçu dans le callback')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  
  try {
    console.log('Tentative d\'échange du code OAuth...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Erreur lors de l\'échange du code OAuth:', exchangeError.message)
      return NextResponse.redirect(`${origin}/login?error=auth_error&message=${encodeURIComponent(exchangeError.message)}`)
    }

    if (!data.session) {
      console.error('Aucune session créée après l\'échange du code')
      return NextResponse.redirect(`${origin}/login?error=no_session`)
    }

    console.log('Session créée avec succès pour l\'utilisateur:', data.session.user?.email)

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
  } catch (err) {
    console.error('Erreur inattendue lors du callback OAuth:', err)
    return NextResponse.redirect(`${origin}/login?error=unexpected_error`)
  }
}
