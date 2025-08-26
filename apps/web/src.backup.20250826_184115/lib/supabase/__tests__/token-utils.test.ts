import { createClient } from '@supabase/supabase-js'
import { 
  isTokenExpired, 
  refreshTokenIfNeeded, 
  handleTokenError, 
  getValidProviderToken,
  callGitHubAPI 
} from '../token-utils'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    refreshSession: jest.fn(),
    getUser: jest.fn()
  }
} as any

describe('Token Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isTokenExpired', () => {
    it('should return true for session without expires_at', () => {
      const session = { expires_at: null }
      expect(isTokenExpired(session)).toBe(true)
    })

    it('should return true for session expiring in less than 5 minutes', () => {
      const now = Date.now()
      const expiresAt = new Date(now + 2 * 60 * 1000) // 2 minutes from now
      const session = { expires_at: expiresAt.toISOString() }
      expect(isTokenExpired(session)).toBe(true)
    })

    it('should return false for session expiring in more than 5 minutes', () => {
      const now = Date.now()
      const expiresAt = new Date(now + 10 * 60 * 1000) // 10 minutes from now
      const session = { expires_at: expiresAt.toISOString() }
      expect(isTokenExpired(session)).toBe(false)
    })
  })

  describe('refreshTokenIfNeeded', () => {
    it('should return existing token if not expired', async () => {
      const now = Date.now()
      const expiresAt = new Date(now + 10 * 60 * 1000)
      const session = { 
        expires_at: expiresAt.toISOString(),
        provider_token: 'existing-token'
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session }
      })

      const result = await refreshTokenIfNeeded(mockSupabase)
      expect(result).toBe('existing-token')
      expect(mockSupabase.auth.refreshSession).not.toHaveBeenCalled()
    })

    it('should refresh token if expired', async () => {
      const now = Date.now()
      const expiresAt = new Date(now + 2 * 60 * 1000) // 2 minutes from now
      const session = { 
        expires_at: expiresAt.toISOString(),
        provider_token: 'old-token'
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session }
      })

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { 
          session: { 
            provider_token: 'new-token' 
          } 
        },
        error: null
      })

      const result = await refreshTokenIfNeeded(mockSupabase)
      expect(result).toBe('new-token')
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })

    it('should throw error if refresh fails', async () => {
      const now = Date.now()
      const expiresAt = new Date(now + 2 * 60 * 1000)
      const session = { 
        expires_at: expiresAt.toISOString(),
        provider_token: 'old-token'
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session }
      })

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: null,
        error: { message: 'Refresh failed' }
      })

      await expect(refreshTokenIfNeeded(mockSupabase)).rejects.toThrow('Failed to refresh token')
    })
  })

  describe('handleTokenError', () => {
    it('should refresh token for 401 errors', async () => {
      const error = { status: 401, message: 'Unauthorized' }
      
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { 
          session: { 
            provider_token: 'new-token' 
          } 
        },
        error: null
      })

      const result = await handleTokenError(mockSupabase, error)
      expect(result).toBe('new-token')
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })

    it('should throw error if refresh fails for 401', async () => {
      const error = { status: 401, message: 'Unauthorized' }
      
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: null,
        error: { message: 'Refresh failed' }
      })

      await expect(handleTokenError(mockSupabase, error))
        .rejects.toThrow('GitHub token has been revoked. Please reconnect your GitHub account.')
    })

    it('should throw original error for non-token errors', async () => {
      const error = { status: 500, message: 'Server error' }
      
      await expect(handleTokenError(mockSupabase, error)).rejects.toEqual(error)
    })
  })

  describe('getValidProviderToken', () => {
    it('should return provider token from session', async () => {
      const session = { provider_token: 'valid-token' }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null
      })

      const result = await getValidProviderToken(mockSupabase)
      expect(result).toBe('valid-token')
    })

    it('should refresh session if no provider token', async () => {
      const session = { provider_token: null }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null
      })

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { 
          session: { 
            provider_token: 'refreshed-token' 
          } 
        },
        error: null
      })

      const result = await getValidProviderToken(mockSupabase)
      expect(result).toBe('refreshed-token')
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })

    it('should return null if no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await getValidProviderToken(mockSupabase)
      expect(result).toBeNull()
    })

    it('should return null if session error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' }
      })

      const result = await getValidProviderToken(mockSupabase)
      expect(result).toBeNull()
    })
  })

  describe('callGitHubAPI', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    it('should make API call with valid token', async () => {
      const session = { provider_token: 'valid-token' }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null
      })

      const mockResponse = { ok: true, json: jest.fn() }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await callGitHubAPI(mockSupabase, 'https://api.github.com/test')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          })
        })
      )
    })

    it('should retry with refreshed token on 401', async () => {
      const session = { provider_token: 'old-token' }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session },
        error: null
      })

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { 
          session: { 
            provider_token: 'new-token' 
          } 
        },
        error: null
      })

      const mockResponse1 = { ok: false, status: 401 }
      const mockResponse2 = { ok: true, json: jest.fn() }
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      await callGitHubAPI(mockSupabase, 'https://api.github.com/test')

      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled()
    })

    it('should throw error if no token available', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      await expect(callGitHubAPI(mockSupabase, 'https://api.github.com/test'))
        .rejects.toThrow('GitHub token not available')
    })
  })
})
