# Configuration des Variables d'Environnement

## Fichier `.env.local` requis

Créez un fichier `.env.local` dans `/apps/web/` avec les variables suivantes :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## Variables Vercel

Ces variables sont automatiquement définies par Vercel :
- `VERCEL_URL` : URL du déploiement
- `VERCEL_ENV` : Environnement (production, preview, development)

## Instructions de Déploiement

1. Créer un projet Vercel
2. Connecter ce dépôt Git
3. Configurer les variables d'environnement dans le dashboard Vercel
4. Déployer automatiquement depuis la branche main
