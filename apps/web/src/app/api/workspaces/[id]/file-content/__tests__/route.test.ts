import { GET } from '../route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GitHubAPI, parseGitHubUrl } from '@/lib/server/github'

// Mock Supabase
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock GitHub utilities
jest.mock('@/lib/server/github')
const mockParseGitHubUrl = parseGitHubUrl as jest.MockedFunction<typeof parseGitHubUrl>
const mockGitHubAPI = GitHubAPI as jest.MockedClass<typeof GitHubAPI>

// Mock error utilities
jest.mock('@/lib/errors', () => ({
  createErrorResponse: jest.fn((message, code, status) => 
    new Response(JSON.stringify({ error: { message, code } }), { status })
  ),
  handleApiError: jest.fn((error) => 
    new Response(JSON.stringify({ error: { message: error.message } }), { status: 500 })
  )
}))

describe('/api/workspaces/[id]/file-content', () => {
  let mockSupabase: any
  let mockGitHubInstance: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    mockGitHubInstance = {
      getFileContent: jest.fn(),
    }

    mockCreateClient.mockResolvedValue(mockSupabase)
    mockGitHubAPI.mockImplementation(() => mockGitHubInstance)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should require path parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error.message).toContain('Paramètre path requis')
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content?path=src/index.ts')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(401)
    })

    it('should require GitHub token', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content?path=src/index.ts')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error.message).toContain('Token GitHub non disponible')
    })

    it('should verify workspace ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'github-token' } },
        error: null,
      })

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Workspace not found'),
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content?path=src/index.ts')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(404)
    })

    it('should handle invalid GitHub URL', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'github-token' } },
        error: null,
      })

      const mockWorkspace = {
        id: 'workspace-123',
        owner_id: 'user-123',
        name: 'test-repo',
        url: 'invalid-url',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockWorkspace,
        error: null,
      })

      mockParseGitHubUrl.mockReturnValue(null)

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content?path=src/index.ts')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.error.message).toContain('URL GitHub invalide')
    })

    it('should successfully return file content', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'github-token' } },
        error: null,
      })

      const mockWorkspace = {
        id: 'workspace-123',
        owner_id: 'user-123',
        name: 'test-repo',
        url: 'https://github.com/user/repo',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockWorkspace,
        error: null,
      })

      mockParseGitHubUrl.mockReturnValue({
        owner: 'user',
        repo: 'repo',
      })

      const mockFileContent = `export function hello(name: string): string {
  return \`Hello, \${name}!\`
}

console.log(hello('World'))`

      mockGitHubInstance.getFileContent.mockResolvedValue(mockFileContent)

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content?path=src/index.ts')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data.path).toBe('src/index.ts')
      expect(responseData.data.content).toBe(mockFileContent)
      expect(mockGitHubInstance.getFileContent).toHaveBeenCalledWith('user', 'repo', 'src/index.ts')
    })

    it('should handle GitHub 404 errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'github-token' } },
        error: null,
      })

      const mockWorkspace = {
        id: 'workspace-123',
        owner_id: 'user-123',
        name: 'test-repo',
        url: 'https://github.com/user/repo',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockWorkspace,
        error: null,
      })

      mockParseGitHubUrl.mockReturnValue({
        owner: 'user',
        repo: 'repo',
      })

      mockGitHubInstance.getFileContent.mockRejectedValue(new Error('GitHub API error: 404 Not Found'))

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content?path=nonexistent.ts')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error.message).toContain('Fichier non trouvé')
    })

    it('should handle GitHub 401 token errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'invalid-token' } },
        error: null,
      })

      const mockWorkspace = {
        id: 'workspace-123',
        owner_id: 'user-123',
        name: 'test-repo',
        url: 'https://github.com/user/repo',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockWorkspace,
        error: null,
      })

      mockParseGitHubUrl.mockReturnValue({
        owner: 'user',
        repo: 'repo',
      })

      mockGitHubInstance.getFileContent.mockRejectedValue(new Error('GitHub API error: 401 Unauthorized'))

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content?path=src/index.ts')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.error.message).toContain('Token GitHub expiré ou invalide')
    })

    it('should handle GitHub rate limit errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'github-token' } },
        error: null,
      })

      const mockWorkspace = {
        id: 'workspace-123',
        owner_id: 'user-123',
        name: 'test-repo',
        url: 'https://github.com/user/repo',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockWorkspace,
        error: null,
      })

      mockParseGitHubUrl.mockReturnValue({
        owner: 'user',
        repo: 'repo',
      })

      mockGitHubInstance.getFileContent.mockRejectedValue(new Error('GitHub API error: 403 Forbidden'))

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content?path=src/index.ts')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(429)
      const responseData = await response.json()
      expect(responseData.error.message).toContain('Rate limit GitHub atteint')
    })

    it('should handle general GitHub API errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'github-token' } },
        error: null,
      })

      const mockWorkspace = {
        id: 'workspace-123',
        owner_id: 'user-123',
        name: 'test-repo',
        url: 'https://github.com/user/repo',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockWorkspace,
        error: null,
      })

      mockParseGitHubUrl.mockReturnValue({
        owner: 'user',
        repo: 'repo',
      })

      mockGitHubInstance.getFileContent.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/file-content?path=src/index.ts')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error.message).toContain('Erreur lors de la récupération du fichier')
    })
  })
})
