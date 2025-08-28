# Correction du problème d'authentification GitHub - Boucle infinie

## Problème identifié

Le problème était causé par une mauvaise compréhension de la gestion des provider tokens GitHub avec Supabase Auth, entraînant une boucle infinie lors de la redirection vers `/login?reauth=github`.

## Causes principales

### 1. **Gestion incorrecte des provider tokens selon la documentation Supabase**

**❌ Ce que nous faisions (incorrect) :**
- Tentative de refresh automatique des provider tokens via `supabase.auth.refreshSession()`
- Gestion automatique des tokens expirés côté serveur
- Redirection en boucle quand le provider token n'était pas disponible

**✅ Ce que recommande la documentation Supabase :**
- **Supabase Auth ne gère PAS automatiquement le refresh des provider tokens**
- Les provider tokens doivent être gérés manuellement par l'application
- Il faut utiliser le `provider_refresh_token` pour obtenir un nouveau `provider_token`
- En cas d'absence de provider token, demander à l'utilisateur de se reconnecter

### 2. **Boucle infinie causée par :**
- Refresh automatique qui échoue
- Redirection vers `/login?reauth=github` sans forcer une nouvelle authentification
- Gestion incorrecte des erreurs (lancement d'erreurs au lieu de gestion gracieuse)

## Corrections apportées

### 1. **Correction de `token-utils.ts`**

```typescript
// ❌ AVANT (incorrect)
export async function getValidProviderToken(supabase: SupabaseClient): Promise<string | null> {
  // Tentative de refresh automatique
  if (!providerToken) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    // ...
  }
}

// ✅ APRÈS (correct selon la documentation Supabase)
export async function getValidProviderToken(supabase: SupabaseClient): Promise<string | null> {
  // Retourner directement le provider token s'il existe
  // Selon la documentation Supabase, on ne doit PAS tenter de refresh automatique
  const providerToken = session.provider_token
  
  if (!providerToken) {
    console.log('Aucun provider token disponible - reconnexion GitHub nécessaire')
    return null
  }
  
  return providerToken
}
```

### 2. **Correction de la page de login**

```typescript
// ✅ Ajout de la reconnexion automatique forcée
useEffect(() => {
  const reauthParam = searchParams.get('reauth')
  
  if (reauthParam === 'github') {
    setForceReauth(true)
    clearCorruptedSession()
  }
}, [searchParams, clearCorruptedSession])

// ✅ Redirection automatique vers GitHub
useEffect(() => {
  if (forceReauth && !loading) {
    const timer = setTimeout(() => {
      signInWithGitHub()
    }, 1000)
    
    return () => clearTimeout(timer)
  }
}, [forceReauth, loading, signInWithGitHub])
```

### 3. **Amélioration de la page des dépôts**

```typescript
// ✅ Limitation des tentatives pour éviter les boucles infinies
const [retryCount, setRetryCount] = useState(0)

if (retryCount >= 2) {
  setError('Impossible de charger les dépôts après plusieurs tentatives. Veuillez vous reconnecter.')
  setIsLoading(false)
  return
}

// ✅ Gestion gracieuse des erreurs avec options de récupération
<div className="space-y-2">
  <button onClick={handleRetry}>Réessayer</button>
  <button onClick={() => window.location.href = `${ROUTES.LOGIN}?reauth=github`}>
    Se reconnecter
  </button>
</div>
```

## Bonnes pratiques selon la documentation Supabase

### 1. **Gestion des provider tokens**

```javascript
// ✅ Stocker les tokens lors de l'authentification
supabase.auth.onAuthStateChange((event, session) => {
  if (session && session.provider_token) {
    window.localStorage.setItem('oauth_provider_token', session.provider_token)
  }
  if (session && session.provider_refresh_token) {
    window.localStorage.setItem('oauth_provider_refresh_token', session.provider_refresh_token)
  }
})
```

### 2. **Gestion des erreurs GitHub API**

```typescript
// ✅ Gestion spécifique des erreurs GitHub
if (response.status === 401) {
  // Token expiré ou révoqué - nécessite une reconnexion
  throw new Error('GitHub token expired - reconnection required')
}

if (response.status === 403) {
  // Rate limit ou permissions insuffisantes
  const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
  if (rateLimitRemaining === '0') {
    throw new Error('GitHub rate limit exceeded')
  }
  throw new Error('GitHub API access denied - insufficient permissions')
}
```

### 3. **Scopes GitHub recommandés**

```typescript
// ✅ Scopes nécessaires pour accéder aux dépôts
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    scopes: 'repo read:user read:org', // Scopes pour accéder aux dépôts privés
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

## Résultat

- ✅ **Fin de la boucle infinie** : La page de login force automatiquement une nouvelle authentification GitHub
- ✅ **Gestion correcte des tokens** : Respect de la documentation Supabase
- ✅ **Expérience utilisateur améliorée** : Messages d'erreur clairs et options de récupération
- ✅ **Robustesse** : Limitation des tentatives et gestion gracieuse des erreurs

## Tests recommandés

1. **Test de reconnexion** : Se déconnecter et se reconnecter
2. **Test d'expiration** : Attendre l'expiration du token GitHub
3. **Test de révocation** : Révoquer l'accès dans les paramètres GitHub
4. **Test de rate limit** : Dépasser les limites GitHub API
5. **Test de session corrompue** : Simuler une session invalide

## Références

- [Documentation Supabase - Provider tokens](https://supabase.com/docs/guides/auth/social-login#provider-tokens)
- [Documentation Supabase - signInWithOAuth](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)
- [Documentation GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps)
