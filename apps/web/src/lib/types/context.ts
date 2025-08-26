// Types centralisés pour le contexte des workspaces
import { TreeNodeBase } from './common'

export interface FileTreeNode extends TreeNodeBase {
  type: 'file' | 'directory'
  size?: number
  sha?: string
  language?: string
  children?: FileTreeNode[]
  url?: string
  download_url?: string
}

export interface WorkspaceData {
  id: string
  name: string
  url: string
  created_at: string
}

// Props interfaces pour les composants
export interface TreeContextProps {
  fileTree: FileTreeNode[]
  selectedFile: FileTreeNode | null
  onFileSelect: (file: FileTreeNode) => void
  isLoading: boolean
  treeHeight: number
}

export interface FileContextProps {
  selectedFile: FileTreeNode | null
  fileContent: string
  isLoadingContent: boolean
}

export interface ChatContextProps {
  selectedFile: FileTreeNode | null
  workspace: WorkspaceData | null
}
