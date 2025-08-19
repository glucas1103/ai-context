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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Évite d'écrire de la logique entre createServerClient et
  // supabase.auth.getUser(). Un simple bug pourrait casser votre middleware !

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // IMPORTANT: Vous *devez* retourner la supabaseResponse objet tel qu'il l'est.
  // Si vous créez un nouveau NextResponse ici, vous pourriez supprimer les cookies du navigateur.

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Correspond à tous les chemins de requête sauf pour ceux commençant par :
     * - _next/static (fichiers statiques)
     * - _next/image (fichiers d'optimisation d'image)
     * - favicon.ico (fichier favicon)
     * N'oubliez pas de modifier cette configuration si nécessaire
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
