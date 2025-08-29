'use client';

import React from 'react';
import UniversalChatPanel from '@/components/ui/universal/UniversalChatPanel';

export default function TestChatPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Test UniversalChatPanel - Style Cursor</h1>
        
        <div className="h-[600px] border border-gray-600 rounded-lg overflow-hidden">
          <UniversalChatPanel
            workspaceId="test-workspace"
            agentType="analysis"
            showHeader={false}
            showControls={false}
            className="h-full"
          />
        </div>
        
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-2">Test Claude Code SDK - Story 1.6.2</h2>
          <p className="text-gray-300 text-sm mb-2">
            Interface de test pour Claude Code avec :
          </p>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 🤖 Claude Code SDK intégré (ultra-simple)</li>
            <li>• 🔍 Investigation autonome du code</li>
            <li>• 🧠 Raisonnement multi-étapes natif</li>
            <li>• 📁 Outils: Read, Grep, Glob, LS</li>
            <li>• 💬 Interface style Cursor réutilisée</li>
          </ul>
          
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">💡 Messages de test suggérés :</h3>
            <div className="space-y-1 text-xs text-blue-200">
              <p>• "Bonjour Claude Code, peux-tu analyser le fichier package.json ?"</p>
              <p>• "Quelles sont les dépendances principales de ce projet ?"</p>
              <p>• "Analyse la structure du dossier src/"</p>
              <p>• "Trouve tous les fichiers TypeScript dans le projet"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
