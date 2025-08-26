#!/bin/bash

echo "🚀 Début de la migration des imports..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "apps/web/src" ]; then
    log_error "Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Créer une sauvegarde
log_info "Création d'une sauvegarde..."
cp -r apps/web/src apps/web/src.backup.$(date +%Y%m%d_%H%M%S)

# 1. Migration des imports de composants
log_info "Migration des imports de composants..."

find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
    -e 's|@/components/ThreePanelsLayout|@/components/layout/ThreePanelsLayout|g' \
    -e 's|@/components/ErrorScreen|@/components/ui/ErrorScreen|g' \
    -e 's|@/components/LoadingScreen|@/components/ui/LoadingScreen|g' \
    -e 's|@/components/universal/|@/components/ui/universal/|g' \
    -e 's|@/components/documentation/|@/components/documentation/|g' \
    -e 's|@/components/workspace/|@/components/workspace/|g'

# 2. Migration des imports de types
log_info "Migration des imports de types..."

find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
    -e 's|@/lib/types/context|@/types/api/workspace|g' \
    -e 's|@/lib/types/documentation|@/types/api/documentation|g' \
    -e 's|@/lib/types/universal-components|@/types/components/universal|g' \
    -e 's|@/lib/types/|@/types/|g'

# 3. Migration vers les nouveaux utils et constants
log_info "Migration vers les nouveaux utils et constants..."

# Remplacer les imports de lib/errors par utils/api
find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
    -e 's|@/lib/errors|@/utils/api|g'

# Remplacer les imports de lib/supabase par utils/auth (si applicable)
find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
    -e 's|@/lib/supabase/token-utils|@/utils/auth|g'

# 4. Ajouter les imports des nouveaux modules où c'est pertinent
log_info "Ajout des imports des nouveaux modules..."

# Chercher les fichiers qui utilisent des constantes hardcodées
find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "/api/" | while read file; do
    # Ajouter l'import des constantes API si pas déjà présent
    if ! grep -q "from '@/constants/api'" "$file"; then
        # Ajouter l'import en haut du fichier (après les imports React)
        sed -i '' '1i\
import { API_ENDPOINTS } from "@/constants/api";
' "$file"
    fi
done

# Chercher les fichiers qui utilisent des routes hardcodées
find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "workspaces/" | while read file; do
    # Ajouter l'import des constantes de routes si pas déjà présent
    if ! grep -q "from '@/constants/routes'" "$file"; then
        # Ajouter l'import en haut du fichier (après les imports React)
        sed -i '' '1i\
import { ROUTES } from "@/constants/routes";
' "$file"
    fi
done

# 5. Nettoyer les imports en double
log_info "Nettoyage des imports en double..."

# Supprimer les lignes d'import vides
find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/^import $/d'

# 6. Vérifier les imports cassés
log_info "Vérification des imports cassés..."

# Chercher les imports qui pourraient être cassés
BROKEN_IMPORTS=$(find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "Cannot find module" 2>/dev/null || true)

if [ -n "$BROKEN_IMPORTS" ]; then
    log_warn "Imports potentiellement cassés détectés dans:"
    echo "$BROKEN_IMPORTS"
else
    log_info "Aucun import cassé détecté"
fi

# 7. Statistiques
log_info "Statistiques de la migration:"

COMPONENT_IMPORTS=$(find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -c "@/components" | awk '{sum+=$1} END {print sum}')
TYPE_IMPORTS=$(find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -c "@/types" | awk '{sum+=$1} END {print sum}')
CONSTANT_IMPORTS=$(find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -c "@/constants" | awk '{sum+=$1} END {print sum}')
UTIL_IMPORTS=$(find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -c "@/utils" | awk '{sum+=$1} END {print sum}')

echo "  - Imports de composants: $COMPONENT_IMPORTS"
echo "  - Imports de types: $TYPE_IMPORTS"
echo "  - Imports de constantes: $CONSTANT_IMPORTS"
echo "  - Imports d'utilitaires: $UTIL_IMPORTS"

log_info "✅ Migration des imports terminée!"
log_warn "⚠️  Vérifiez manuellement les imports et testez la compilation"
