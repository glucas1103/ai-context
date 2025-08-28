import { GET } from '@/app/api/github/repos/route'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}))

// Mock GitHubAPI
jest.mock('@/lib/supabase/github-api', () => ({
  GitHubAPI: jest.fn().mockImplementation(() => ({
    getUserRepos: jest.fn()
  }))
}))

describe('GitHub API Routes', () => {
  let mockSupabase: any
  let mockAuth: any
  let mockGitHubAPI: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mocks
    mockAuth = {
      getUser: jest.fn()
    }
    
    mockSupabase = {
      auth: mockAuth
    }
    
    mockGitHubAPI = {
      getUserRepos: jest.fn()
    }
    
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
    
    const { GitHubAPI } = require('@/lib/supabase/github-api')
    GitHubAPI.mockImplementation(() => mockGitHubAPI)
  })

  describe('GET /api/github/repos', () => {
    it('returns repos for authenticated user with valid GitHub token', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockGitHubRepos = [
        {
          id: 1,
          name: 'repo1',
          full_name: 'user/repo1',
          description: 'Test repo 1',
          html_url: 'https://github.com/user/repo1',
          private: false,
          fork: false,
          stargazers_count: 10,
          language: 'JavaScript',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'repo2',
          full_name: 'user/repo2',
          description: 'Test repo 2',
          html_url: 'https://github.com/user/repo2',
          private: true,
          fork: false,
          stargazers_count: 5,
          language: 'TypeScript',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockGitHubAPI.getUserRepos.mockResolvedValue(mockGitHubRepos)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.repos).toHaveLength(2)
      expect(data.data.total).toBe(2)
      expect(data.data.repos[0].name).toBe('repo1')
      expect(data.data.repos[1].name).toBe('repo2')
    })

    it('returns 401 if user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Non authentifié')
    })

    it('returns 401 if auth error occurs', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error')
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Non authentifié')
    })

    it('returns 401 if no provider token', async () => {
      const mockUser = { id: 'user-1' }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockGitHubAPI.getUserRepos.mockRejectedValue(
        new Error('GitHub token not available')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Token GitHub non disponible. Veuillez vous reconnecter.')
      expect(data.requiresReauth).toBe(true)
    })

    it('returns 401 if session error occurs', async () => {
      const mockUser = { id: 'user-1' }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockGitHubAPI.getUserRepos.mockRejectedValue(
        new Error('GitHub token not available')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Token GitHub non disponible. Veuillez vous reconnecter.')
    })

    it('handles GitHub 401 error (invalid token)', async () => {
      const mockUser = { id: 'user-1' }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockGitHubAPI.getUserRepos.mockRejectedValue(
        new Error('GitHub token expired')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Token GitHub expiré. Veuillez vous reconnecter.')
      expect(data.requiresReauth).toBe(true)
    })

    it('handles GitHub 403 error (rate limit)', async () => {
      const mockUser = { id: 'user-1' }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockGitHubAPI.getUserRepos.mockRejectedValue(
        new Error('rate limit exceeded')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Rate limit GitHub atteint. Veuillez réessayer plus tard.')
    })

    it('handles other GitHub API errors', async () => {
      const mockUser = { id: 'user-1' }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockGitHubAPI.getUserRepos.mockRejectedValue(
        new Error('GitHub API error')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Erreur lors de la récupération des dépôts')
    })

    it('handles network errors', async () => {
      const mockUser = { id: 'user-1' }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockGitHubAPI.getUserRepos.mockRejectedValue(
        new Error('Network error')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Erreur lors de la récupération des dépôts')
    })

    it('handles empty repos array', async () => {
      const mockUser = { id: 'user-1' }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockGitHubAPI.getUserRepos.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.repos).toEqual([])
      expect(data.data.total).toBe(0)
    })

    it('handles repos with null values properly', async () => {
      const mockUser = { id: 'user-1' }
      const mockGitHubRepos = [
        {
          id: 1,
          name: 'repo1',
          full_name: 'user/repo1',
          description: null,
          html_url: 'https://github.com/user/repo1',
          private: false,
          fork: false,
          stargazers_count: 10,
          language: null,
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockGitHubAPI.getUserRepos.mockResolvedValue(mockGitHubRepos)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.repos[0].description).toBe(null)
      expect(data.data.repos[0].language).toBe(null)
    })
  })
})
