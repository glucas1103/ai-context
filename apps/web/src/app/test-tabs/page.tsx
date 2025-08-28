'use client'

import React from 'react'
import { UniversalChatPanel } from '@/components/ui/universal/UniversalChatPanel'

export default function TestTabsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test des Onglets de Chat</h1>
        <p className="text-gray-400 mb-8">
          Démonstration de la fonctionnalité d'onglets pour le composant UniversalChatPanel.
        </p>
        
        <div className="h-[600px] border border-gray-700 rounded-lg overflow-hidden">
          <UniversalChatPanel
            workspaceId="test-workspace-123"
            agentType="analysis"
            context={{
              selectedFile: undefined,
              currentDirectory: '/',
              workspacePath: '/test/workspace'
            }}
            className="h-full"
            onMessageSent={(message) => {
              console.log('Message envoyé:', message)
            }}
            onSessionCreated={(sessionId) => {
              console.log('Session créée:', sessionId)
            }}
            onError={(error) => {
              console.error('Erreur chat:', error)
            }}
          />
        </div>
        
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Fonctionnalités disponibles :</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>✅ Création d'onglets multiples</li>
            <li>✅ Changement d'onglet actif</li>
            <li>✅ Renommage des onglets (double-clic sur le titre)</li>
            <li>✅ Fermeture des onglets (bouton X)</li>
            <li>✅ Indicateur de changements non sauvegardés (point jaune)</li>
            <li>✅ Persistance dans Supabase</li>
            <li>✅ Types d'onglets (Analyse, Documentation, Custom)</li>
            <li>✅ Ordre des onglets maintenu</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
