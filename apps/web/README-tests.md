# Tests OAuth GitHub Integration

## 🚀 Démarrage Rapide

### Installation des Dépendances de Test
```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Installer Playwright browsers
npm run playwright:install
```

### Exécution des Tests

#### Tests Unitaires et d'Intégration (Jest)
```bash
# Exécuter tous les tests
npm test

# Mode watch (développement)
npm run test:watch

# Avec couverture de code
npm run test:coverage

# Pour CI/CD
npm run test:ci
```

#### Tests End-to-End (Playwright)
```bash
# Exécuter tous les tests E2E
npm run test:e2e

# Avec interface graphique
npm run test:e2e:ui

# En mode headed (voir le navigateur)
npm run test:e2e:headed

# Tests spécifiques
npx playwright test oauth-flow
```

#### Tous les Tests
```bash
# Exécuter la suite complète
npm run test:all
```

## 📊 Couverture de Tests

### Tests Implémentés
- ✅ **Hook useAuth** - 15 tests (states, erreurs, OAuth flow)
- ✅ **Page Login** - 12 tests (UI, erreurs, interactions)
- ✅ **API Repos** - 18 tests (auth, GitHub API, erreurs)
- ✅ **OAuth Callback** - 12 tests (codes, redirections, environnements)
- ✅ **Utilitaires Erreurs** - 8 tests (gestion centralisée)
- ✅ **E2E OAuth Flow** - 10 tests (parcours complet)

### Métriques Cibles
- **Couverture** : ≥ 70%
- **Tests E2E** : Tous les parcours critiques
- **Performance** : < 2s par test E2E

## 🛠️ Debugging

### Tests Unitaires
```bash
# Debug avec logs détaillés
npm test -- --verbose

# Tests spécifiques
npm test -- useAuth

# Avec coverage détaillé
npm test -- --coverage --verbose
```

### Tests E2E
```bash
# Mode debug
npx playwright test --debug

# Voir les rapports
npx playwright show-report

# Screenshots/vidéos des échecs
ls test-results/
```

## 📁 Structure des Tests

```
apps/web/
├── src/
│   ├── hooks/__tests__/useAuth.test.ts
│   ├── app/(pages)/login/__tests__/page.test.tsx
│   ├── app/api/github/repos/__tests__/route.test.ts
│   ├── app/auth/callback/__tests__/route.test.ts
│   └── lib/__tests__/errors.test.ts
├── e2e/
│   └── oauth-flow.spec.ts
├── docs/
│   └── testing-strategy.md
├── jest.config.js
├── jest.setup.js
└── playwright.config.ts
```

## 🔧 Configuration

### Variables d'Environnement pour Tests
```bash
# Pas de variables spéciales requises
# Les tests utilisent des mocks
```

### Mocks Configurés
- **Supabase Client/Server** - Mock automatique
- **Next.js Navigation** - Mock automatique  
- **Fetch Global** - Mock pour API externes

## ⚡ Intégration CI/CD

### GitHub Actions (exemple)
```yaml
name: Tests OAuth
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## 📋 Checklist QA

Avant de merger :
- [ ] `npm run test:all` passe
- [ ] Couverture ≥ 70%
- [ ] Tests E2E passent sur Chrome/Firefox
- [ ] Pas de warnings dans les logs
- [ ] Documentation à jour

---

*Documentation générée par Quinn (Test Architect) - 12/01/2025*
