import { apiClient, handleApiError, createApiResponse } from '@/utils/api'

// Mock fetch globally
global.fetch = jest.fn()

describe('API Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('apiClient', () => {
    it('makes GET request successfully', async () => {
      const mockResponse = { data: 'test', success: true }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
      })

      const result = await apiClient.get('/test')

      expect(global.fetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: expect.any(AbortSignal),
      })
      expect(result).toEqual({
        data: mockResponse.data,
        success: mockResponse.success,
        status: 200,
        error: undefined,
      })
    })

    it('makes POST request successfully', async () => {
      const mockResponse = { success: true, data: { id: 1 } }
      const postData = { name: 'test' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 201,
      })

      const result = await apiClient.post('/test', postData)

      expect(global.fetch).toHaveBeenCalledWith('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
        signal: expect.any(AbortSignal),
      })
      expect(result).toEqual({
        data: mockResponse.data,
        success: mockResponse.success,
        status: 201,
        error: undefined,
      })
    })

    it('makes PUT request successfully', async () => {
      const mockResponse = { success: true, data: { updated: true } }
      const putData = { id: 1, name: 'updated' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
      })

      const result = await apiClient.put('/test/1', putData)

      expect(global.fetch).toHaveBeenCalledWith('/test/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(putData),
        signal: expect.any(AbortSignal),
      })
      expect(result).toEqual({
        data: mockResponse.data,
        success: mockResponse.success,
        status: 200,
        error: undefined,
      })
    })

    it('makes DELETE request successfully', async () => {
      const mockResponse = { success: true, data: { deleted: true } }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 204,
      })

      const result = await apiClient.delete('/test/1')

      expect(global.fetch).toHaveBeenCalledWith('/test/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: expect.any(AbortSignal),
      })
      expect(result).toEqual({
        data: mockResponse.data,
        success: mockResponse.success,
        status: 204,
        error: undefined,
      })
    })

    it('handles API errors correctly', async () => {
      const errorResponse = { error: 'Not found' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse),
        status: 404,
        statusText: 'Not Found',
      })

      await expect(apiClient.get('/test')).rejects.toThrow('Not found')
    })

    it('handles network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.get('/test')).rejects.toThrow('Network error')
    })

    it('includes authorization header when token is provided', async () => {
      const mockResponse = { data: 'test', success: true }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
      })

      const token = 'test-token'
      await apiClient.get('/test', { headers: { Authorization: `Bearer ${token}` } })

      expect(global.fetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: expect.any(AbortSignal),
      })
    })

    it('handles custom headers', async () => {
      const mockResponse = { data: 'test', success: true }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
      })

      const customHeaders = { 'X-Custom-Header': 'value' }
      await apiClient.get('/test', { headers: customHeaders })

      expect(global.fetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'value',
        },
        signal: expect.any(AbortSignal),
      })
    })
  })

  describe('handleApiError', () => {
    it('handles HTTP error responses', () => {
      const error = new Error('Not Found')
      const result = handleApiError(error)

      expect(result).toBeDefined()
      expect(result.status).toBe(500)
    })

    it('handles network errors', () => {
      const error = new Error('Network error')
      const result = handleApiError(error)

      expect(result).toBeDefined()
      expect(result.status).toBe(500)
    })

    it('handles unknown errors', () => {
      const error = 'Unknown error'
      const result = handleApiError(error)

      expect(result).toBeDefined()
      expect(result.status).toBe(500)
    })
  })

  describe('createApiResponse', () => {
    it('creates success response', () => {
      const data = { id: 1, name: 'test' }
      const result = createApiResponse(true, data)

      expect(result).toEqual({
        success: true,
        data,
        error: undefined,
        status: 200,
      })
    })

    it('creates error response', () => {
      const error = 'Something went wrong'
      const result = createApiResponse(false, undefined, error)

      expect(result).toEqual({
        success: false,
        data: undefined,
        error,
        status: 500,
      })
    })

    it('creates response with custom status', () => {
      const result = createApiResponse(true, { data: 'test' }, undefined, 201)

      expect(result).toEqual({
        success: true,
        data: { data: 'test' },
        error: undefined,
        status: 201,
      })
    })
  })
})
