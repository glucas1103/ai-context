# UniversalChatPanel - Documentation

## Vue d'ensemble

Le `UniversalChatPanel` est un composant de chat universel spécialement conçu pour Claude Code, optimisé pour l'investigation autonome de codebase et l'interaction avec l'IA. Il fait partie de la Story 1.6.1 et remplace l'ancienne implémentation avec une architecture plus robuste.

## Fonctionnalités

- ✅ **Streaming en temps réel** : Support du streaming des réponses Claude Code
- ✅ **Support Markdown** : Affichage enrichi avec coloration syntaxique
- ✅ **Métadonnées Claude Code** : Affichage des outils utilisés, fichiers analysés, étapes d'investigation
- ✅ **Gestion de sessions** : Persistance des conversations dans Supabase
- ✅ **Responsive Design** : Interface adaptative pour tous les écrans
- ✅ **Rétrocompatibilité** : Compatible avec l'ancienne API pour une migration en douceur
- ✅ **Thèmes** : Support des thèmes clair et sombre
- ✅ **Export/Import** : Fonctionnalités d'export des conversations

## Architecture

### Composants

```
UniversalChatPanel/
├── UniversalChatPanel.tsx     # Composant principal
├── chat/
│   ├── Message.tsx            # Message individuel avec métadonnées
│   ├── MessageList.tsx        # Liste des messages avec auto-scroll
│   ├── MessageInput.tsx       # Zone de saisie avec suggestions
│   ├── ChatHeader.tsx         # En-tête avec statut de connexion
│   └── ChatControls.tsx       # Contrôles (clear, export, settings)
├── hooks/
│   ├── useChatSession.ts      # Gestion des sessions
│   └── useChatMessages.ts     # Gestion des messages
└── services/
    └── chatService.ts         # Service de persistance Supabase
```

### Types

```typescript
// Types principaux
interface UniversalChatPanelProps {
  // Configuration Claude Code
  sessionId?: string;
  workspaceId?: string;
  context?: ClaudeCodeContext;
  
  // Callbacks
  onMessageSent?: (message: ChatMessage) => void;
  onMessageReceived?: (message: ChatMessage) => void;
  onSessionCreated?: (sessionId: string) => void;
  onError?: (error: ChatError) => void;
  
  // UI Configuration
  showHeader?: boolean;
  showControls?: boolean;
  autoScroll?: boolean;
  maxHeight?: string;
  theme?: 'light' | 'dark';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error' | 'investigating' | 'reasoning';
  metadata?: {
    claudeActions?: string[];
    filesAnalyzed?: string[];
    investigationSteps?: InvestigationStep[];
    reasoningSteps?: ReasoningStep[];
    toolsUsed?: string[];
  };
}
```

## Utilisation

### Utilisation de base

```tsx
import { UniversalChatPanel } from '@/components/ui/universal';

function MyComponent() {
  return (
    <UniversalChatPanel
      workspaceId="my-workspace"
      showHeader={true}
      showControls={true}
      autoScroll={true}
    />
  );
}
```

### Avec contexte personnalisé

```tsx
const context = {
  selectedFile: '/src/components/Button.tsx',
  currentDirectory: '/src/components',
  workspacePath: '/project',
  investigationHistory: []
};

<UniversalChatPanel
  workspaceId="my-workspace"
  context={context}
  onInvestigationStart={(query) => console.log('Investigation:', query)}
  onInvestigationComplete={(results) => console.log('Results:', results)}
/>
```

### Avec callbacks complets

```tsx
<UniversalChatPanel
  workspaceId="my-workspace"
  onMessageSent={(message) => {
    console.log('Message envoyé:', message);
  }}
  onMessageReceived={(message) => {
    console.log('Réponse reçue:', message);
  }}
  onSessionCreated={(sessionId) => {
    console.log('Session créée:', sessionId);
  }}
  onError={(error) => {
    console.error('Erreur:', error);
  }}
/>
```

### Rétrocompatibilité (ancienne API)

```tsx
// L'ancienne interface est toujours supportée
<UniversalChatPanel
  agentType="analysis"
  selectedItem={{
    id: 'file-1',
    name: 'Button.tsx',
    path: '/src/components/Button.tsx',
    type: 'file'
  }}
  workspaceId="my-workspace"
  onSendMessage={async (message) => {
    // Ancienne méthode d'envoi
  }}
  messages={legacyMessages}
  isLoading={false}
/>
```

## Configuration

### Variables d'environnement requises

```env
# Anthropic API
ANTHROPIC_API_KEY=your-api-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Dépendances

```json
{
  "react-markdown": "^9.0.0",
  "react-syntax-highlighter": "^15.5.0",
  "@types/react-syntax-highlighter": "^15.5.0"
}
```

## Intégration avec Supabase

Le composant utilise les tables Supabase suivantes :

- `chat_sessions` : Sessions de conversation
- `chat_messages` : Messages individuels avec métadonnées Claude Code
- `claude_investigation_cache` : Cache des investigations (optionnel)

### Structure de données

```sql
-- Extension des tables existantes pour Claude Code
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS claude_actions JSONB DEFAULT '[]';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS investigation_steps JSONB DEFAULT '[]';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reasoning_steps JSONB DEFAULT '[]';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS files_analyzed JSONB DEFAULT '[]';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS tools_used JSONB DEFAULT '[]';
```

## API Routes

### Sessions

- `POST /api/workspaces/[id]/chat/sessions` : Créer une session
- `GET /api/workspaces/[id]/chat/sessions` : Récupérer les sessions

### Messages

- `POST /api/workspaces/[id]/chat/message` : Envoyer un message (streaming)

## Tests

```bash
# Lancer les tests unitaires
npm test -- components/universal/chat

# Tests avec coverage
npm test -- --coverage components/universal/chat
```

## Migration depuis l'ancienne version

### Étapes de migration

1. **Installation des dépendances** :
   ```bash
   npm install react-markdown react-syntax-highlighter
   ```

2. **Mise à jour des imports** :
   ```tsx
   // Ancien
   import ChatPanel from '@/components/workspace/ChatPanel';
   
   // Nouveau
   import { UniversalChatPanel } from '@/components/ui/universal';
   ```

3. **Adaptation des props** :
   ```tsx
   // Ancien
   <ChatPanel
     onSendMessage={handleSend}
     messages={messages}
     isLoading={loading}
   />
   
   // Nouveau
   <UniversalChatPanel
     workspaceId="workspace-id"
     onMessageSent={handleMessageSent}
     // Autres nouvelles props...
   />
   ```

### Compatibilité

Le nouveau composant maintient une compatibilité avec l'ancienne API grâce à un système de props hybride. Cela permet une migration progressive sans casser le code existant.

## Performance

- **Lazy loading** : Les composants sont chargés à la demande
- **Memoization** : Optimisations React.memo pour éviter les re-renders
- **Streaming optimisé** : Gestion efficace des chunks de données
- **Auto-scroll intelligent** : Scroll automatique uniquement quand nécessaire

## Bonnes pratiques

1. **Gestion des erreurs** : Toujours fournir un callback `onError`
2. **Contexte** : Fournir un contexte riche pour de meilleures réponses
3. **Persistence** : Utiliser des `sessionId` stables pour la persistance
4. **Performance** : Éviter de re-créer les callbacks à chaque render

## Dépannage

### Problèmes courants

1. **Streaming qui ne fonctionne pas** :
   - Vérifier la configuration de l'API Anthropic
   - Vérifier les en-têtes CORS

2. **Messages non sauvegardés** :
   - Vérifier la configuration Supabase
   - Vérifier les permissions RLS

3. **Interface qui ne s'affiche pas** :
   - Vérifier l'installation des dépendances markdown
   - Vérifier les imports de styles CSS

### Logs de débogage

```typescript
// Activer les logs détaillés
localStorage.setItem('debug-chat', 'true');
```

## Roadmap

- [ ] Support des attachments (fichiers)
- [ ] Suggestions d'auto-complétion
- [ ] Recherche dans l'historique
- [ ] Raccourcis clavier avancés
- [ ] Mode collaboration temps réel

