#!/bin/bash

# Script de démarrage du serveur MCP Documentation
# Usage: ./scripts/start-mcp.sh [workspace_id]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [[ ! -f "package.json" ]]; then
    print_error "Ce script doit être exécuté depuis la racine du projet web"
    exit 1
fi

# Récupérer l'ID du workspace depuis les arguments ou l'environnement
WORKSPACE_ID=${1:-$WORKSPACE_ID}

if [[ -z "$WORKSPACE_ID" ]]; then
    print_error "WORKSPACE_ID est requis. Usage: $0 [workspace_id] ou définir la variable d'environnement WORKSPACE_ID"
    exit 1
fi

print_status "Démarrage du serveur MCP pour le workspace: $WORKSPACE_ID"

# Vérifier les variables d'environnement requises
if [[ -z "$SUPABASE_URL" ]]; then
    print_error "SUPABASE_URL n'est pas définie"
    exit 1
fi

if [[ -z "$SUPABASE_ANON_KEY" ]]; then
    print_error "SUPABASE_ANON_KEY n'est pas définie"
    exit 1
fi

# Vérifier que les dépendances sont installées
if [[ ! -d "node_modules" ]]; then
    print_warning "Dépendances non installées. Installation en cours..."
    npm install
fi

# Vérifier que le projet est compilé
if [[ ! -d "dist" ]]; then
    print_warning "Projet non compilé. Compilation en cours..."
    npm run build
fi

# Vérifier que le serveur MCP existe
if [[ ! -f "mcp-server-documentation.js" ]]; then
    print_error "Le serveur MCP n'existe pas. Vérifiez que le fichier mcp-server-documentation.js est présent."
    exit 1
fi

# Rendre le script exécutable
chmod +x mcp-server-documentation.js

# Définir les variables d'environnement
export WORKSPACE_ID
export MCP_PORT=${MCP_PORT:-3001}
export MCP_HOST=${MCP_HOST:-localhost}

print_status "Configuration MCP:"
print_status "  - Workspace ID: $WORKSPACE_ID"
print_status "  - Port: $MCP_PORT"
print_status "  - Host: $MCP_HOST"
print_status "  - Supabase URL: $SUPABASE_URL"

# Démarrer le serveur MCP
print_status "Démarrage du serveur MCP..."
print_status "Pour arrêter le serveur, utilisez Ctrl+C"

node mcp-server-documentation.js
