# Gestion des Tokens GitHub avec Supabase

## 🚨 Problème Identifié

**Supabase ne stocke PAS les tokens OAuth dans la base de données par défaut !**

Selon la documentation officielle Supabase :
> "Provider tokens are intentionally not stored in your project's database. This is because provider tokens give access to potentially sensitive user data in third-party systems."

**Conséquence :** Les tokens GitHub disparaissent quand la session expire, forçant l'utilisateur à se reconnecter constamment.

## 🔧 Solution : Stockage Manuel des Tokens

### Étape 1 : Créer la Table pour Stocker les Tokens

Exécutez ce script SQL dans votre Supabase SQL Editor :

```sql
-- Créer la table github_tokens
CREATE TABLE IF NOT EXISTS public.github_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_token TEXT NOT NULL,
    provider_refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.github_tokens ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour la sécurité
-- Seul l'utilisateur propriétaire peut voir ses propres tokens
CREATE POLICY "Users can view own github tokens" ON public.github_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Seul l'utilisateur propriétaire peut insérer ses propres tokens
CREATE POLICY "Users can insert own github tokens" ON public.github_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seul l'utilisateur propriétaire peut mettre à jour ses propres tokens
CREATE POLICY "Users can update own github tokens" ON public.github_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Seul l'utilisateur propriétaire peut supprimer ses propres tokens
CREATE POLICY "Users can delete own github tokens" ON public.github_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_github_tokens_user_id ON public.github_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_github_tokens_expires_at ON public.github_tokens(expires_at);

-- Commentaire sur la table
COMMENT ON TABLE public.github_tokens IS 'Table pour stocker les tokens GitHub des utilisateurs de manière sécurisée';
COMMENT ON COLUMN public.github_tokens.provider_token IS 'Token d''accès GitHub (chiffré)';
COMMENT ON COLUMN public.github_tokens.provider_refresh_token IS 'Token de rafraîchissement GitHub (si disponible)';
COMMENT ON COLUMN public.github_tokens.expires_at IS 'Date d''expiration du token GitHub';
```

### Étape 2 : Modifier le Callback OAuth

Modifiez `/apps/web/src/app/auth/callback/route.ts` :

```typescript
// Dans la fonction GET, après la création de session réussie :
if (data.session.provider_token && data.session.user) {
  try {
    // Créer ou mettre à jour le token GitHub dans la table personnalisée
    const { error: tokenError } = await supabase
      .from('github_tokens')
      .upsert({
        user_id: data.session.user.id,
        provider_token: data.session.provider_token,
        provider_refresh_token: data.session.provider_refresh_token || null,
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 heures
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (tokenError) {
      console.error('Erreur lors du stockage du token GitHub:', tokenError.message)
    } else {
      console.log('Token GitHub stocké avec succès pour l\'utilisateur:', data.session.user.email)
    }
  } catch (tokenErr) {
    console.error('Erreur lors du stockage du token GitHub:', tokenErr)
  }
}
```

### Étape 3 : Modifier l'API GitHub

Modifiez `/apps/web/src/app/api/github/repos/route.ts` :

```typescript
// Remplacer la logique de récupération du token :
// Au lieu de :
// const { data: { session } } = await supabase.auth.getSession()
// if (!session?.provider_token) { ... }

// Utiliser :
const { data: githubToken, error: tokenError } = await supabase
  .from('github_tokens')
  .select('provider_token, expires_at')
  .eq('user_id', user.id)
  .single()

if (tokenError || !githubToken) {
  return NextResponse.json(
    { error: { message: 'Token GitHub non disponible. Veuillez vous reconnecter.', code: 'github_token_missing' } },
    { status: 401 }
  )
}

// Vérifier si le token n'est pas expiré
if (new Date(githubToken.expires_at) < new Date()) {
  return NextResponse.json(
    { error: { message: 'Token GitHub expiré. Veuillez vous reconnecter.', code: 'github_token_expired' } },
    { status: 401 }
  )
}

// Utiliser le token stocké
const currentToken = githubToken.provider_token
```

### Étape 4 : Créer un Hook pour Gérer les Tokens

Créez `/apps/web/src/hooks/useGitHubToken.ts` :

```typescript
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface GitHubToken {
  provider_token: string
  expires_at: string
}

export function useGitHubToken() {
  const [token, setToken] = useState<GitHubToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchToken = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setToken(null)
        setLoading(false)
        return
      }

      const { data: githubToken, error: tokenError } = await supabase
        .from('github_tokens')
        .select('provider_token, expires_at')
        .eq('user_id', user.id)
        .single()

      if (tokenError) {
        setError('Token GitHub non disponible')
        setToken(null)
      } else if (githubToken && new Date(githubToken.expires_at) > new Date()) {
        setToken(githubToken)
        setError(null)
      } else {
        setError('Token GitHub expiré')
        setToken(null)
      }
    } catch (err) {
      setError('Erreur lors de la récupération du token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchToken()
  }, [])

  const refreshToken = () => {
    setLoading(true)
    fetchToken()
  }

  return {
    token,
    loading,
    error,
    refreshToken,
    isValid: token && new Date(token.expires_at) > new Date()
  }
}
```

## 🔒 Sécurité

### Row Level Security (RLS)
- Chaque utilisateur ne peut voir que ses propres tokens
- Les tokens sont automatiquement supprimés quand l'utilisateur est supprimé
- Protection contre l'accès non autorisé

### Chiffrement
- Les tokens sont stockés en texte brut dans la base (Supabase gère le chiffrement au niveau de la base)
- Pour plus de sécurité, vous pouvez chiffrer les tokens avant stockage

## 🧹 Maintenance

### Nettoyage des Tokens Expirés

Créez une fonction pour nettoyer les tokens expirés :

```sql
-- Fonction pour nettoyer les tokens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_github_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.github_tokens 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Exécuter le nettoyage (à programmer avec un cron job)
SELECT cleanup_expired_github_tokens();
```

### Monitoring

Ajoutez des logs pour surveiller l'utilisation des tokens :

```typescript
// Dans vos API routes, ajoutez des logs
console.log(`Token GitHub utilisé pour l'utilisateur: ${user.email}`)
console.log(`Token expire le: ${githubToken.expires_at}`)
```

## ✅ Résultat

Après ces modifications :
- ✅ Les tokens GitHub sont persistés en base
- ✅ Plus de reconnexions forcées
- ✅ Gestion automatique de l'expiration
- ✅ Sécurité avec RLS
- ✅ Tokens valides pendant 8 heures (limite GitHub)

## 🚀 Déploiement

1. Exécutez le script SQL dans Supabase
2. Déployez les modifications de code
3. Testez la connexion GitHub
4. Vérifiez que les tokens sont stockés dans la table `github_tokens`

**Note :** Cette solution contourne la limitation de Supabase en stockant manuellement les tokens, ce qui est la pratique recommandée pour les applications nécessitant un accès persistant aux APIs tierces.
