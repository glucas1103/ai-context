'use client'

import { ChatContextProps } from '@/lib/types/context'

export default function ChatContext({
  selectedFile,
  workspace
}: ChatContextProps) {
  return (
    <div className="h-full bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">Actions</h2>
      </div>
      <div className="flex-1 p-4">
        <div className="bg-blue-900/20 border border-blue-700 rounded p-4 text-center">
          <p className="text-blue-200 text-sm">
            📝 Interface de chat avec l&apos;IA
          </p>
          <p className="text-blue-300 text-xs mt-2">
            (À implémenter dans les prochaines stories)
          </p>
        </div>
        
        {selectedFile && (
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <h4 className="text-white font-medium text-sm mb-2">Fichier sélectionné:</h4>
            <p className="text-gray-300 text-xs">{selectedFile.path}</p>
            {selectedFile.language && (
              <p className="text-gray-400 text-xs mt-1">Type: {selectedFile.language}</p>
            )}
          </div>
        )}

        {workspace && (
          <div className="mt-4 p-3 bg-gray-700 rounded">
            <h4 className="text-white font-medium text-sm mb-2">Workspace:</h4>
            <p className="text-gray-300 text-xs">{workspace.name}</p>
          </div>
        )}
      </div>
    </div>
  )
}
