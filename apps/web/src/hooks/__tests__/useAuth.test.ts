import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { createClient } from '@/lib/supabase/client'

// Mock du client Supabase
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Mock du router Next.js
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

describe('useAuth Hook', () => {
  let mockUnsubscribe: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUnsubscribe = jest.fn()
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })
  })

  describe('Initial State', () => {
    it('should start with loading state', () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.error).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('User Authentication State', () => {
    it('should set user when authenticated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.error).toBe(null)
      })
    })

    it('should handle auth session missing without error', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth session missing!' },
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toBe(null)
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.error).toBe(null)
      })
    })

    it('should set error for other auth errors', async () => {
      const errorMessage = 'Invalid token'
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: errorMessage },
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toBe(null)
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.error).toBe(errorMessage)
      })
    })
  })

  describe('Auth State Changes', () => {
    it('should handle SIGNED_IN event', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { user: mockUser, access_token: 'token' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      let authChangeCallback: (event: string, session: any) => void

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authChangeCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simuler l'événement SIGNED_IN
      act(() => {
        authChangeCallback('SIGNED_IN', mockSession)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(mockPush).toHaveBeenCalledWith('/repos')
    })

    it('should handle SIGNED_OUT event', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      let authChangeCallback: (event: string, session: any) => void

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authChangeCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simuler l'événement SIGNED_OUT
      act(() => {
        authChangeCallback('SIGNED_OUT', null)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  describe('Sign In with GitHub', () => {
    it('should successfully sign in with GitHub', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://github.com/oauth' },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signInWithGitHub()
      })

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          scopes: 'repo read:user read:org',
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    })

    it('should handle sign in error', async () => {
      const errorMessage = 'OAuth error'
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: errorMessage },
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signInWithGitHub()
      })

      expect(result.current.error).toBe('Erreur lors de la connexion avec GitHub')
      expect(result.current.loading).toBe(false)
    })

    it('should handle unexpected error during sign in', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      mockSupabaseClient.auth.signInWithOAuth.mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signInWithGitHub()
      })

      expect(result.current.error).toBe('Une erreur inattendue s\'est produite')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Sign Out', () => {
    it('should successfully sign out', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should handle sign out error', async () => {
      const errorMessage = 'Sign out failed'
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: errorMessage },
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(result.current.error).toBe('Erreur lors de la déconnexion')
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const { unmount } = renderHook(() => useAuth())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})
