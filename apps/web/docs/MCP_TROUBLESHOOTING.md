# Guide de dépannage MCP Documentation

## 🚨 **Problèmes courants et solutions**

### **1. Erreur "Failed to parse URL"**

#### **Symptômes**
```
TypeError: Failed to parse URL from /api/workspaces/...
```

#### **Cause**
- Configuration MCP utilisant une URL invalide
- Variables d'environnement manquantes ou incorrectes

#### **Solution**
1. Vérifier les variables d'environnement dans `.env.local` :
   ```bash
   NEXTAUTH_URL=https://votre-app.vercel.app
   VERCEL_URL=votre-app.vercel.app
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé
   ```

2. Redémarrer l'application Next.js
3. Vérifier que la compilation fonctionne : `npm run build`

### **2. Erreur "Controller is already closed"**

#### **Symptômes**
```
Error in Claude Code streaming: TypeError: Invalid state: Controller is already closed
```

#### **Cause**
- Tentative d'écriture dans un stream déjà fermé
- Gestion incorrecte du cycle de vie du stream

#### **Solution**
- Redémarrer l'application
- Vérifier que la session de chat est valide
- Nettoyer le cache du navigateur

### **3. Erreur d'authentification**

#### **Symptômes**
```
❌ Erreur: Vous devez être connecté pour créer des fichiers de documentation.
```

#### **Cause**
- Utilisateur non connecté
- Session expirée
- Problème avec l'authentification Supabase

#### **Solution**
1. Se reconnecter à l'application
2. Vérifier que la session est active
3. Vérifier les cookies d'authentification
4. Redémarrer l'application si nécessaire

### **4. Outil MCP non reconnu**

#### **Symptômes**
```
Outil MCP non reconnu: nom_outil
```

#### **Cause**
- Outil non implémenté dans `handleMCPTool`
- Nom d'outil incorrect dans la détection

#### **Solution**
1. Vérifier que l'outil est bien implémenté dans `tools/documentation.ts`
2. Vérifier que l'outil est ajouté dans `handleMCPTool`
3. Vérifier la détection MCP dans `detectMCPRequest`

## 🔧 **Vérifications de diagnostic**

### **Test de configuration MCP**
```bash
# Depuis apps/web/
cd apps/web
node -e "
const config = {
  baseUrl: process.env.NEXTAUTH_URL || 
            (process.env.VERCEL_URL ? \`https://\${process.env.VERCEL_URL}\` : 'http://localhost:3000'),
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
};
console.log('Base URL:', config.baseUrl);
console.log('Supabase Key:', config.supabaseAnonKey ? '✅' : '❌');
"
```

### **Test de compilation**
```bash
npm run build
```

### **Test des variables d'environnement**
```bash
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "VERCEL_URL: $VERCEL_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

## 📋 **Checklist de résolution**

### **Problème de création de fichiers**
- [ ] Vérifier l'authentification utilisateur
- [ ] Vérifier les variables d'environnement
- [ ] Tester la compilation
- [ ] Vérifier les logs du serveur
- [ ] Tester avec un workspace valide

### **Problème de configuration**
- [ ] Vérifier `.env.local`
- [ ] Redémarrer l'application
- [ ] Vérifier la configuration MCP
- [ ] Tester la construction d'URLs

### **Problème d'intégration**
- [ ] Vérifier la détection MCP
- [ ] Vérifier l'exécution des outils
- [ ] Vérifier les logs d'erreur
- [ ] Tester la route Claude Code

## 🚀 **Commandes utiles**

### **Redémarrage complet**
```bash
# Arrêter l'application
pkill -f "next"

# Nettoyer le cache
rm -rf .next

# Redémarrer
npm run dev
```

### **Vérification des logs**
```bash
# Logs Next.js
tail -f .next/server.log

# Logs MCP (si serveur externe)
tail -f mcp-server.log
```

### **Test des outils MCP**
```bash
# Démarrer le serveur MCP externe
./scripts/start-mcp.sh [workspace_id]

# Tester la création de fichier
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"tool": "create_documentation_file", "params": {"name": "test", "fileExtension": "md"}}'
```

## 📞 **Support et escalade**

### **Niveau 1 - Auto-résolution**
- Vérifier ce guide de dépannage
- Tester les solutions proposées
- Vérifier la documentation MCP

### **Niveau 2 - Équipe de développement**
- Créer un ticket avec les logs d'erreur
- Inclure les étapes de reproduction
- Fournir le contexte d'utilisation

### **Niveau 3 - Expert MCP**
- Escalade vers l'équipe MCP
- Analyse approfondie des logs
- Tests de régression

---

**Dernière mise à jour :** Janvier 2024  
**Responsable :** James (Full Stack Developer)  
**Version :** 1.1 (avec corrections de bugs)
