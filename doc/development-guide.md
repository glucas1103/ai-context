# Guide de Développement - AIcontext

## Table des Matières

1. [Prérequis et Installation](#prérequis-et-installation)
2. [Structure du Projet](#structure-du-projet)
3. [Conventions de Code](#conventions-de-code)
4. [Workflow de Développement](#workflow-de-développement)
5. [Tests](#tests)
6. [Déploiement](#déploiement)
7. [Dépannage](#dépannage)

---

## Prérequis et Installation

### Technologies Requises

- **Node.js** : Version 18+ (recommandé : 20.x)
- **npm** : Version 9+
- **Git** : Version 2.30+
- **Supabase CLI** : Pour le développement local (optionnel)

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd AIcontext

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp apps/web/.env.example apps/web/.env.local

# Configurer les variables d'environnement
# Voir la section Variables d'Environnement ci-dessous

# Démarrer le serveur de développement
cd apps/web
npm run dev
```

### Variables d'Environnement

Créer un fichier `.env.local` dans `apps/web/` avec les variables suivantes :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Claude API (optionnel pour le développement)
CLAUDE_API_KEY=your_claude_api_key
```

---

## Structure du Projet

### Organisation Générale

```
AIcontext/
├── apps/
│   └── web/                    # Application Next.js principale
│       ├── src/
│       │   ├── app/            # Next.js App Router
│       │   ├── components/     # Composants React
│       │   ├── types/          # Types TypeScript
│       │   ├── constants/      # Constantes
│       │   ├── utils/          # Utilitaires
│       │   ├── hooks/          # Hooks personnalisés
│       │   └── lib/            # Bibliothèques
│       ├── e2e/                # Tests end-to-end
│       └── public/             # Fichiers statiques
├── packages/                   # Packages partagés
├── docs/                       # Documentation du projet
└── doc/                        # Documentation technique
```

### Détail de l'Organisation Frontend

#### **Composants (`src/components/`)**

```
components/
├── layout/                     # Composants de mise en page
│   ├── index.ts               # Export ThreePanelsLayout
│   └── ThreePanelsLayout.tsx  # Layout principal à 3 panneaux
├── ui/                        # Composants d'interface universels
│   ├── index.ts               # Export ErrorScreen, LoadingScreen
│   ├── ErrorScreen.tsx        # Écran d'erreur
│   ├── LoadingScreen.tsx      # Écran de chargement
│   └── universal/             # Composants universels
│       ├── index.ts           # Export composants universels
│       ├── UniversalChatPanel.tsx
│       ├── UniversalContentPanel.tsx
│       └── UniversalTreePanel.tsx
├── documentation/             # Composants spécifiques à la documentation
│   ├── index.ts               # Export RichTextEditor, DocumentationModals
│   ├── RichTextEditor.tsx     # Éditeur de texte riche
│   └── DocumentationModals.tsx
└── workspace/                 # Composants spécifiques aux workspaces
    ├── index.ts               # Export ChatPanel, WorkspaceSelector, WorkspaceHeader
    ├── ChatPanel.tsx          # Panneau de chat
    ├── WorkspaceSelector.tsx  # Sélecteur de workspace
    └── WorkspaceHeader.tsx    # En-tête de workspace
```

#### **Types (`src/types/`)**

```
types/
├── index.ts                   # Export principal
├── common.ts                  # Types partagés (ApiResponse, PaginationParams)
├── auth.ts                    # Types d'authentification
├── api/                       # Types pour les API
│   ├── index.ts              # Export API types
│   ├── workspace.ts          # Types workspace
│   ├── documentation.ts      # Types documentation
│   └── github.ts             # Types GitHub
└── components/                # Types pour les composants
    ├── index.ts              # Export component types
    ├── universal.ts          # Types composants universels
    └── ui.ts                 # Types composants UI
```

#### **Constants (`src/constants/`)**

```
constants/
├── index.ts                   # Export principal
├── api.ts                     # API_ENDPOINTS, API_METHODS, API_STATUS_CODES
├── routes.ts                  # ROUTES, ROUTE_PARAMS, EXTERNAL_ROUTES
└── ui.ts                      # UI_BREAKPOINTS, UI_COLORS, UI_SPACING
```

#### **Utils (`src/utils/`)**

```
utils/
├── index.ts                   # Export principal
├── api.ts                     # apiClient, ApiError, createErrorResponse
├── auth.ts                    # isAuthenticated, getAuthToken, logout
└── formatting.ts              # formatFileSize, formatDate, truncateText
```

#### **API Routes (`src/app/api/`)**

```
api/
├── auth/                      # Routes d'authentification
│   ├── callback/             # Callback OAuth GitHub
│   └── signout/              # Déconnexion
├── github/                   # Routes GitHub API
│   └── repos/                # Liste des dépôts utilisateur
├── health/                   # Route de santé
└── workspaces/               # Routes des workspaces
    ├── route.ts              # GET/POST /api/workspaces
    └── [id]/                 # Routes spécifiques à un workspace
        ├── route.ts          # GET/PUT/DELETE /api/workspaces/[id]
        ├── analyze/          # POST /api/workspaces/[id]/analyze
        ├── context/          # GET /api/workspaces/[id]/context
        ├── documentation/    # GET /api/workspaces/[id]/documentation
        └── issues/           # GET /api/workspaces/[id]/issues
```

---

## Conventions de Code

### Conventions de Nommage

#### **Fichiers et Dossiers**
- **Composants** : PascalCase (ex: `ThreePanelsLayout.tsx`)
- **Hooks** : camelCase avec préfixe `use` (ex: `useAuth.ts`)
- **Types** : PascalCase (ex: `Workspace.ts`)
- **Constants** : UPPER_SNAKE_CASE (ex: `API_ENDPOINTS`)
- **Fichiers utilitaires** : camelCase (ex: `api.ts`, `formatting.ts`)
- **Routes API** : kebab-case (ex: `file-content/route.ts`)

#### **Variables et Fonctions**
- **Variables** : camelCase (ex: `userName`, `isLoading`)
- **Fonctions** : camelCase (ex: `getUserData`, `handleSubmit`)
- **Constantes** : UPPER_SNAKE_CASE (ex: `MAX_FILE_SIZE`)
- **Types/Interfaces** : PascalCase (ex: `UserData`, `ApiResponse`)

### Imports et Exports

#### **Ordre des Imports**
```typescript
// 1. React et bibliothèques React
import React, { useState, useEffect } from 'react'

// 2. Bibliothèques externes
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

// 3. Composants internes
import { ThreePanelsLayout } from '@/components/layout'
import { ErrorScreen } from '@/components/ui'

// 4. Types
import type { Workspace } from '@/types/api/workspace'

// 5. Utilitaires et constants
import { apiClient } from '@/utils/api'
import { API_ENDPOINTS } from '@/constants/api'
```

#### **Exports**
- Utiliser des fichiers `index.ts` dans chaque dossier pour faciliter les imports
- Exporter les types et interfaces depuis les fichiers de types
- Exporter les composants depuis les fichiers de composants

```typescript
// components/layout/index.ts
export { ThreePanelsLayout } from './ThreePanelsLayout'

// types/api/index.ts
export type { Workspace } from './workspace'
export type { Documentation } from './documentation'
```

### Structure des Composants

#### **Template de Composant**
```typescript
'use client'

import React from 'react'
import type { ComponentProps } from '@/types/components/ui'

interface MyComponentProps {
  title: string
  onAction?: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  // Hooks
  const [isLoading, setIsLoading] = useState(false)

  // Handlers
  const handleClick = () => {
    if (onAction) {
      onAction()
    }
  }

  // Render
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Chargement...' : 'Action'}
      </button>
    </div>
  )
}
```

### API Routes

#### **Template d'API Route**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, handleApiError } from '@/utils/api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse('Non authentifié', 'auth_required', 401)
    }

    // Logique métier
    const data = { message: 'Succès' }

    return NextResponse.json({
      success: true,
      data,
      status: 200
    })

  } catch (error) {
    return handleApiError(error)
  }
}
```

---

## Workflow de Développement

### 1. Création d'une Nouvelle Fonctionnalité

#### **Étape 1 : Créer une branche**
```bash
git checkout -b feature/nom-de-la-fonctionnalite
```

#### **Étape 2 : Développer la fonctionnalité**
1. **Ajouter les types** dans `src/types/` si nécessaire
2. **Créer les composants** dans `src/components/` approprié
3. **Ajouter les constantes** dans `src/constants/` si nécessaire
4. **Créer les utilitaires** dans `src/utils/` si nécessaire
5. **Ajouter les API routes** dans `src/app/api/` si nécessaire

#### **Étape 3 : Tester**
```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run type-check
```

#### **Étape 4 : Commit et Push**
```bash
git add .
git commit -m "feat: ajouter la fonctionnalité X"
git push origin feature/nom-de-la-fonctionnalite
```

### 2. Correction de Bugs

#### **Étape 1 : Identifier le problème**
- Vérifier les logs dans la console du navigateur
- Vérifier les logs du serveur de développement
- Utiliser les outils de débogage React

#### **Étape 2 : Corriger le bug**
- Suivre les conventions de code
- Ajouter des tests si nécessaire
- Documenter la correction

#### **Étape 3 : Tester la correction**
```bash
npm run test
npm run test:e2e
```

### 3. Refactoring

#### **Quand refactoriser ?**
- Code dupliqué
- Composants trop gros
- Logique métier mélangée avec l'UI
- Types mal organisés

#### **Comment refactoriser ?**
1. Identifier le code à refactoriser
2. Créer une branche dédiée
3. Extraire la logique dans des utilitaires
4. Réorganiser les composants
5. Mettre à jour les types
6. Tester exhaustivement

---

## Tests

### Types de Tests

#### **Tests Unitaires (Jest)**
- **Localisation** : `src/__tests__/` ou à côté des fichiers
- **Commandes** : `npm run test`, `npm run test:watch`
- **Couverture** : `npm run test:coverage`

#### **Tests E2E (Playwright)**
- **Localisation** : `e2e/`
- **Commandes** : `npm run test:e2e`, `npm run test:e2e:ui`
- **Configuration** : `playwright.config.ts`

### Écriture de Tests

#### **Test de Composant**
```typescript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/ui/MyComponent'

describe('MyComponent', () => {
  it('affiche le titre correctement', () => {
    render(<MyComponent title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('appelle onAction quand le bouton est cliqué', () => {
    const mockAction = jest.fn()
    render(<MyComponent title="Test" onAction={mockAction} />)
    
    screen.getByRole('button').click()
    expect(mockAction).toHaveBeenCalledTimes(1)
  })
})
```

#### **Test d'API Route**
```typescript
import { GET } from '@/app/api/test/route'
import { NextRequest } from 'next/server'

describe('GET /api/test', () => {
  it('retourne une réponse de succès', async () => {
    const request = new NextRequest('http://localhost:3000/api/test')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

---

## Déploiement

### Environnements

- **Development** : `localhost:3000` (npm run dev)
- **Staging** : Déploiement automatique sur Vercel (branche develop)
- **Production** : Déploiement automatique sur Vercel (branche main)

### Processus de Déploiement

1. **Merge en main** : Déclenche automatiquement le déploiement
2. **Tests automatiques** : Exécutés avant le déploiement
3. **Build** : Compilation et optimisation automatiques
4. **Déploiement** : Mise en ligne automatique sur Vercel

### Variables d'Environnement de Production

Configurées dans le dashboard Vercel :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `CLAUDE_API_KEY`

---

## Dépannage

### Problèmes Courants

#### **Erreur de Build**
```bash
# Nettoyer le cache
rm -rf .next
npm run build
```

#### **Erreurs TypeScript**
```bash
# Vérifier les types
npm run type-check

# Corriger automatiquement
npm run lint:fix
```

#### **Tests qui échouent**
```bash
# Relancer les tests
npm run test -- --clearCache
npm run test

# Vérifier les mocks
# Vérifier les imports
```

#### **Problèmes d'API**
- Vérifier les variables d'environnement
- Vérifier les logs du serveur
- Tester avec curl ou Postman

### Outils de Débogage

#### **Frontend**
- **React DevTools** : Extension navigateur
- **Console navigateur** : Logs et erreurs
- **Network tab** : Requêtes API

#### **Backend**
- **Logs Vercel** : Dashboard Vercel
- **Logs Supabase** : Dashboard Supabase
- **Tests locaux** : `curl` ou Postman

### Support

- **Documentation** : Ce guide et les fichiers dans `doc/`
- **Issues** : GitHub Issues pour les bugs
- **Discussions** : GitHub Discussions pour les questions
- **Code Review** : Pull Requests pour les nouvelles fonctionnalités

---

## Ressources Utiles

### Documentation Officielle
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Outils de Développement
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [GitHub Repository](https://github.com/your-org/aicontext)

### Standards et Bonnes Pratiques
- [Conventional Commits](https://www.conventionalcommits.org)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/intro.html)
