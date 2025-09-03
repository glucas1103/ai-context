import { renderHook, act } from '@testing-library/react';
import { useLocalTreeState } from '../useLocalTreeState';
import { TreeNodeBase } from '@/types/common';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Types de test
interface TestNode extends TreeNodeBase {
  name: string;
  type: 'folder' | 'file';
  parent_id?: string;
  children?: TestNode[];
}

const mockNodes: TestNode[] = [
  {
    id: '1',
    name: 'Dossier 1',
    type: 'folder',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    children: [
      {
        id: '2',
        name: 'Fichier 1',
        type: 'file',
        parent_id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
    ]
  }
];

describe('useLocalTreeState', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('devrait initialiser avec les données fournies', () => {
    const { result } = renderHook(() =>
      useLocalTreeState({
        workspaceId: 'test-workspace',
        initialData: mockNodes,
        storageKey: 'test-tree',
        onError: jest.fn()
      })
    );

    expect(result.current.localData).toEqual(mockNodes);
    expect(result.current.pendingOperations).toEqual([]);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.hasPendingChanges).toBe(false);
  });

  it('devrait restaurer les données depuis localStorage si disponibles', () => {
    const storedData = {
      data: mockNodes,
      timestamp: Date.now(),
      workspaceId: 'test-workspace'
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

    const { result } = renderHook(() =>
      useLocalTreeState({
        workspaceId: 'test-workspace',
        initialData: [],
        storageKey: 'test-tree',
        onError: jest.fn()
      })
    );

    expect(result.current.localData).toEqual(mockNodes);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('tree-state-test-workspace-test-tree');
  });

  it('devrait créer un dossier avec mise à jour optimiste', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'new-folder-id',
        name: 'Nouveau dossier',
        type: 'folder',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(() =>
      useLocalTreeState({
        workspaceId: 'test-workspace',
        initialData: mockNodes,
        storageKey: 'test-tree',
        onError: jest.fn()
      })
    );

    await act(async () => {
      await result.current.createFolder('Nouveau dossier', '1');
    });

    // Vérifier que le dossier a été ajouté localement
    expect(result.current.localData).toHaveLength(1);
    expect(result.current.localData[0].children).toHaveLength(2);
    expect(result.current.localData[0].children![1].name).toBe('Nouveau dossier');
    
    // Vérifier qu'il y a une opération en attente
    expect(result.current.pendingOperations).toHaveLength(1);
    expect(result.current.pendingOperations[0].type).toBe('create');
    expect(result.current.pendingOperations[0].status).toBe('pending');
  });

  it('devrait gérer les erreurs de création et faire un rollback', async () => {
    const mockResponse = {
      success: false,
      error: { message: 'Erreur de création' }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    const onError = jest.fn();
    const { result } = renderHook(() =>
      useLocalTreeState({
        workspaceId: 'test-workspace',
        initialData: mockNodes,
        storageKey: 'test-tree',
        onError
      })
    );

    await act(async () => {
      await result.current.createFolder('Nouveau dossier', '1');
    });

    // Vérifier que l'erreur a été appelée
    expect(onError).toHaveBeenCalledWith('Erreur lors de la création du dossier: Erreur: Erreur de création');
    
    // Vérifier que les données sont revenues à l'état initial
    expect(result.current.localData).toEqual(mockNodes);
    
    // Vérifier qu'il y a une opération en erreur
    expect(result.current.pendingOperations).toHaveLength(1);
    expect(result.current.pendingOperations[0].status).toBe('error');
  });

  it('devrait renommer un élément avec mise à jour optimiste', async () => {
    const mockResponse = { success: true };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(() =>
      useLocalTreeState({
        workspaceId: 'test-workspace',
        initialData: mockNodes,
        storageKey: 'test-tree',
        onError: jest.fn()
      })
    );

    await act(async () => {
      await result.current.renameItem('2', 'Nouveau nom');
    });

    // Vérifier que le nom a été changé localement
    const updatedNode = result.current.findNodeById('2');
    expect(updatedNode?.name).toBe('Nouveau nom');
    
    // Vérifier qu'il y a une opération en attente
    expect(result.current.pendingOperations).toHaveLength(1);
    expect(result.current.pendingOperations[0].type).toBe('update');
  });

  it('devrait supprimer un élément avec mise à jour optimiste', async () => {
    const mockResponse = { success: true };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(() =>
      useLocalTreeState({
        workspaceId: 'test-workspace',
        initialData: mockNodes,
        storageKey: 'test-tree',
        onError: jest.fn()
      })
    );

    await act(async () => {
      await result.current.deleteItem('2');
    });

    // Vérifier que l'élément a été supprimé localement
    const deletedNode = result.current.findNodeById('2');
    expect(deletedNode).toBeNull();
    
    // Vérifier qu'il y a une opération en attente
    expect(result.current.pendingOperations).toHaveLength(1);
    expect(result.current.pendingOperations[0].type).toBe('delete');
  });

  it('devrait déplacer des éléments avec mise à jour optimiste', async () => {
    const mockResponse = { success: true };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockResponse) });

    const { result } = renderHook(() =>
      useLocalTreeState({
        workspaceId: 'test-workspace',
        initialData: mockNodes,
        storageKey: 'test-tree',
        onError: jest.fn()
      })
    );

    await act(async () => {
      await result.current.moveItems(['2'], undefined, 0);
    });

    // Vérifier que l'élément a été déplacé localement
    const movedNode = result.current.findNodeById('2');
    expect(movedNode?.parent_id).toBeUndefined();
    
    // Vérifier qu'il y a des opérations en attente
    expect(result.current.pendingOperations).toHaveLength(1);
    expect(result.current.pendingOperations[0].type).toBe('move');
  });

  it('devrait forcer la synchronisation', async () => {
    const mockResponse = {
      success: true,
      data: mockNodes
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    const { result } = renderHook(() =>
      useLocalTreeState({
        workspaceId: 'test-workspace',
        initialData: mockNodes,
        storageKey: 'test-tree',
        onError: jest.fn()
      })
    );

    await act(async () => {
      await result.current.forceSync();
    });

    // Vérifier que la synchronisation a été effectuée
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.localData).toEqual(mockNodes);
  });

  it('devrait sauvegarder automatiquement dans localStorage', () => {
    const { result } = renderHook(() =>
      useLocalTreeState({
        workspaceId: 'test-workspace',
        initialData: mockNodes,
        storageKey: 'test-tree',
        onError: jest.fn()
      })
    );

    // Vérifier que les données ont été sauvegardées
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
    const storedData = JSON.parse(lastCall[1]);
    
    expect(storedData.data).toEqual(mockNodes);
    expect(storedData.workspaceId).toBe('test-workspace');
    expect(storedData.timestamp).toBeDefined();
  });
});
