#!/bin/bash

echo "Migration des imports de composants..."

# Migrer les imports de composants
find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|@/components/ThreePanelsLayout|@/components/layout/ThreePanelsLayout|g' \
  -e 's|@/components/ErrorScreen|@/components/ui/ErrorScreen|g' \
  -e 's|@/components/LoadingScreen|@/components/ui/LoadingScreen|g' \
  -e 's|@/components/universal/|@/components/ui/universal/|g' \
  -e 's|@/components/ChatPanel|@/components/workspace/ChatPanel|g' \
  -e 's|@/components/RichTextEditor|@/components/documentation/RichTextEditor|g' \
  -e 's|@/components/documentation/DocumentationModals|@/components/documentation/DocumentationModals|g'

echo "Migration des imports terminée!"
