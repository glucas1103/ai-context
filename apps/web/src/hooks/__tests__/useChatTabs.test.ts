import { renderHook, act } from '@testing-library/react'
import { useChatTabs } from '../useChatTabs'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ 
          data: { id: 'test-session-1', title: 'Test Session' }, 
          error: null 
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

describe('useChatTabs', () => {
  const workspaceId = 'test-workspace'
  const userId = 'test-user'

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn()
    } as any
  })

  it('devrait initialiser avec un état vide', () => {
    const { result } = renderHook(() => useChatTabs(workspaceId, userId))
    
    expect(result.current.tabs).toEqual([])
    expect(result.current.activeTabId).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('devrait pouvoir ajouter un nouvel onglet', async () => {
    const { result } = renderHook(() => useChatTabs(workspaceId, userId))
    
    await act(async () => {
      const sessionId = await result.current.addTab(
        { workspacePath: '/test' }, 
        'analysis'
      )
      expect(sessionId).toBe('test-session-1')
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('chat_sessions')
  })

  it('devrait pouvoir changer d\'onglet actif', async () => {
    const { result } = renderHook(() => useChatTabs(workspaceId, userId))
    
    await act(async () => {
      await result.current.switchTab('test-tab-id')
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('chat_sessions')
  })

  it('devrait pouvoir fermer un onglet', async () => {
    const { result } = renderHook(() => useChatTabs(workspaceId, userId))
    
    await act(async () => {
      await result.current.closeTab('test-tab-id')
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('chat_sessions')
  })

  it('devrait pouvoir renommer un onglet', async () => {
    const { result } = renderHook(() => useChatTabs(workspaceId, userId))
    
    await act(async () => {
      await result.current.renameTab('test-tab-id', 'Nouveau nom')
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('chat_sessions')
  })

  it('devrait pouvoir marquer un onglet comme modifié', async () => {
    const { result } = renderHook(() => useChatTabs(workspaceId, userId))
    
    await act(async () => {
      await result.current.markTabDirty('test-tab-id', true)
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('chat_sessions')
  })

  it('devrait gérer les erreurs lors des opérations', async () => {
    // Mock une erreur Supabase
    mockSupabase.from = jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Erreur de test' } 
          }))
        }))
      }))
    }))

    const { result } = renderHook(() => useChatTabs(workspaceId, userId))
    
    await act(async () => {
      try {
        await result.current.addTab({ workspacePath: '/test' }, 'analysis')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    expect(result.current.error).toBeDefined()
  })
})
