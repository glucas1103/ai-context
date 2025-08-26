#!/bin/bash

echo "Migration des imports de types..."

# Migrer les imports de types
find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|@/lib/types/context|@/types/api/workspace|g' \
  -e 's|@/lib/types/documentation|@/types/api/documentation|g' \
  -e 's|@/lib/types/universal-components|@/types/components/universal|g' \
  -e 's|@/lib/types/common|@/types/common|g'

echo "Migration des imports de types terminée!"
