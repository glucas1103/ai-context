# Serveur MCP Documentation

## 📋 Vue d'ensemble

Ce serveur MCP (Model Context Protocol) permet à Claude Code de créer et gérer des fichiers de documentation dans vos workspaces via des commandes naturelles.

## 📚 Table des matières

- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Outils disponibles](#️-outils-disponibles)
- [Structure des fichiers](#-structure-des-fichiers)
- [Configuration](#-configuration)
- [Dépannage](#-dépannage)
- [Support](#-support)

## 🚀 Installation

### 1. Dépendances

Les dépendances MCP sont automatiquement installées avec le projet :

```bash
npm install
```

### 2. Variables d'environnement

Assurez-vous que ces variables sont définies :

```bash
export SUPABASE_URL="votre_url_supabase"
export SUPABASE_ANON_KEY="votre_clé_anon_supabase"
export WORKSPACE_ID="id_de_votre_workspace"
```

## 🔧 Utilisation

### **Utilisation automatique (recommandée)**

Les outils MCP sont **intégrés directement dans Claude Code** et se déclenchent automatiquement quand vous utilisez des commandes naturelles.

**Exemples d'utilisation :**
- "Crée un fichier README.md à la racine"
- "Crée un guide d'installation dans le dossier docs/"
- "Crée un fichier API.md avec les tags 'api' et 'documentation'"
- "Trouve le dossier docs"

### **Démarrage manuel (pour tests)**

```bash
# Depuis la racine du projet web
./scripts/start-mcp.sh [workspace_id]

# Ou directement
WORKSPACE_ID="votre_id" node mcp-server-documentation.js
```

**Note :** Le serveur MCP externe est principalement utilisé pour les tests. En production, les outils MCP sont intégrés directement dans la route Claude Code.

## 🛠️ Outils disponibles

### **1. Création de fichiers (automatique)**

**Fonctionnalité :** Création automatique de fichiers de documentation dans la base de données Supabase

**Détection automatique :** L'outil détecte automatiquement les demandes de création de fichiers dans vos messages

**Paramètres détectés :**
- **Nom du fichier** : Extrait automatiquement du message
- **Extension** : Détectée automatiquement (md, txt, doc)
- **Dossier parent** : Détecté si spécifié (ex: "dans le dossier docs")
- **Tags** : Détectés si spécifiés (ex: "avec les tags 'api' et 'docs'")

**Exemples d'utilisation :**
```
"Crée un fichier README.md à la racine"
"Crée un guide d'installation dans le dossier docs/"
"Crée un fichier API.md avec les tags 'api' et 'documentation'"
```

### **2. Recherche de dossiers (automatique)**

**Fonctionnalité :** Recherche automatique de dossiers de documentation dans Supabase

**Détection automatique :** L'outil détecte automatiquement les demandes de recherche

**Exemples d'utilisation :**
```
"Trouve le dossier docs"
"Localise le dossier guides"
```

### **3. Intégration transparente**

**Comment ça marche :**
1. Vous tapez une commande naturelle dans Claude Code
2. L'outil MCP détecte automatiquement votre intention
3. L'outil exécute l'action (création/recherche) dans Supabase
4. Le résultat est intégré dans votre conversation
5. Claude Code continue avec le contexte enrichi

## 📁 Structure des fichiers

```
apps/web/
├── src/lib/mcp/
│   ├── config.ts          # Configuration MCP
│   ├── server.ts          # Serveur MCP principal
│   ├── tools/
│   │   ├── documentation.ts # Outils de documentation
│   │   └── index.ts       # Export des outils
│   └── index.ts           # Export principal
├── mcp-server-documentation.js # Point d'entrée
├── scripts/
│   └── start-mcp.sh       # Script de démarrage
└── docs/
    └── MCP_README.md      # Cette documentation
```

## 🔒 Sécurité

- ✅ Authentification utilisateur préservée
- ✅ Vérification d'accès au workspace
- ✅ Validation des paramètres MCP
- ✅ Outils explicitement autorisés
- ✅ Logs de toutes les opérations

## 🧪 Tests

### **Test de l'implémentation intégrée (recommandé)**

1. **Compiler le projet :**
   ```bash
   npm run build
   ```

2. **Tester dans Claude Code :**
   - Allez dans votre workspace
   - Utilisez Claude Code
   - Tapez des commandes naturelles comme :
     - "Crée un fichier README.md à la racine"
     - "Trouve le dossier docs"

3. **Vérifier les résultats :**
   - Les fichiers sont créés dans la base de données Supabase
   - Les résultats sont intégrés dans la conversation
   - Claude Code continue avec le contexte enrichi

### **Test du serveur MCP externe (optionnel)**

```bash
# Démarrer le serveur MCP externe
./scripts/start-mcp.sh [workspace_id]

# Ce serveur est principalement utilisé pour les tests
# En production, les outils MCP sont intégrés directement
```

## 🐛 Dépannage

### **Problèmes courants**

#### Erreur : "WORKSPACE_ID est requis"
```bash
export WORKSPACE_ID="votre_id_workspace"
```

#### Erreur : "SUPABASE_URL et SUPABASE_ANON_KEY sont requis"
```bash
export SUPABASE_URL="votre_url"
export SUPABASE_ANON_KEY="votre_clé"
```

#### Erreur : "Le serveur MCP n'existe pas"
```bash
npm run build
```

#### Erreur de compilation
```bash
npm install
npm run build
```

### **Erreurs MCP spécifiques**

#### Erreur "Failed to parse URL"
- **Cause** : Configuration MCP incorrecte
- **Solution** : Vérifier les variables d'environnement et redémarrer l'application

#### Erreur "Controller is already closed"
- **Cause** : Problème de gestion du stream Claude Code
- **Solution** : Redémarrer l'application et nettoyer le cache

#### Erreur d'authentification
- **Cause** : Utilisateur non connecté ou session expirée
- **Solution** : Se reconnecter et vérifier la session

### **Guide de dépannage complet**

Pour une résolution détaillée de tous les problèmes MCP, consultez le **[Guide de dépannage MCP](./MCP_TROUBLESHOOTING.md)** qui contient :

- Solutions étape par étape
- Commandes de diagnostic
- Checklists de résolution
- Procédures d'escalade

## 📊 Monitoring

Le serveur MCP génère des logs détaillés :

- Démarrage/arrêt du serveur
- Création de fichiers
- Recherche de dossiers
- Erreurs et exceptions

## 🔄 Développement

### Ajouter un nouvel outil

1. Créer le schéma de validation dans `tools/documentation.ts`
2. Implémenter la fonction dans `tools/documentation.ts`
3. Ajouter l'outil dans `server.ts`
4. Mettre à jour la configuration dans `route.ts`

### Modifier la configuration

Éditez `config.ts` pour changer :
- Nom et version du serveur
- Paramètres de connexion
- Outils disponibles

## 📚 Ressources

- [Documentation officielle MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [SDK MCP TypeScript](https://github.com/modelcontextprotocol/sdk-typescript)
- [Guide d'implémentation Claude Code](https://docs.anthropic.com/en/docs/claude-code/sdk)

## 🤝 Support

Pour toute question ou problème :

1. Vérifiez les logs du serveur MCP
2. Consultez cette documentation
3. Vérifiez la configuration des variables d'environnement
4. Testez avec un workspace simple

---

**Version :** 1.0.0  
**Dernière mise à jour :** $(date)  
**Maintenu par :** Équipe développement
