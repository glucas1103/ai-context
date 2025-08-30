# Plan de Migration - Agent Claude Code vers ThreePanelsLayout

## 🎯 Objectif

Migrer l'agent Claude Code fonctionnel de `/test-claude-code` vers le panneau droit du `ThreePanelsLayout`, en supprimant tout le code obsolète des stories 1.6.1-1.6.3 et en adaptant l'agent pour analyser le workspace actif.

## 📊 Analyse de l'Agent Fonctionnel

### ✅ Ce qui fonctionne parfaitement dans `/test-claude-code`

#### **1. Interface Utilisateur Simple et Efficace**
- **Page** : `apps/web/src/app/(pages)/test-claude-code/page.tsx` (440 lignes)
- **Fonctionnalités** :
  - Interface de chat avec streaming en temps réel
  - Affichage des étapes intermédiaires (système, réflexion, outils)
  - Configuration simple (maxTurns, session ID, étapes intermédiaires)
  - Messages avec métadonnées (durée, coût, tours)
  - Auto-scroll et gestion d'état propre

#### **2. API Route Directe et Performante**
- **Route** : `apps/web/src/app/api/test-claude-code/route.ts` (205 lignes)
- **Fonctionnalités** :
  - Utilisation directe du SDK officiel `@anthropic-ai/claude-code`
  - Streaming natif avec `query()` function
  - Configuration workspace hardcodée mais fonctionnelle
  - Gestion d'erreurs robuste
  - Métadonnées complètes (durée, coût, usage)

#### **3. Architecture Ultra-Simple**
```typescript
// Utilisation directe du SDK officiel
import { query } from '@anthropic-ai/claude-code';

// Configuration simple
const options = {
  maxTurns: 5,
  cwd: '/Users/lucasgaillard/Documents/AIcontext',
  customSystemPrompt: '...',
  allowedTools: ['Read', 'Grep', 'WebSearch']
};

// Appel direct
for await (const responseMessage of query({ prompt: message, options })) {
  // Streaming natif
}
```

## 🗑️ Code Obsolète à Supprimer

### **Fichiers Inutiles des Stories 1.6.1-1.6.3**

#### **1. Composants Chat Complexes (Story 1.6.1)**
```
apps/web/src/components/universal/chat/
├── ChatControls.tsx                    # ❌ SUPPRIMER
├── ChatHeader.tsx                      # ❌ SUPPRIMER  
├── ChatTabBar.tsx                      # ❌ SUPPRIMER
├── ClaudeCodeIndicator.tsx             # ❌ SUPPRIMER
├── EnrichedMessage.tsx                 # ❌ SUPPRIMER
├── Message.tsx                         # ❌ SUPPRIMER
├── MessageInput.tsx                    # ❌ SUPPRIMER
├── MessageList.tsx                     # ❌ SUPPRIMER
├── index.ts                            # ❌ SUPPRIMER
├── __tests__/                          # ❌ SUPPRIMER (tous les tests)
├── __mocks__/                          # ❌ SUPPRIMER
└── README.md                           # ❌ SUPPRIMER
```

#### **2. Hooks Complexes (Stories 1.6.1-1.6.2)**
```
apps/web/src/hooks/
├── useChatMessages.ts                  # ❌ SUPPRIMER
├── useChatSession.ts                   # ❌ SUPPRIMER
├── useChatTabs.ts                      # ❌ SUPPRIMER
└── __tests__/useChatTabs.test.ts       # ❌ SUPPRIMER
```

#### **3. Services Complexes (Story 1.6.1)**
```
apps/web/src/lib/services/
├── chatService.ts                      # ❌ SUPPRIMER
└── __tests__/                          # ❌ SUPPRIMER
```

#### **4. Types Complexes (Story 1.6.1)**
```
apps/web/src/types/chat/
├── universal.ts                        # ❌ SUPPRIMER
└── index.ts                            # ❌ SUPPRIMER
```

#### **5. Composant Principal Défaillant**
```
apps/web/src/components/ui/universal/
└── UniversalChatPanel.tsx              # ❌ SUPPRIMER (531 lignes inutiles)
```

### **Raisons de Suppression**
1. **Complexité inutile** : 1000+ lignes pour reproduire ce que fait le SDK natif
2. **Bugs non résolus** : Sessions, onglets, affichage défaillants
3. **Architecture sur-ingénieurée** : Surcouche complexe autour d'un SDK simple
4. **Maintenance coûteuse** : Code custom vs SDK officiel maintenu

## 🏗️ Architecture Cible

### **1. Structure Simple et Efficace**
```
apps/web/src/components/workspace/
└── ClaudeCodePanel.tsx                 # 🆕 NOUVEAU (≤200 lignes)

apps/web/src/hooks/
└── useClaudeCode.ts                    # 🆕 NOUVEAU (≤50 lignes)

apps/web/src/app/api/workspaces/[id]/
└── claude-code/route.ts                # 🆕 NOUVEAU (≤150 lignes)

apps/web/src/types/
└── claude-code.ts                      # 🆕 NOUVEAU (≤50 lignes)
```

### **2. Composant ClaudeCodePanel**
- **Basé sur** : `test-claude-code/page.tsx` (partie chat uniquement)
- **Adaptations** :
  - Suppression du header et configuration (intégrés dans le layout)
  - Adaptation du style pour s'intégrer dans le panneau droit
  - Récupération du workspace ID depuis les props
  - Configuration workspace dynamique

### **3. Hook useClaudeCode**
- **Logique simple** : État des messages, envoi, streaming
- **Pas de gestion de sessions complexe** : Une conversation par workspace
- **API workspace-aware** : Appel à `/api/workspaces/[id]/claude-code`

### **4. API Route Workspace-Aware**
- **Basée sur** : `test-claude-code/route.ts`
- **Adaptations** :
  - Récupération des données workspace depuis Supabase
  - Configuration `cwd` dynamique basée sur le workspace
  - Authentification utilisateur
  - Prompt personnalisé selon le workspace

## 🔄 Plan de Migration Étape par Étape

### **Phase 1: Nettoyage (CRITIQUE)**
- [ ] **Supprimer tous les fichiers obsolètes** listés ci-dessus
- [ ] **Nettoyer les imports** dans les fichiers qui référencent le code supprimé
- [ ] **Vérifier que l'app fonctionne** sans les composants supprimés
- [ ] **Commit de nettoyage** : "Clean obsolete chat components from stories 1.6.1-1.6.3"

### **Phase 2: Types et Interfaces (30 min)**
- [ ] **Créer** `apps/web/src/types/claude-code.ts`
  ```typescript
  interface ClaudeCodeMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
    isIntermediate?: boolean;
    metadata?: {
      duration_ms?: number;
      num_turns?: number;
      total_cost_usd?: number;
    };
  }

  interface ClaudeCodeConfig {
    workspaceId: string;
    maxTurns: number;
    showIntermediateSteps: boolean;
  }
  ```

### **Phase 3: Hook Simple (45 min)**
- [ ] **Créer** `apps/web/src/hooks/useClaudeCode.ts`
  - État des messages (local, pas de persistance complexe)
  - Fonction `sendMessage` qui appelle l'API workspace
  - Gestion du streaming
  - États loading/error simples

### **Phase 4: API Route Workspace (60 min)**
- [ ] **Créer** `apps/web/src/app/api/workspaces/[id]/claude-code/route.ts`
  - **Copier** la logique de `test-claude-code/route.ts`
  - **Adapter** pour récupérer les données workspace depuis Supabase
  - **Configurer** `cwd` dynamiquement selon le workspace
  - **Ajouter** authentification utilisateur

### **Phase 5: Composant Panel (90 min)**
- [ ] **Créer** `apps/web/src/components/workspace/ClaudeCodePanel.tsx`
  - **Copier** la partie chat de `test-claude-code/page.tsx`
  - **Adapter** le style pour le panneau droit
  - **Supprimer** header et configuration (déjà dans le layout)
  - **Intégrer** avec `useClaudeCode`
  - **Responsive** pour différentes tailles de panneau

### **Phase 6: Intégration ThreePanelsLayout (30 min)**
- [ ] **Modifier** les pages workspace pour utiliser `ClaudeCodePanel`
- [ ] **Tester** l'intégration dans le panneau droit
- [ ] **Ajuster** les styles si nécessaire

### **Phase 7: Configuration Workspace (45 min)**
- [ ] **Récupérer** les données workspace (repo GitHub, path)
- [ ] **Configurer** le `cwd` pour pointer vers le bon repository
- [ ] **Adapter** le prompt système selon le workspace
- [ ] **Tester** avec différents workspaces

## 📋 Spécifications Détaillées

### **1. ClaudeCodePanel - Spécifications UI**

#### **Props Interface**
```typescript
interface ClaudeCodePanelProps {
  workspaceId: string;
  className?: string;
  maxHeight?: string;
}
```

#### **Layout Adapté pour Panneau Droit**
```typescript
// Style adapté pour panneau étroit
<div className="flex flex-col h-full bg-gray-900 text-white">
  {/* Messages - Pas de sidebar config */}
  <div className="flex-1 overflow-y-auto p-4">
    {/* Messages simplifiés */}
  </div>
  
  {/* Input compact */}
  <div className="border-t border-gray-700 p-3">
    {/* Zone de saisie compacte */}
  </div>
</div>
```

#### **Messages Simplifiés**
- **Messages utilisateur** : Bulles bleues alignées à droite
- **Messages assistant** : Texte libre aligné à gauche
- **Messages système** : Badges jaunes pour les outils
- **Étapes intermédiaires** : Texte gris italic (optionnel)

### **2. API Route - Spécifications Backend**

#### **Récupération Workspace**
```typescript
// Récupérer les données workspace depuis Supabase
const { data: workspace } = await supabase
  .from('workspaces')
  .select('*')
  .eq('id', workspaceId)
  .single();

// Configurer le cwd selon le workspace
const workspacePath = `/tmp/claude-workspaces/${workspace.name}`;
```

#### **Configuration Dynamique**
```typescript
const options = {
  maxTurns,
  cwd: workspacePath,
  additionalDirectories: [
    `${workspacePath}/src`,
    `${workspacePath}/docs`,
    `${workspacePath}/README.md`
  ],
  customSystemPrompt: `Tu es un expert en analyse de code travaillant sur le projet "${workspace.name}".
  
CONTEXTE DU PROJET:
${workspace.description}

REPOSITORY: ${workspace.github_url}

Analyse le code de ce projet spécifique et réponds en français.`,
  allowedTools: ['Read', 'Grep', 'WebSearch']
};
```

### **3. Hook useClaudeCode - Spécifications Logic**

#### **État Simple**
```typescript
interface UseClaudeCodeState {
  messages: ClaudeCodeMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
}
```

#### **Fonctions**
```typescript
interface UseClaudeCodeReturn {
  messages: ClaudeCodeMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}
```

## 🎯 Avantages de cette Approche

### **1. Simplicité Maximale**
- **≤400 lignes total** vs 1000+ lignes obsolètes
- **SDK officiel direct** vs surcouche complexe
- **Maintenance minimale** vs debugging constant

### **2. Fonctionnalités Garanties**
- **Streaming natif** : Fonctionne déjà dans `/test-claude-code`
- **Métadonnées complètes** : Durée, coût, tours automatiques
- **Outils Claude Code** : Read, Grep, WebSearch natifs

### **3. Intégration Propre**
- **Workspace-aware** : Analyse le bon repository
- **ThreePanelsLayout** : S'intègre naturellement
- **Responsive** : Fonctionne sur toutes tailles d'écran

### **4. Évolutivité**
- **Base solide** : SDK officiel maintenu par Anthropic
- **Extensions faciles** : Ajout de fonctionnalités sans refonte
- **Performance** : Pas de surcouche, appels directs

## ⚠️ Points d'Attention

### **1. Configuration Workspace**
- **Path dynamique** : S'assurer que le workspace path est correct
- **Permissions** : Vérifier l'accès aux fichiers du workspace
- **Authentification** : Valider que l'utilisateur a accès au workspace

### **2. Gestion des Erreurs**
- **API Key** : Gérer l'absence de clé API Anthropic
- **Workspace inexistant** : Gérer les workspaces supprimés
- **Limites Claude Code** : Gérer les quotas et limites

### **3. Performance**
- **Streaming** : S'assurer que le streaming fonctionne dans le panneau
- **Mémoire** : Limiter le nombre de messages gardés en mémoire
- **Réseau** : Gérer les déconnexions réseau

## 📅 Timeline Estimé

| Phase | Durée | Description |
|-------|--------|-------------|
| **Phase 1** | 30 min | Nettoyage fichiers obsolètes |
| **Phase 2** | 30 min | Types et interfaces |
| **Phase 3** | 45 min | Hook useClaudeCode |
| **Phase 4** | 60 min | API Route workspace |
| **Phase 5** | 90 min | Composant ClaudeCodePanel |
| **Phase 6** | 30 min | Intégration ThreePanelsLayout |
| **Phase 7** | 45 min | Configuration workspace |
| **Tests** | 30 min | Tests et validation |
| **TOTAL** | **5h30** | **Migration complète** |

## ✅ Critères de Succès

### **Fonctionnel**
- [ ] L'agent Claude Code fonctionne dans le panneau droit
- [ ] Analyse le workspace sélectionné (pas le repo local)
- [ ] Streaming des réponses en temps réel
- [ ] Affichage des étapes intermédiaires
- [ ] Métadonnées complètes (durée, coût, tours)

### **Technique**
- [ ] Code ≤400 lignes total (vs 1000+ obsolètes)
- [ ] Utilisation directe du SDK officiel
- [ ] Pas de bugs de session ou d'affichage
- [ ] Intégration propre dans ThreePanelsLayout
- [ ] Responsive sur toutes tailles d'écran

### **Utilisateur**
- [ ] Interface intuitive et rapide
- [ ] Réponses pertinentes au workspace
- [ ] Pas d'erreurs ou de bugs
- [ ] Expérience fluide et professionnelle

## 🚀 Prochaines Étapes

1. **Validation du plan** par l'équipe
2. **Démarrage Phase 1** : Nettoyage immédiat
3. **Implémentation séquentielle** des phases 2-7
4. **Tests et validation** continue
5. **Déploiement** et monitoring

---

**Résultat attendu** : Un agent Claude Code simple, fiable et intégré qui analyse le workspace actif depuis le panneau droit du ThreePanelsLayout, sans la complexité inutile des stories précédentes.
