'use client'

import { HiChatBubbleLeftRight, HiSparkles } from 'react-icons/hi2'

export default function ChatPanel() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 p-3">
        <div className="flex items-center space-x-2">
          <HiChatBubbleLeftRight className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-medium text-gray-200">Assistant IA</h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <HiSparkles className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">
              Assistant IA en cours de développement
            </h4>
            <p className="text-gray-400 text-sm max-w-xs">
              Bientôt disponible : posez des questions sur votre documentation et obtenez des réponses contextuelles
            </p>
          </div>

          {/* Features Preview */}
          <div className="space-y-3 text-left">
            <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-white">Questions contextuelles</p>
                <p className="text-xs text-gray-400">Posez des questions sur le contenu affiché</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-white">Suggestions d'amélioration</p>
                <p className="text-xs text-gray-400">Obtenez des suggestions pour enrichir votre documentation</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-medium text-white">Génération de contenu</p>
                <p className="text-xs text-gray-400">Générez automatiquement du contenu basé sur votre codebase</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 p-3">
        <div className="text-xs text-gray-500 text-center">
          Disponible dans la prochaine version
        </div>
      </div>
    </div>
  )
}
