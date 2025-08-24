# Guide des Bonnes Pratiques Supabase Auth

## Vue d'ensemble

Ce guide présente les bonnes pratiques officielles pour l'implémentation de Supabase Auth dans une application Next.js, basé sur la documentation officielle Supabase.

## ⚠️ MIGRATION CRITIQUE : `@supabase/ssr`

### Changement Obligatoire

Les `@supabase/auth-helpers-nextjs` sont **DÉPRÉCIÉS** et doivent être remplacés par `@supabase/ssr`.

```bash
# Désinstaller les packages dépréciés
npm uninstall @supabase/auth-helpers-nextjs

# Installer le nouveau package
npm install @supabase/ssr
```

### Utilitaires Clients Officiels

#### 1. Client Browser (`utils/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 2. Client Server (`utils/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore si appelé depuis un Server Component
          }
        },
      },
    }
  )
}
```

#### 3. Middleware (`utils/supabase/middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // IMPORTANT : Ne pas supprimer cette ligne
  const { data: { user } } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/error')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

#### 4. Configuration Middleware (`middleware.ts`)

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 🔐 Sécurité Critique

### ⚠️ AVERTISSEMENTS DE SÉCURITÉ OFFICIELS

1. **NE JAMAIS utiliser `getSession()` côté serveur**
   - `getSession()` ne revalide pas le token côté serveur
   - Les cookies peuvent être falsifiés côté client

2. **TOUJOURS utiliser `getUser()` pour valider l'authentification**
   - `getUser()` envoie une requête au serveur Supabase pour revalider
   - C'est la seule méthode sécurisée côté serveur

```typescript
// ❌ DANGEREUX - Ne pas utiliser côté serveur
const { data: { session } } = await supabase.auth.getSession()

// ✅ SÉCURISÉ - Utiliser côté serveur
const { data: { user } } = await supabase.auth.getUser()
```

### Protection des Routes

```typescript
// Server Component - Protection sécurisée
export default async function ProtectedPage() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  return <p>Hello {data.user.email}</p>
}
```

## 🔑 Gestion des Provider Tokens

### Pattern Officiel pour GitHub

```typescript
// Récupération du provider token
const { data: { session } } = await supabase.auth.getSession()
const providerToken = session?.provider_token

if (!providerToken) {
  throw new Error('No provider token available')
}

// Utilisation avec GitHub API
const response = await fetch('https://api.github.com/user/repos', {
  headers: {
    'Authorization': `token ${providerToken}`,
    'Accept': 'application/vnd.github.v3+json'
  }
})
```

### Refresh Automatique des Tokens

```typescript
// Gestion du refresh selon la documentation officielle
const { data, error } = await supabase.auth.refreshSession()

if (error) {
  // Token révoqué ou expiré de manière permanente
  throw new Error('Failed to refresh session')
}

// Nouveau provider token disponible
const newProviderToken = data.session?.provider_token
```

## 🗄️ Politiques RLS (Row Level Security)

### Activation de RLS

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
```

### Politiques de Base

```sql
-- Politique pour l'isolation des données utilisateur
CREATE POLICY "Users can only access their own workspaces" ON workspaces
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own knowledge bases" ON knowledge_bases
  FOR ALL USING (auth.uid() = user_id);
```

### Politiques Avancées

```sql
-- Politique pour les données partagées
CREATE POLICY "Users can access shared workspaces" ON workspaces
  FOR SELECT USING (
    auth.uid() = user_id OR 
    id IN (
      SELECT workspace_id FROM workspace_shares 
      WHERE user_id = auth.uid()
    )
  );

-- Politique pour les données publiques
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
```

## 🚀 Server Actions

### Pattern Officiel pour l'Authentification

```typescript
// app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
```

## 🔄 Gestion des Erreurs

### Types d'Erreurs GitHub

```typescript
enum GitHubErrorType {
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_REVOKED = 'token_revoked',
  RATE_LIMIT = 'rate_limit',
  INSUFFICIENT_SCOPES = 'insufficient_scopes',
  API_ERROR = 'api_error'
}
```

### Gestion des Erreurs avec Retry

```typescript
const handleGitHubError = async (
  error: any, 
  supabase: SupabaseClient
): Promise<GitHubErrorType> => {
  if (error.status === 401) {
    // Token expiré ou révoqué
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        return GitHubErrorType.TOKEN_REVOKED
      }
      return GitHubErrorType.TOKEN_EXPIRED
    } catch {
      return GitHubErrorType.TOKEN_REVOKED
    }
  }
  
  if (error.status === 403) {
    return GitHubErrorType.RATE_LIMIT
  }
  
  return GitHubErrorType.API_ERROR
}
```

## 🧪 Tests

### Tests de Sécurité

```typescript
// Test d'isolation des données
describe('Data Isolation', () => {
  it('should not allow user to access other user data', async () => {
    const user1 = await createTestUser()
    const user2 = await createTestUser()
    
    const supabase1 = createClientWithUser(user1)
    const supabase2 = createClientWithUser(user2)
    
    // User1 crée des données
    const { data: workspace } = await supabase1
      .from('workspaces')
      .insert({ name: 'Test Workspace' })
      .select()
      .single()
    
    // User2 ne peut pas accéder aux données de User1
    const { data: user2Workspaces } = await supabase2
      .from('workspaces')
      .select()
    
    expect(user2Workspaces).not.toContainEqual(workspace)
  })
})
```

### Tests du Middleware

```typescript
// Test de protection des routes
describe('Route Protection', () => {
  it('should redirect unauthenticated users to login', async () => {
    const response = await fetch('/protected-route')
    expect(response.redirected).toBe(true)
    expect(response.url).toContain('/login')
  })
  
  it('should allow authenticated users to access protected routes', async () => {
    const user = await createTestUser()
    const response = await fetch('/protected-route', {
      headers: {
        'Cookie': `sb-auth-token=${user.session.access_token}`
      }
    })
    expect(response.ok).toBe(true)
  })
})
```

## 📚 Ressources Officielles

### Documentation Supabase
- [Migration vers `@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers)
- [Setup Server-Side Auth pour Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Creating a client](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Provider tokens](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Exemples Officiels
- [Next.js User Management Example](https://github.com/supabase/supabase/tree/master/examples/user-management/nextjs-user-management)
- [Next.js Auth Example](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)

## 🚨 Checklist de Migration

### Avant la Migration
- [ ] Sauvegarder le code actuel
- [ ] Identifier tous les fichiers utilisant `@supabase/auth-helpers-nextjs`
- [ ] Préparer les tests de régression

### Pendant la Migration
- [ ] Désinstaller `@supabase/auth-helpers-nextjs`
- [ ] Installer `@supabase/ssr`
- [ ] Créer les utilitaires clients officiels
- [ ] Mettre à jour tous les imports
- [ ] Tester l'authentification

### Après la Migration
- [ ] Vérifier que toutes les fonctionnalités marchent
- [ ] Tester la sécurité (isolation des données)
- [ ] Valider les performances
- [ ] Mettre à jour la documentation

## ⚡ Bonnes Pratiques de Performance

### Optimisation des Requêtes

```typescript
// ✅ Bon - Requête optimisée avec sélection spécifique
const { data } = await supabase
  .from('workspaces')
  .select('id, name, created_at')
  .eq('user_id', user.id)

// ❌ Éviter - Sélection de toutes les colonnes
const { data } = await supabase
  .from('workspaces')
  .select('*')
  .eq('user_id', user.id)
```

### Cache et Revalidation

```typescript
// Server Action avec revalidation
export async function updateWorkspace(formData: FormData) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('workspaces')
    .update({ name: formData.get('name') })
    .eq('id', formData.get('id'))
  
  if (error) throw error
  
  // Revalider les données
  revalidatePath('/workspaces')
  revalidatePath(`/workspaces/${formData.get('id')}`)
}
```

## 🔍 Dépannage

### Problèmes Courants

1. **Erreur "getSession() not available"**
   - Solution : Utiliser `getUser()` côté serveur

2. **Middleware ne fonctionne pas**
   - Vérifier que `getUser()` est appelé dans `updateSession`
   - Vérifier la configuration du matcher

3. **Provider tokens expirés**
   - Implémenter le refresh automatique avec `refreshSession()`
   - Gérer les erreurs de refresh

4. **RLS bloque les requêtes**
   - Vérifier que les politiques sont correctement définies
   - Vérifier que `auth.uid()` retourne la bonne valeur

### Logs et Debug

```typescript
// Activation des logs de debug
const supabase = createClient({
  auth: {
    debug: true
  }
})

// Logs personnalisés
console.log('User session:', session)
console.log('Provider token:', session?.provider_token)
```

---

*Ce guide est basé sur la documentation officielle Supabase et doit être mis à jour selon les nouvelles versions.*
