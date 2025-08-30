# 🎯 Guide du Système de Tours Adaptatifs

## 📋 Vue d'ensemble

Le système de tours adaptatifs améliore l'expérience utilisateur en ajustant automatiquement le nombre de tours alloués à Claude Code selon la complexité de la tâche demandée.

## 🚀 Fonctionnalités

### ✨ **Détection Automatique de Complexité**

Le système analyse votre message et détermine automatiquement la complexité :

- **🟢 Simple** (3-6 tours) : Corrections de bugs, syntaxe, imports
- **🟡 Moyenne** (5 tours) : Analyses standards, questions générales  
- **🔴 Complexe** (10-20 tours) : Architecture, refactoring, audits complets

### 🎛️ **Modes de Fonctionnement**

#### Mode Adaptatif (Recommandé)
- ✅ Détection automatique de la complexité
- ✅ Allocation intelligente des tours
- ✅ Messages informatifs sur la complexité détectée
- ✅ Optimisation des ressources

#### Mode Manuel
- 🔧 Contrôle total du nombre de tours
- 🔧 Limite fixe définie par l'utilisateur
- 🔧 Pas d'adaptation automatique

### 🛠️ **Gestion des Limites Atteintes**

Quand la limite de tours est atteinte, le système propose :

1. **Boutons d'action rapide** :
   - `+5 tours` : Pour continuer avec 5 tours supplémentaires
   - `+10 tours` : Pour les tâches plus complexes
   - `Mode adaptatif` : Active l'adaptation automatique

2. **Suggestions intelligentes** :
   - Reformuler la question plus spécifiquement
   - Diviser la tâche en plusieurs parties
   - Augmenter la limite de base

## 📊 **Mots-clés de Détection**

### Complexité Élevée
```
architecture, refactor, migration, optimisation, performance,
sécurité, audit, analyse complète, documentation complète,
restructuration, conception, design pattern, intégration
```

### Complexité Simple
```
bug, erreur, correction, fix, syntaxe, typo,
import, export, variable, fonction simple
```

## 🎯 **Bonnes Pratiques**

### ✅ **Recommandé**
- Utiliser le mode adaptatif pour la plupart des tâches
- Être spécifique dans vos demandes
- Utiliser les boutons d'action quand la limite est atteinte
- Diviser les tâches complexes en sous-tâches

### ❌ **À éviter**
- Fixer une limite trop basse en mode manuel
- Demandes trop vagues ou multiples dans un seul message
- Ignorer les suggestions du système

## 🔧 **Configuration**

### Interface Utilisateur
- **Tours adaptatifs** : Active/désactive le mode adaptatif
- **Max tours** : Limite de base (désactivé en mode adaptatif)
- **Indicateur de complexité** : Affiche la complexité détectée et les tours alloués

### API
```typescript
{
  maxTurns: number,           // Limite de base
  complexity: 'simple' | 'medium' | 'complex',
  adaptiveTurns: boolean      // Mode adaptatif activé
}
```

## 📈 **Avantages**

1. **Efficacité** : Optimise l'utilisation des ressources
2. **Flexibilité** : S'adapte automatiquement aux besoins
3. **Transparence** : Informe l'utilisateur des décisions prises
4. **Continuité** : Permet de continuer les tâches interrompues
5. **Contrôle** : Garde le contrôle utilisateur quand nécessaire

## 🔮 **Évolutions Futures**

- Apprentissage basé sur l'historique utilisateur
- Détection plus fine basée sur le contexte du projet
- Intégration avec les métriques de performance
- Suggestions proactives d'optimisation

---

*Ce système suit les bonnes pratiques identifiées dans la recherche sur les agents conversationnels modernes.*
