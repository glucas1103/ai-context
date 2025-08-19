import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // La fonction `set` est appelée à partir d'un Server Component.
            // Cela peut être ignorée si vous avez un middleware pour rafraîchir
            // les sessions utilisateur.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // La fonction `remove` est appelée à partir d'un Server Component.
            // Cela peut être ignorée si vous avez un middleware pour rafraîchir
            // les sessions utilisateur.
          }
        },
      },
    }
  )
}
