import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value)
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          request.cookies.set(name, '')
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  // IMPORTANT: Ne pas supprimer cette ligne
  const { data: { user }, error } = await supabase.auth.getUser()

  // Gérer les erreurs d'authentification
  if (error) {
    console.log('Middleware auth error:', error.message)
    
    // Si c'est une erreur de session manquante, c'est normal pour les utilisateurs non connectés
    if (error.message === 'Auth session missing!') {
      // Permettre l'accès aux pages publiques
      if (
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/error') ||
        request.nextUrl.pathname === '/'
      ) {
        return supabaseResponse
      }
      
      // Rediriger vers login pour les pages protégées
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    
    // Pour les autres erreurs (token expiré, etc.), nettoyer et rediriger
    console.warn('Auth error in middleware, redirecting to login:', error.message)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Utilisateur authentifié
  if (user) {
    // Si l'utilisateur est sur la page login, le rediriger vers repos
    if (request.nextUrl.pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/repos'
      return NextResponse.redirect(url)
    }
    
    // Permettre l'accès à toutes les autres pages
    return supabaseResponse
  }

  // Utilisateur non authentifié
  // Permettre l'accès aux pages publiques
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/error') ||
    request.nextUrl.pathname === '/'
  ) {
    return supabaseResponse
  }
  
  // Rediriger vers login pour les pages protégées
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
