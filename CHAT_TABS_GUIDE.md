# Guide d'utilisation des Onglets de Chat

## Vue d'ensemble

L'implémentation des onglets de chat permet de gérer plusieurs conversations simultanément dans le composant `UniversalChatPanel`. Cette fonctionnalité utilise directement la table `chat_sessions` existante, sans besoin de table séparée.

## Fonctionnalités implémentées

### ✅ **Gestion complète des onglets**
- Création d'onglets multiples
- Changement d'onglet actif
- Fermeture d'onglets
- Renommage des onglets
- Duplication d'onglets
- Indicateur de changements non sauvegardés

### ✅ **Persistance Supabase**
- Stockage direct dans la table `chat_sessions`
- Colonnes utilisées : `tab_order`, `is_active`, `is_dirty`, `title`
- Synchronisation en temps réel via rechargement
- Pas de LocalStorage nécessaire

### ✅ **Types d'onglets**
- **Analysis** 🔍 : Pour l'analyse de code
- **Documentation** 📝 : Pour la documentation
- **Custom** 💬 : Pour les conversations personnalisées

## Utilisation

### Utilisation des onglets

```tsx
import { UniversalChatPanel } from '@/components/ui/universal/UniversalChatPanel'

// Les onglets sont activés par défaut
<UniversalChatPanel
  workspaceId="your-workspace-id"
  agentType="analysis"
  // ... autres props
/>
```

### Hook useChatTabs

```tsx
import { useChatTabs } from '@/hooks/useChatTabs'

function MyComponent() {
  const {
    tabs,
    activeTab,
    activeTabId,
    isLoading,
    error,
    addTab,
    switchTab,
    closeTab,
    renameTab,
    markTabDirty,
    updateTabActivity
  } = useChatTabs(workspaceId, userId)

  // Ajouter un onglet
  const handleAddTab = async () => {
    const sessionId = await addTab(
      { workspacePath: '/my/workspace' }, 
      'analysis'
    )
  }

  // Changer d'onglet
  const handleSwitchTab = (tabId: string) => {
    switchTab(tabId)
  }

  return (
    <div>
      {/* Votre UI */}
    </div>
  )
}
```

### Composant ChatTabBar

```tsx
import { ChatTabBar } from '@/components/universal/chat/ChatTabBar'

<ChatTabBar
  tabs={tabs}
  activeTabId={activeTabId}
  onTabSwitch={switchTab}
  onTabClose={closeTab}
  onTabAdd={() => addTab(context, 'analysis')}
  onTabRename={renameTab}
/>
```

## Structure de données

### Interface ChatTab
```typescript
interface ChatTab {
  id: string              // ID de la session
  sessionId: string       // ID de la session (même que id)
  title: string           // Titre de l'onglet
  type: 'analysis' | 'documentation' | 'custom'
  isActive: boolean       // Onglet actif
  isDirty: boolean        // Changements non sauvegardés
  lastActivity: Date      // Dernière activité
  context?: ClaudeCodeContext
  tabOrder: number        // Ordre d'affichage
}
```

### Colonnes Supabase utilisées
```sql
-- Dans la table chat_sessions existante
tab_order INTEGER        -- Ordre des onglets
is_active BOOLEAN        -- Onglet actif 
is_dirty BOOLEAN         -- Changements non sauvegardés
title TEXT              -- Nom de l'onglet
agent_id TEXT           -- Type d'onglet (analysis/documentation)
```

## Tests

### Tests du hook
```bash
npm test -- useChatTabs.test.ts
```

### Tests du composant
```bash
npm test -- ChatTabBar.test.tsx
```

### Page de démonstration
```
http://localhost:3000/test-tabs
```

## Migration des sessions existantes

Un script de migration est disponible pour initialiser les propriétés d'onglets sur les sessions existantes :

```typescript
import { migrateSessions } from '@/scripts/migrate-sessions-to-tabs'

// Exécuter la migration
await migrateSessions()
```

## Architecture technique

### Avantages de l'approche actuelle
1. **Simplicité** : Utilise la table `chat_sessions` existante
2. **Cohérence** : Pas de duplication de données
3. **Performance** : Moins de jointures nécessaires
4. **Maintenabilité** : Code plus simple

### Flux de données
1. **Chargement** : Récupération depuis `chat_sessions` avec tri par `tab_order`
2. **Modifications** : Mise à jour directe dans `chat_sessions`
3. **Synchronisation** : Rechargement depuis la DB après chaque opération
4. **États optimistes** : Mise à jour locale immédiate pour `isDirty` et `lastActivity`

## Fonctionnalités avancées

### Indicateur de modifications
```typescript
// Marquer un onglet comme modifié
markTabDirty(tabId, true)
```

### Activité des onglets
```typescript
// Mettre à jour l'activité
updateTabActivity(tabId)
```

### Gestion d'erreurs
```typescript
const { error } = useChatTabs(workspaceId, userId)

if (error) {
  console.error('Erreur onglets:', error.message)
}
```

## Prochaines améliorations possibles

1. **Synchronisation temps réel** : Utilisation de Supabase realtime
2. **Drag & drop** : Réorganisation des onglets par glisser-déposer
3. **Raccourcis clavier** : Navigation par touches (Ctrl+Tab, etc.)
4. **Groupes d'onglets** : Organisation par projets/contextes
5. **Sauvegarde automatique** : Sauvegarde périodique du contenu
6. **Historique** : Récupération d'onglets fermés

## Dépannage

### Problèmes courants

1. **Onglets qui ne se chargent pas**
   - Vérifier que `workspaceId` et `userId` sont fournis
   - Vérifier les permissions Supabase RLS

2. **Erreurs de persistance**
   - Vérifier la connexion Supabase
   - Vérifier les colonnes de la table `chat_sessions`

3. **Performance lente**
   - Considérer l'ajout d'index sur `user_id`, `workspace_id`, `tab_order`

### Debug
```typescript
// Activer les logs détaillés
const { tabs, error, isLoading } = useChatTabs(workspaceId, userId)
console.log('Tabs:', tabs)
console.log('Error:', error)
console.log('Loading:', isLoading)
```
