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
          <h2 className="text-lg font-semibold text-white mb-2">Interface Style Cursor</h2>
          <p className="text-gray-300 text-sm mb-2">
            Cette interface reproduit le style de Cursor avec :
          </p>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Onglets en haut avec boutons de fenêtre</li>
            <li>• Bulles bleues pour les messages utilisateur</li>
            <li>• Flux libre pour les réponses de l'agent</li>
            <li>• Avatar Claude avec gradient</li>
            <li>• Actions sur les messages (Copier, Réutiliser, etc.)</li>
            <li>• Suggestions rapides</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
