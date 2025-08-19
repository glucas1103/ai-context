# Stratégie de Tests - OAuth GitHub Integration

## 📋 Vue d'ensemble

Cette documentation décrit la stratégie de tests complète implémentée pour l'intégration OAuth GitHub, couvrant tous les niveaux de la pyramide de tests pour assurer la fiabilité et la qualité du système d'authentification.

## 🏗️ Architecture de Tests

### Pyramide de Tests

```
                    E2E Tests
                  (Playwright)
               ┌─────────────────┐
               │   Parcours UI   │
               │   complets      │
               └─────────────────┘
                        ↑
               ┌─────────────────┐
               │ Tests d'intégra-│
               │ tion (Jest)     │
               │   API Routes    │
               └─────────────────┘
                        ↑
               ┌─────────────────┐
               │ Tests unitaires │
               │    (Jest +      │
               │ React Testing   │
               │    Library)     │
               └─────────────────┘
```

## 🛠️ Configuration des Outils

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom pour les tests React
- **Setup**: Configuration des mocks Supabase et Next.js
- **Coverage**: Seuils de couverture définis à 70%
- **Mapping**: Alias `@/` configuré

### React Testing Library (`jest.setup.js`)
- **Mocks automatiques**: Next.js navigation, Supabase client/server
- **Utilitaires globaux**: fetch mock, reset automatique entre tests
- **Helpers**: Configuration DOM testing library

### Playwright (`playwright.config.ts`)
- **Browsers**: Chrome, Firefox, Safari (desktop + mobile)
- **Server**: Démarrage automatique du dev server
- **Reporting**: HTML reports avec traces et screenshots
- **Retry**: Configuration pour CI/CD

## 📝 Tests Unitaires

### Hook `useAuth` (`src/hooks/__tests__/useAuth.test.ts`)

**Couverture complète** :
- ✅ États initiaux (loading, user, error)
- ✅ Gestion des changements d'état d'authentification
- ✅ Flux de connexion GitHub OAuth
- ✅ Gestion des erreurs et timeouts
- ✅ Déconnexion et nettoyage
- ✅ Redirections automatiques
- ✅ Cleanup des subscriptions

**Cas de test critiques** :
```typescript
// État initial
it('should start with loading state')

// Utilisateur authentifié
it('should set user when authenticated')

// Gestion des erreurs
it('should handle auth session missing without error')
it('should set error for other auth errors')

// Événements d'authentification
it('should handle SIGNED_IN event')
it('should handle SIGNED_OUT event')

// Flux OAuth
it('should successfully sign in with GitHub')
it('should handle sign in error')

// Déconnexion
it('should successfully sign out')
it('should handle sign out error')
```

### Page de Login (`src/app/(pages)/login/__tests__/page.test.tsx`)

**Couverture UI** :
- ✅ Rendu des éléments de l'interface
- ✅ Application du thème sombre
- ✅ Gestion des paramètres d'erreur URL
- ✅ États de chargement
- ✅ Interactions utilisateur
- ✅ Redirections automatiques pour utilisateurs authentifiés

**Cas de test critiques** :
```typescript
// Rendu
it('should render login form with correct elements')
it('should apply dark theme styles correctly')

// Gestion d'erreurs
it('should display auth error from URL params')
it('should display no_code error from URL params')

// États
it('should show loading state when auth is loading')
it('should redirect to repos if already authenticated')

// Interactions
it('should call signInWithGitHub when button is clicked')
```

### Utilitaires d'Erreurs (`src/lib/__tests__/errors.test.ts`)

**Couverture complète** :
- ✅ Classe AppError et ses propriétés
- ✅ Fonction createErrorResponse
- ✅ Fonction handleApiError
- ✅ Codes d'erreur standardisés
- ✅ Logs conditionnels (dev vs production)
- ✅ Localisation des messages

## 🔗 Tests d'Intégration

### API GitHub Repos (`src/app/api/github/repos/__tests__/route.test.ts`)

**Couverture API** :
- ✅ Authentification Supabase complète
- ✅ Validation des tokens GitHub
- ✅ Appels API GitHub avec gestion d'erreurs
- ✅ Formatage des données de réponse
- ✅ Gestion des cas limites (rate limiting, token expiré)
- ✅ Logs d'erreurs appropriés

**Scénarios testés** :
```typescript
// Authentification
it('should return 401 if user is not authenticated')
it('should return 401 if no provider token')

// API GitHub
it('should successfully fetch and format repos')
it('should handle GitHub 401 error (invalid token)')
it('should handle GitHub 403 error (rate limit)')
it('should handle network errors')

// Données
it('should handle empty repos array')
it('should handle repos with null values properly')
```

### Callback OAuth (`src/app/auth/callback/__tests__/route.test.ts`)

**Couverture OAuth** :
- ✅ Flux de callback réussi
- ✅ Gestion des paramètres URL (code, next)
- ✅ Redirections selon l'environnement
- ✅ Gestion des erreurs OAuth
- ✅ Logs et monitoring d'erreurs

**Scénarios critiques** :
```typescript
// Succès
it('should redirect to /repos on successful auth in development')
it('should redirect using forwarded host in production')

// Erreurs
it('should redirect to login with auth_error when exchangeCodeForSession fails')
it('should redirect to login with no_code when code parameter is missing')

// Environnements
it('should handle production environment with forwarded host')
```

## 🌐 Tests End-to-End

### Flux OAuth Complet (`e2e/oauth-flow.spec.ts`)

**Parcours utilisateur** :
- ✅ Affichage correct de la page de login
- ✅ Application du thème sombre
- ✅ Gestion des erreurs depuis les paramètres URL
- ✅ Initiation du flux OAuth
- ✅ Redirection après authentification
- ✅ Accès à la page des dépôts
- ✅ Gestion des erreurs API
- ✅ Design responsive mobile
- ✅ Fonctionnalité de recherche

**Mocking strategy** :
```typescript
// Mock OAuth pour éviter les appels réels
await page.route('**/auth/v1/authorize*', async route => {
  await route.fulfill({
    status: 302,
    headers: { 'Location': '/auth/callback?code=test_code_123' }
  })
})

// Mock des réponses API
await page.route('**/api/github/repos', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ repos: [...], total: 1 })
  })
})
```

## 📊 Métriques et Couverture

### Objectifs de Couverture
- **Branches**: 70% minimum
- **Functions**: 70% minimum  
- **Lines**: 70% minimum
- **Statements**: 70% minimum

### Scripts de Test
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

### Commandes Utiles
```bash
# Tests unitaires avec watch
npm run test:watch

# Coverage report
npm run test:coverage

# E2E avec interface graphique
npm run test:e2e:ui

# Tous les tests
npm run test:all
```

## 🚀 Pipeline CI/CD

### GitHub Actions (Recommandé)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install
      - run: npm run test:e2e
```

## 🔧 Maintenance et Évolution

### Ajout de Nouveaux Tests
1. **Tests unitaires** : Créer dans `__tests__/` à côté du fichier testé
2. **Tests d'intégration** : Ajouter dans `api/*/(__tests__/` pour les routes
3. **Tests E2E** : Étendre `e2e/oauth-flow.spec.ts` ou créer nouveaux specs

### Mocking Guidelines
- **Supabase** : Déjà configuré dans jest.setup.js
- **Next.js Router** : Mock automatique
- **API externes** : Utiliser `global.fetch` mock
- **Variables d'environnement** : Mock via `process.env`

### Debugging
```bash
# Debug tests unitaires
npm run test -- --detectOpenHandles --forceExit

# Debug E2E avec mode headed
npx playwright test --headed --debug

# Screenshots et vidéos E2E
npx playwright show-report
```

## 📋 Checklist QA

### Avant Merge
- [ ] Tous les tests unitaires passent
- [ ] Couverture ≥ 70% maintenue
- [ ] Tests d'intégration passent
- [ ] Tests E2E passent sur Chrome/Firefox
- [ ] Pas de console.error/warnings
- [ ] Performance acceptable (< 2s par test E2E)

### Monitoring en Production
- [ ] Métriques d'erreurs OAuth configurées
- [ ] Logs d'authentification surveillés
- [ ] Rate limiting GitHub monitoré
- [ ] Temps de réponse API trackés

## 🎯 Résultats Attendus

Cette stratégie de tests assure :
- **Fiabilité** : 95%+ de disponibilité OAuth
- **Sécurité** : Détection précoce des vulnérabilités
- **Maintenabilité** : Refactoring sans régression
- **Performance** : Surveillance continue des métriques
- **UX** : Expérience utilisateur cohérente

---

*Documentation mise à jour le 12/01/2025 par Quinn (Test Architect)*
