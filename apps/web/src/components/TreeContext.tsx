'use client'

import { Tree } from 'react-arborist'
import { TreeContextProps, FileTreeNode } from '@/lib/types/context'

export default function TreeContext({
  fileTree,
  selectedFile,
  onFileSelect,
  isLoading,
  treeHeight
}: TreeContextProps) {
  return (
    <div className="h-full bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">Arborescence</h2>
        <p className="text-sm text-gray-400">
          {fileTree.length} élément{fileTree.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : fileTree.length > 0 ? (
          <div className="h-full text-white">
            <Tree
              data={fileTree}
              openByDefault={false}
              width="100%"
              height={treeHeight}
              indent={24}
              padding={4}
              rowHeight={32}
              overscanCount={1}
              searchTerm=""
              onActivate={(node) => {
                if (node.data.type === 'file') {
                  onFileSelect(node.data)
                }
              }}
            >
              {({ node, style, dragHandle }) => (
                <div 
                  style={style} 
                  ref={dragHandle}
                  className={`flex items-center px-2 py-1 hover:bg-gray-700 cursor-pointer ${
                    selectedFile?.id === node.data.id ? 'bg-blue-600' : ''
                  }`}
                  onClick={() => node.toggle()}
                >
                  <div className="flex items-center">
                    {node.data.type === 'directory' && (
                      <span className="text-gray-400 mr-1">
                        {node.isOpen ? '📂' : '📁'}
                      </span>
                    )}
                    {node.data.type === 'file' && (
                      <span className="text-gray-400 mr-1">📄</span>
                    )}
                    <span className="text-sm text-white truncate">
                      {node.data.name}
                    </span>
                  </div>
                </div>
              )}
            </Tree>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            Aucun fichier trouvé
          </div>
        )}
      </div>
    </div>
  )
}
