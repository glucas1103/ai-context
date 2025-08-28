import { GET, POST } from '@/app/api/workspaces/route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('Workspaces API Routes', () => {
  let mockSupabase: any
  let mockAuth: any
  let mockFrom: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mocks
    mockAuth = {
      getUser: jest.fn()
    }
    
    // Create a mock that properly handles the chain
    const createMockChain = () => {
      const chain = {
        select: jest.fn(),
        insert: jest.fn(),
        eq: jest.fn(),
        single: jest.fn(),
        order: jest.fn()
      }
      
      // Make each method return the chain for chaining
      chain.select.mockReturnValue(chain)
      chain.insert.mockReturnValue(chain)
      chain.eq.mockReturnValue(chain)
      chain.single.mockReturnValue(chain)
      chain.order.mockReturnValue(chain)
      
      return chain
    }
    
    mockFrom = createMockChain()
    
    mockSupabase = {
      auth: mockAuth,
      from: jest.fn(() => mockFrom)
    }
    
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  describe('GET /api/workspaces', () => {
    it('returns workspaces for authenticated user', async () => {
      const mockUser = { id: 'user-1' }
      const mockWorkspaces = [
        { id: 'ws-1', name: 'Workspace 1', url: 'https://github.com/test/repo1' },
        { id: 'ws-2', name: 'Workspace 2', url: 'https://github.com/test/repo2' }
      ]

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock the final result of the chain
      mockFrom.order.mockResolvedValue({
        data: mockWorkspaces,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockWorkspaces)
      expect(mockSupabase.from).toHaveBeenCalledWith('workspaces')
    })

    it('returns 401 when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Non authentifié')
    })

    it('handles database errors', async () => {
      const mockUser = { id: 'user-1' }
      
      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockFrom.order.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/workspaces')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/workspaces', () => {
    it('validates required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }) // Missing url
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Nom et URL requis')
    })

    it('validates URL format', async () => {
      const request = new NextRequest('http://localhost:3000/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'Test',
          url: 'invalid-url'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
