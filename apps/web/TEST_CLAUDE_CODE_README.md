# Page de Test Claude Code

## 🎯 Objectif

Cette page permet de tester l'intégration du SDK Claude Code d'Anthropic avec un agent spécialisé en documentation technique.

## 📍 Accès

Une fois l'application démarrée, accédez à :
```
http://localhost:3000/test-claude-code
```

## 🤖 Agent Configuré

L'agent est un **Expert en Documentation Technique** avec les spécialités suivantes :
- Analyse et rédaction de documentation technique
- Architecture de logiciels et systèmes
- Bonnes pratiques de développement
- Standards de documentation (Markdown, GitBook, etc.)
- Diagrammes et schémas techniques
- Documentation d'API et de codes
- Guides utilisateur et tutoriels

## 🛠️ Fonctionnalités

### Interface Chat
- **Conversation en temps réel** avec l'agent Claude Code
- **Historique des messages** persistant pendant la session
- **Métadonnées** affichées : durée, coût, nombre de tours
- **Configuration personnalisable** : nombre maximum de tours

### Outils Disponibles
L'agent a accès aux outils suivants :
- `Read` : Lecture de fichiers
- `Grep` : Recherche dans les fichiers
- `WebSearch` : Recherche web

### Gestion de Session
- **Session automatique** : Chaque conversation maintient une session
- **Reprise de session** : Les conversations peuvent être reprises
- **Nouveau chat** : Bouton pour démarrer une nouvelle session

## 💡 Exemples d'Utilisation

Voici quelques questions que vous pouvez poser à l'agent :

### Documentation existante
```
"Peux-tu analyser la structure de documentation de ce projet et me suggérer des améliorations ?"
```

### Création de guides
```
"Aide-moi à créer un guide d'installation pour une API REST"
```

### Révision de code
```
"Examine ce composant React et propose une documentation technique appropriée"
```

### Architecture
```
"Comment documenter l'architecture d'une application microservices ?"
```

## 🔧 Configuration Technique

### API Endpoint
- **Route** : `/api/test-claude-code`
- **Méthodes** : 
  - `POST` : Envoi de messages à l'agent
  - `GET` : Récupération du statut de l'agent

### Paramètres Configurables
- **maxTurns** : Nombre maximum de tours de conversation (défaut: 5)
- **systemPrompt** : Prompt système spécialisé en documentation technique
- **allowedTools** : Liste des outils autorisés

### Response Format
```json
{
  "success": true,
  "response": "Réponse de l'agent...",
  "sessionId": "uuid-session",
  "metadata": {
    "duration_ms": 1500,
    "num_turns": 2,
    "total_cost_usd": 0.001234,
    "usage": { ... }
  }
}
```

## 🚀 Mise en Route

1. **Prérequis** : Assurez-vous d'avoir une clé API Anthropic configurée
2. **Installation** : Le SDK `@anthropic-ai/claude-code` est déjà installé
3. **Démarrage** : `npm run dev`
4. **Accès** : Naviguez vers `/test-claude-code`

## 🎨 Interface

L'interface comprend :
- **Panneau de statut** : Informations sur l'agent et ses capacités
- **Configuration** : Paramètres ajustables en temps réel
- **Zone de chat** : Messages avec historique et métadonnées
- **Champ de saisie** : Input avec envoi par Entrée

## 📊 Métadonnées

Chaque réponse de l'agent affiche :
- ⏱️ **Durée** : Temps de traitement en millisecondes
- 🔄 **Tours** : Nombre de tours utilisés dans la conversation
- 💰 **Coût** : Coût estimé en USD

## 🎯 Cas d'Usage Recommandés

Cette page est idéale pour :
- **Tester** l'intégration Claude Code
- **Expérimenter** avec différents prompts
- **Valider** les capacités de l'agent
- **Prototyper** des interactions d'assistance technique
- **Évaluer** les performances et coûts

## 🔍 Debug

En cas de problème :
1. Vérifiez les logs de la console du navigateur
2. Consultez les logs du serveur Next.js
3. Assurez-vous que la clé API Claude est correctement configurée
4. Vérifiez que le SDK `@anthropic-ai/claude-code` est installé
