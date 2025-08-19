import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('/auth/callback GET', () => {
  let mockSupabaseClient: any
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabaseClient = {
      auth: {
        exchangeCodeForSession: jest.fn(),
      },
    }
    
    mockCreateClient.mockResolvedValue(mockSupabaseClient)
    
    // Mock console.error pour éviter les logs durant les tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
  })

  describe('Successful OAuth Flow', () => {
    it('should redirect to /repos on successful auth in development', async () => {
      process.env.NODE_ENV = 'development'
      
      const url = 'http://localhost:3000/auth/callback?code=oauth_code_123'
      const request = new NextRequest(url)
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'token' } },
      })

      const response = await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code_123')
      expect(response.status).toBe(307) // NextResponse.redirect status
      expect(response.headers.get('location')).toBe('http://localhost:3000/repos')
    })

    it('should redirect to custom next path when provided', async () => {
      process.env.NODE_ENV = 'development'
      
      const url = 'http://localhost:3000/auth/callback?code=oauth_code_123&next=/custom-path'
      const request = new NextRequest(url)
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'token' } },
      })

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/custom-path')
    })

    it('should redirect using forwarded host in production', async () => {
      process.env.NODE_ENV = 'production'
      
      const url = 'https://example.com/auth/callback?code=oauth_code_123'
      const request = new NextRequest(url)
      request.headers.set('x-forwarded-host', 'app.example.com')
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'token' } },
      })

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('https://app.example.com/repos')
    })

    it('should fallback to origin if no forwarded host in production', async () => {
      process.env.NODE_ENV = 'production'
      
      const url = 'https://example.com/auth/callback?code=oauth_code_123'
      const request = new NextRequest(url)
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'token' } },
      })

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('https://example.com/repos')
    })
  })

  describe('OAuth Errors', () => {
    it('should redirect to login with auth_error when exchangeCodeForSession fails', async () => {
      const url = 'http://localhost:3000/auth/callback?code=oauth_code_123'
      const request = new NextRequest(url)
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: { message: 'Invalid authorization code' },
        data: null,
      })

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=auth_error')
      expect(console.error).toHaveBeenCalledWith(
        'Erreur lors de l\'échange du code OAuth:', 'Invalid authorization code'
      )
    })

    it('should redirect to login with unexpected_error on exception', async () => {
      const url = 'http://localhost:3000/auth/callback?code=oauth_code_123'
      const request = new NextRequest(url)
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockRejectedValue(
        new Error('Network error')
      )

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=unexpected_error')
      expect(console.error).toHaveBeenCalledWith(
        'Erreur inattendue lors du callback OAuth:', expect.any(Error)
      )
    })

    it('should redirect to login with no_code when code parameter is missing', async () => {
      const url = 'http://localhost:3000/auth/callback'
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=no_code')
      expect(console.error).toHaveBeenCalledWith('Aucun code OAuth reçu dans le callback')
    })

    it('should redirect to login with no_code when code parameter is empty', async () => {
      const url = 'http://localhost:3000/auth/callback?code='
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=no_code')
    })

    it('should redirect to login with no_code when code parameter is null', async () => {
      const url = 'http://localhost:3000/auth/callback?code=null'
      const request = new NextRequest(url)

      // Mock searchParams.get to return null for 'code'
      const originalURL = global.URL
      global.URL = jest.fn().mockImplementation((url) => {
        const mockURL = new originalURL(url)
        mockURL.searchParams.get = jest.fn().mockReturnValue(null)
        return mockURL
      }) as any

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=no_code')

      global.URL = originalURL
    })
  })

  describe('Error Handling with Different Origins', () => {
    it('should handle errors with custom origin', async () => {
      const url = 'https://custom-domain.com/auth/callback?code=oauth_code_123'
      const request = new NextRequest(url)
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: { message: 'Invalid code' },
        data: null,
      })

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('https://custom-domain.com/login?error=auth_error')
    })

    it('should handle no_code error with custom origin', async () => {
      const url = 'https://custom-domain.com/auth/callback'
      const request = new NextRequest(url)

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('https://custom-domain.com/login?error=no_code')
    })
  })

  describe('URL Parameter Handling', () => {
    it('should handle multiple query parameters correctly', async () => {
      process.env.NODE_ENV = 'development'
      
      const url = 'http://localhost:3000/auth/callback?code=oauth_code_123&next=/dashboard&state=random'
      const request = new NextRequest(url)
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'token' } },
      })

      const response = await GET(request)

      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code_123')
      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    })

    it('should handle encoded next parameter', async () => {
      process.env.NODE_ENV = 'development'
      
      const url = 'http://localhost:3000/auth/callback?code=oauth_code_123&next=%2Fuser%2Fprofile'
      const request = new NextRequest(url)
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'token' } },
      })

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/user/profile')
    })

    it('should default to /repos when next parameter is empty', async () => {
      process.env.NODE_ENV = 'development'
      
      const url = 'http://localhost:3000/auth/callback?code=oauth_code_123&next='
      const request = new NextRequest(url)
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'token' } },
      })

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('http://localhost:3000/repos')
    })
  })

  describe('Environment Handling', () => {
    it('should handle production environment with forwarded host', async () => {
      process.env.NODE_ENV = 'production'
      
      const url = 'https://localhost/auth/callback?code=oauth_code_123'
      const request = new NextRequest(url)
      request.headers.set('x-forwarded-host', 'myapp.vercel.app')
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'token' } },
      })

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('https://myapp.vercel.app/repos')
    })

    it('should handle undefined NODE_ENV as non-development', async () => {
      delete process.env.NODE_ENV
      
      const url = 'https://localhost/auth/callback?code=oauth_code_123'
      const request = new NextRequest(url)
      request.headers.set('x-forwarded-host', 'myapp.vercel.app')
      
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { access_token: 'token' } },
      })

      const response = await GET(request)

      expect(response.headers.get('location')).toBe('https://myapp.vercel.app/repos')
    })
  })
})
