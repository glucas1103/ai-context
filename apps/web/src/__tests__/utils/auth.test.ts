import { getUser, signInWithGitHub, signOut, getSession } from '@/utils/auth'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase),
}))

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUser', () => {
    it('returns user when authenticated', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await getUser()

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('returns null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getUser()

      expect(result).toBeNull()
    })

    it('handles authentication errors', async () => {
      const error = new Error('Auth error')
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error,
      })

      await expect(getUser()).rejects.toThrow('Auth error')
    })
  })

  describe('getSession', () => {
    it('returns session when available', async () => {
      const mockSession = {
        access_token: 'token',
        user: { id: '1', email: 'test@example.com' },
      }
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await getSession()

      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      expect(result).toEqual(mockSession)
    })

    it('returns null when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await getSession()

      expect(result).toBeNull()
    })

    it('handles session errors', async () => {
      const error = new Error('Session error')
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error,
      })

      await expect(getSession()).rejects.toThrow('Session error')
    })
  })

  describe('signInWithGitHub', () => {
    it('initiates GitHub OAuth sign in', async () => {
      const mockResponse = { data: {}, error: null }
      mockSupabase.auth.signInWithOAuth.mockResolvedValue(mockResponse)

      await signInWithGitHub()

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: expect.any(String),
        },
      })
    })

    it('handles OAuth sign in errors', async () => {
      const error = new Error('OAuth error')
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: {},
        error,
      })

      await expect(signInWithGitHub()).rejects.toThrow('OAuth error')
    })

    it('uses custom redirect URL when provided', async () => {
      const customRedirect = 'http://localhost:3000/custom'
      const mockResponse = { data: {}, error: null }
      mockSupabase.auth.signInWithOAuth.mockResolvedValue(mockResponse)

      await signInWithGitHub(customRedirect)

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: customRedirect,
        },
      })
    })
  })

  describe('signOut', () => {
    it('signs out user successfully', async () => {
      const mockResponse = { error: null }
      mockSupabase.auth.signOut.mockResolvedValue(mockResponse)

      await signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('handles sign out errors', async () => {
      const error = new Error('Sign out error')
      mockSupabase.auth.signOut.mockResolvedValue({ error })

      await expect(signOut()).rejects.toThrow('Sign out error')
    })
  })
})
