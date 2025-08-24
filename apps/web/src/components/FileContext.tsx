'use client'

import Editor from '@monaco-editor/react'
import { FileContextProps } from '@/lib/types/context'

export default function FileContext({
  selectedFile,
  fileContent,
  isLoadingContent
}: FileContextProps) {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white">
          {selectedFile ? selectedFile.path : 'Sélectionnez un fichier'}
        </h3>
        {selectedFile && (
          <p className="text-sm text-gray-400">
            {selectedFile.language} • {selectedFile.size ? `${selectedFile.size} octets` : 'Taille inconnue'}
          </p>
        )}
      </div>
      <div className="flex-1">
        {isLoadingContent ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Chargement du fichier...</p>
            </div>
          </div>
        ) : selectedFile && selectedFile.type === 'file' ? (
          <Editor
            height="100%"
            theme="vs-dark"
            language={selectedFile.language || 'plaintext'}
            value={fileContent}
            path={selectedFile.path}
            loading={<div className="flex items-center justify-center h-full text-gray-400">Chargement de l&apos;éditeur...</div>}
            options={{
              readOnly: true,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              automaticLayout: true,
              contextmenu: false,
              selectOnLineNumbers: true,
            }}
            beforeMount={(monaco) => {
              // Configuration du thème sombre personnalisé si nécessaire
              monaco.editor.defineTheme('custom-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                  'editor.background': '#111827',
                }
              })
            }}
            onMount={(editor, monaco) => {
              monaco.editor.setTheme('custom-dark')
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p>Sélectionnez un fichier dans l&apos;arborescence pour l&apos;afficher</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
