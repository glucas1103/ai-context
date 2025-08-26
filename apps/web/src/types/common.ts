// Types communs partagés entre les différents systèmes

export interface TreeNodeBase {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory' | 'folder'; // 'folder' = 'directory' pour documentation
  children?: TreeNodeBase[];
}
