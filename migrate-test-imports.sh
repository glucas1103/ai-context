#!/bin/bash

echo "🚀 Début de la migration des imports dans les fichiers de tests..."

# Migration des imports de composants dans les tests
find apps/web/src -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i '' \
  -e 's|@/components/ThreePanelsLayout|@/components/layout/ThreePanelsLayout|g' \
  -e 's|@/components/ErrorScreen|@/components/ui/ErrorScreen|g' \
  -e 's|@/components/LoadingScreen|@/components/ui/LoadingScreen|g' \
  -e 's|@/components/universal/|@/components/ui/universal/|g' \
  -e 's|@/components/documentation/|@/components/documentation/|g' \
  -e 's|@/components/workspace/|@/components/workspace/|g'

# Migration des imports de types dans les tests
find apps/web/src -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i '' \
  -e 's|@/lib/types/context|@/types/api/workspace|g' \
  -e 's|@/lib/types/documentation|@/types/api/documentation|g' \
  -e 's|@/lib/types/universal-components|@/types/components/universal|g' \
  -e 's|@/lib/types/|@/types/|g'

# Migration des imports de constants et utils dans les tests
find apps/web/src -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i '' \
  -e 's|@/constants/api|@/constants/api|g' \
  -e 's|@/utils/api|@/utils/api|g' \
  -e 's|@/utils/auth|@/utils/auth|g' \
  -e 's|@/utils/formatting|@/utils/formatting|g'

echo "✅ Migration des imports dans les tests terminée!"
