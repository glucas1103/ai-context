# Test Manuel - Correction de la Boucle Infinie

## 🎯 Objectif
Vérifier que la correction de la boucle infinie entre `/login` et `/repos` fonctionne correctement.

## 🧪 Tests à Effectuer

### Test 1: Accès à la page de login (non authentifié)
1. Ouvrir http://localhost:3000/login
2. **Résultat attendu** : Page de login s'affiche, pas de redirection
3. **Vérification** : Le bouton "Se connecter avec GitHub" est visible
4. **Attendre 5 secondes** : Vérifier qu'on reste sur `/login`

### Test 2: Accès à la page repos (non authentifié)
1. Ouvrir http://localhost:3000/repos
2. **Résultat attendu** : Redirection automatique vers `/login`
3. **Vérification** : URL devient `http://localhost:3000/login`
4. **Attendre 5 secondes** : Vérifier qu'on reste sur `/login`

### Test 3: Navigation entre pages (non authentifié)
1. Aller sur `/login`
2. Aller sur `/repos` (doit rediriger vers `/login`)
3. Aller sur `/` (page d'accueil)
4. Aller sur `/login` à nouveau
5. **Résultat attendu** : Pas de boucle infinie, navigation fluide

### Test 4: Accès aux pages publiques (non authentifié)
1. Tester l'accès à `/` (page d'accueil)
2. Tester l'accès à `/auth/callback`
3. Tester l'accès à `/error`
4. **Résultat attendu** : Accès autorisé, pas de redirection

### Test 5: Accès aux pages protégées (non authentifié)
1. Tester l'accès à `/workspaces`
2. Tester l'accès à `/workspaces/123/context`
3. Tester l'accès à `/workspaces/123/documentation`
4. **Résultat attendu** : Redirection vers `/login` pour toutes

## 🔍 Points de Vérification

### ✅ Comportement Correct
- [ ] Page `/login` reste stable, pas de redirection automatique
- [ ] Page `/repos` redirige vers `/login` quand non authentifié
- [ ] Pas de boucle infinie entre les pages
- [ ] Pages publiques accessibles sans authentification
- [ ] Pages protégées redirigent vers `/login`

### ❌ Comportement Incorrect (Avant Correction)
- [ ] Alternance rapide entre `/login` et `/repos`
- [ ] Redirections en boucle infinie
- [ ] Impossible de rester sur une page
- [ ] Chargement infini

## 🐛 Debug en Cas de Problème

### Vérifier les Logs
```bash
# Dans la console du navigateur
console.log('URL actuelle:', window.location.href)

# Dans les logs du serveur Next.js
# Chercher les erreurs d'authentification
```

### Vérifier l'État d'Authentification
```javascript
// Dans la console du navigateur
// Vérifier les cookies Supabase
document.cookie.split(';').filter(c => c.includes('supabase'))

// Vérifier le localStorage
localStorage.getItem('supabase.auth.token')
```

## 📝 Notes de Test

**Date du test** : _______________
**Testeur** : _______________
**Résultat** : ✅ Pass / ❌ Fail

**Observations** :
- _________________________________
- _________________________________
- _________________________________

**Problèmes rencontrés** :
- _________________________________
- _________________________________

**Actions correctives** :
- _________________________________
- _________________________________
