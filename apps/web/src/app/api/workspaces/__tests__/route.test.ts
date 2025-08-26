import { API_ENDPOINTS } from "@/constants/api";
import { POST, GET } from '../route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock error utilities
jest.mock('@/utils/api', () => ({
  createErrorResponse: jest.fn((message, code, status) => 
    new Response(JSON.stringify({ error: { message, code } }), { status })
  ),
  handleApiError: jest.fn((error) => 
    new Response(JSON.stringify({ error: { message: error.message } }), { status: 500 })
  )
}))

describe('/api/workspaces', () => {
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
      insert: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }

    mockCreateClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/workspaces', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: 'test', url: 'https://github.com/user/repo' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should require name and url', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }), // Missing URL
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return existing workspace if found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const existingWorkspace = {
        id: 'workspace-123',
        name: 'existing-repo',
        url: 'https://github.com/user/repo',
        owner_id: 'user-123',
      }

      mockSupabase.single.mockResolvedValue({
        data: existingWorkspace,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'test-repo', 
          url: 'https://github.com/user/repo' 
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data.id).toBe('workspace-123')
      expect(responseData.message).toContain('existant')
    })

    it('should create new workspace when none exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      // Mock no existing workspace found
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }, // No rows returned
        })
        .mockResolvedValueOnce({
          data: {
            id: 'new-workspace-123',
            name: 'new-repo',
            url: 'https://github.com/user/new-repo',
            owner_id: 'user-123',
          },
          error: null,
        })

      const request = new NextRequest('http://localhost:3000/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'new-repo', 
          url: 'https://github.com/user/new-repo' 
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data.id).toBe('new-workspace-123')
      expect(responseData.message).toContain('créé')
    })

    it('should handle database errors during creation', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' },
        })
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Database error'),
        })

      const request = new NextRequest('http://localhost:3000/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'test-repo', 
          url: 'https://github.com/user/repo' 
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })

  describe('GET /api/workspaces', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces')
      const response = await GET(request)
      expect(response.status).toBe(401)
    })

    it('should return user workspaces', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockWorkspaces = [
        {
          id: 'workspace-1',
          name: 'repo-1',
          url: 'https://github.com/user/repo-1',
          owner_id: 'user-123',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'workspace-2',
          name: 'repo-2',
          url: 'https://github.com/user/repo-2',
          owner_id: 'user-123',
          created_at: '2024-01-14T10:00:00Z',
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockWorkspaces,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data).toHaveLength(2)
      expect(responseData.data[0].name).toBe('repo-1')
    })

    it('should return empty array when no workspaces', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual([])
    })

    it('should handle database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabase.order.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces')
      const response = await GET(request)
      expect(response.status).toBe(500)
    })
  })
})
