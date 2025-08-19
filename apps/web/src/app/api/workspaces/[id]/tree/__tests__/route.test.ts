import { GET } from '../route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock error utilities
jest.mock('@/lib/errors', () => ({
  createErrorResponse: jest.fn((message, code, status) => 
    new Response(JSON.stringify({ error: { message, code } }), { status })
  ),
  handleApiError: jest.fn((error) => 
    new Response(JSON.stringify({ error: { message: error.message } }), { status: 500 })
  )
}))

describe('/api/workspaces/[id]/tree', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    mockCreateClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/tree')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(401)
    })

    it('should verify workspace ownership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      // Mock workspace not found or unauthorized
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Workspace not found'),
        })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/tree')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(404)
    })

    it('should return error if knowledge base not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockWorkspace = {
        id: 'workspace-123',
        owner_id: 'user-123',
        name: 'test-repo',
        url: 'https://github.com/user/repo',
      }

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockWorkspace,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Knowledge base not found'),
        })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/tree')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(404)
      const responseData = await response.json()
      expect(responseData.error.message).toContain('Base de connaissances non trouvée')
    })

    it('should successfully return file tree structure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockWorkspace = {
        id: 'workspace-123',
        owner_id: 'user-123',
        name: 'test-repo',
        url: 'https://github.com/user/repo',
      }

      const mockFileStructure = [
        {
          id: 'src',
          name: 'src',
          path: 'src',
          type: 'directory',
          children: [
            {
              id: 'src/index.ts',
              name: 'index.ts',
              path: 'src/index.ts',
              type: 'file',
              size: 1024,
              language: 'typescript',
            },
          ],
        },
        {
          id: 'README.md',
          name: 'README.md',
          path: 'README.md',
          type: 'file',
          size: 512,
          language: 'markdown',
        },
      ]

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockWorkspace,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { structure: mockFileStructure },
          error: null,
        })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/tree')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data.structure).toEqual(mockFileStructure)
      expect(responseData.data.structure).toHaveLength(2)
      expect(responseData.data.structure[0].name).toBe('src')
      expect(responseData.data.structure[0].children).toHaveLength(1)
    })

    it('should handle workspace belonging to different user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockWorkspace = {
        id: 'workspace-123',
        owner_id: 'different-user-456', // Different owner
        name: 'test-repo',
        url: 'https://github.com/user/repo',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockWorkspace,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/tree')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      // Should return 404 because workspace query includes owner_id filter
      expect(response.status).toBe(404)
    })

    it('should handle database connection errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.single.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/workspaces/workspace-123/tree')
      const response = await GET(request, { params: Promise.resolve({ id: 'workspace-123' }) })
      
      expect(response.status).toBe(500)
    })
  })
})
