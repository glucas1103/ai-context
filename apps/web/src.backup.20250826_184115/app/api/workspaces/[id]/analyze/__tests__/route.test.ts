import { NextRequest } from 'next/server'
import { POST } from '../route'
import { createClient } from '@/lib/supabase/server'

// Mock des dépendances
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/errors')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock de fetch global
global.fetch = jest.fn()

describe('/api/workspaces/[id]/analyze', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(),
            })),
            single: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
      })),
    }

    mockCreateClient.mockResolvedValue(mockSupabase)
  })

  describe('POST', () => {
    it('should require authentication', async () => {
      // Mock utilisateur non authentifié
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/123/analyze', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })
      
      expect(response.status).toBe(401)
    })

    it('should require GitHub token', async () => {
      // Mock utilisateur authentifié mais sans token GitHub
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/123/analyze', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })
      
      expect(response.status).toBe(401)
    })

    it('should verify workspace ownership', async () => {
      // Mock utilisateur authentifié avec token
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'github-token' } },
        error: null,
      })

      // Mock workspace non trouvé
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Workspace not found'),
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/123/analyze', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) })
      
      expect(response.status).toBe(404)
    })

    it('should successfully analyze repository and create knowledge base', async () => {
      // Mock setup complet
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'github-token' } },
        error: null,
      })

      // Mock workspace valide
      const mockWorkspace = {
        id: 'workspace-123',
        url: 'https://github.com/owner/repo',
        owner_id: 'user-123',
      }

      mockSupabase.from().select().eq().eq().single
        .mockResolvedValueOnce({
          data: mockWorkspace,
          error: null,
        })

      // Mock GitHub API response
      const mockGitHubTree = {
        tree: [
          {
            path: 'src/index.ts',
            type: 'blob',
            sha: 'abc123',
            size: 1024,
            url: 'https://api.github.com/repos/owner/repo/git/blobs/abc123',
          },
          {
            path: 'src',
            type: 'tree',
            sha: 'def456',
            url: 'https://api.github.com/repos/owner/repo/git/trees/def456',
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockGitHubTree),
      })

      // Mock knowledge base creation
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }, // No rows returned
        })

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'kb-123' },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/analyze', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data.knowledgeBaseId).toBe('kb-123')
      expect(responseData.data.fileCount).toBe(2)
    })

    it('should handle GitHub API errors', async () => {
      // Mock setup avec erreur GitHub
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'invalid-token' } },
        error: null,
      })

      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: {
          id: 'workspace-123',
          url: 'https://github.com/owner/repo',
          owner_id: 'user-123',
        },
        error: null,
      })

      // Mock GitHub API error
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/analyze', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(401)
    })

    it('should handle invalid GitHub URLs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { provider_token: 'github-token' } },
        error: null,
      })

      // Mock workspace avec URL invalide
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: {
          id: 'workspace-123',
          url: 'https://invalid-url.com',
          owner_id: 'user-123',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/analyze', {
        method: 'POST',
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(400)
    })
  })
})
