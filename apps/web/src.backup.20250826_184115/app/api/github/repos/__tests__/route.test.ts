import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock global fetch
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('/api/github/repos GET', () => {
  let mockSupabaseClient: any
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn(),
      },
    }
    
    mockCreateClient.mockResolvedValue(mockSupabaseClient)
    mockRequest = new NextRequest('http://localhost:3000/api/github/repos')
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('User not found'),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('auth_required')
      expect(data.error.message).toBe('Non authentifié')
    })

    it('should return 401 if auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error'),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('auth_required')
    })

    it('should return 401 if no provider token', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: null } },
        error: null,
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('github_token_missing')
      expect(data.error.message).toBe('Token GitHub non disponible')
    })

    it('should return 401 if session error occurs', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Session error'),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('github_token_missing')
    })
  })

  describe('GitHub API Integration', () => {
    beforeEach(() => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { 
        provider_token: 'github_token_123',
        user: mockUser 
      }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })
    })

    it('should successfully fetch and format repos', async () => {
      const mockGitHubRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          description: 'Test repository',
          html_url: 'https://github.com/user/test-repo',
          private: false,
          owner: {
            login: 'user',
            avatar_url: 'https://github.com/user.png',
          },
          updated_at: '2023-01-01T00:00:00Z',
          language: 'TypeScript',
          stargazers_count: 10,
          size: 1024,
        },
        {
          id: 2,
          name: 'private-repo',
          full_name: 'user/private-repo',
          description: null,
          html_url: 'https://github.com/user/private-repo',
          private: true,
          owner: {
            login: 'user',
            avatar_url: 'https://github.com/user.png',
          },
          updated_at: '2023-01-02T00:00:00Z',
          language: null,
          stargazers_count: 0,
          size: 512,
        },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGitHubRepos),
      } as Response)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(2)
      expect(data.repos).toHaveLength(2)
      
      // Vérifier le formatage des données
      expect(data.repos[0]).toEqual({
        id: 1,
        name: 'test-repo',
        fullName: 'user/test-repo',
        description: 'Test repository',
        url: 'https://github.com/user/test-repo',
        isPrivate: false,
        owner: {
          login: 'user',
          avatarUrl: 'https://github.com/user.png',
        },
        updatedAt: '2023-01-01T00:00:00Z',
        language: 'TypeScript',
        stars: 10,
        size: 1024,
      })

      // Vérifier les headers de la requête GitHub
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/user/repos?sort=updated&per_page=100',
        {
          headers: {
            'Authorization': 'Bearer github_token_123',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AIcontext-App',
          },
        }
      )
    })

    it('should handle GitHub 401 error (invalid token)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error.code).toBe('github_token_invalid')
      expect(data.error.message).toBe('Token GitHub expiré ou invalide')
    })

    it('should handle GitHub 403 error (rate limit)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error.code).toBe('github_rate_limit')
      expect(data.error.message).toBe('Rate limit GitHub atteint')
    })

    it('should handle other GitHub API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error.code).toBe('github_api_error')
      expect(data.error.message).toBe('Erreur lors de la récupération des dépôts')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error.code).toBe('internal_error')
      expect(data.error.message).toBe('Erreur interne du serveur')
    })

    it('should handle empty repos array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      } as Response)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(0)
      expect(data.repos).toHaveLength(0)
    })

    it('should handle repos with null values properly', async () => {
      const mockGitHubRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          description: null,
          html_url: 'https://github.com/user/test-repo',
          private: false,
          owner: {
            login: 'user',
            avatar_url: 'https://github.com/user.png',
          },
          updated_at: '2023-01-01T00:00:00Z',
          language: null,
          stargazers_count: 0,
          size: 0,
        },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGitHubRepos),
      } as Response)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.repos[0].description).toBe(null)
      expect(data.repos[0].language).toBe(null)
      expect(data.repos[0].stars).toBe(0)
    })
  })

  describe('Error Logging', () => {
    beforeEach(() => {
      // Mock console.error pour éviter les logs durant les tests
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should log GitHub API errors', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { provider_token: 'github_token_123' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      await GET()

      expect(console.error).toHaveBeenCalledWith(
        'Erreur API GitHub:', 500, 'Internal Server Error'
      )
    })

    it('should log unexpected errors', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { provider_token: 'github_token_123' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const networkError = new Error('Network failure')
      mockFetch.mockRejectedValue(networkError)

      await GET()

      expect(console.error).toHaveBeenCalledWith(
        'Erreur inattendue lors de la récupération des dépôts:', networkError
      )
    })
  })
})
