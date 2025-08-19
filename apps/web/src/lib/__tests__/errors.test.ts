import { createErrorResponse, handleApiError, AppError, ERROR_CODES } from '../errors'

describe('Error Utilities', () => {
  beforeEach(() => {
    // Mock console.error pour éviter les logs durant les tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('AppError Class', () => {
    it('should create AppError with all properties', () => {
      const error = new AppError('Test error', 'test_code', 400, { extra: 'data' })

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('test_code')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ extra: 'data' })
      expect(error.name).toBe('AppError')
    })

    it('should create AppError with default status code', () => {
      const error = new AppError('Test error', 'test_code')

      expect(error.statusCode).toBe(500)
      expect(error.details).toBeUndefined()
    })
  })

  describe('createErrorResponse', () => {
    it('should create error response with all parameters', async () => {
      const response = createErrorResponse('Test error', 'test_code', 400, { extra: 'data' })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: {
          message: 'Test error',
          code: 'test_code',
          details: { extra: 'data' }
        }
      })
    })

    it('should create error response with default status code', async () => {
      const response = createErrorResponse('Test error', 'test_code')
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error.details).toBeUndefined()
    })

    it('should log server errors (5xx)', () => {
      createErrorResponse('Server error', 'server_error', 500)

      expect(console.error).toHaveBeenCalledWith('Server Error:', {
        message: 'Server error',
        code: 'server_error',
        statusCode: 500,
        details: undefined,
        timestamp: expect.any(String)
      })
    })

    it('should not log client errors (4xx)', () => {
      createErrorResponse('Client error', 'client_error', 400)

      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('handleApiError', () => {
    it('should handle AppError correctly', async () => {
      const appError = new AppError('Custom error', 'custom_code', 422, { field: 'value' })
      const response = handleApiError(appError)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data).toEqual({
        error: {
          message: 'Custom error',
          code: 'custom_code',
          details: { field: 'value' }
        }
      })
    })

    it('should handle standard Error in development', async () => {
      process.env.NODE_ENV = 'development'
      
      const standardError = new Error('Standard error message')
      const response = handleApiError(standardError)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: {
          message: 'Erreur interne du serveur',
          code: 'internal_error',
          details: 'Standard error message'
        }
      })
    })

    it('should handle standard Error in production', async () => {
      process.env.NODE_ENV = 'production'
      
      const standardError = new Error('Standard error message')
      const response = handleApiError(standardError)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: {
          message: 'Erreur interne du serveur',
          code: 'internal_error',
          details: undefined
        }
      })
    })

    it('should handle unknown error types', async () => {
      const unknownError = 'String error'
      const response = handleApiError(unknownError)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: {
          message: 'Erreur inconnue',
          code: 'unknown_error'
        }
      })
    })

    it('should handle null/undefined errors', async () => {
      const response1 = handleApiError(null)
      const response2 = handleApiError(undefined)
      
      const data1 = await response1.json()
      const data2 = await response2.json()

      expect(data1.error.message).toBe('Erreur inconnue')
      expect(data2.error.message).toBe('Erreur inconnue')
    })
  })

  describe('ERROR_CODES', () => {
    it('should contain all expected error codes', () => {
      expect(ERROR_CODES.AUTH_REQUIRED).toBe('auth_required')
      expect(ERROR_CODES.AUTH_INVALID).toBe('auth_invalid')
      expect(ERROR_CODES.AUTH_EXPIRED).toBe('auth_expired')
      
      expect(ERROR_CODES.GITHUB_TOKEN_MISSING).toBe('github_token_missing')
      expect(ERROR_CODES.GITHUB_TOKEN_INVALID).toBe('github_token_invalid')
      expect(ERROR_CODES.GITHUB_API_ERROR).toBe('github_api_error')
      expect(ERROR_CODES.GITHUB_RATE_LIMIT).toBe('github_rate_limit')
      
      expect(ERROR_CODES.OAUTH_ERROR).toBe('oauth_error')
      expect(ERROR_CODES.OAUTH_CALLBACK_ERROR).toBe('oauth_callback_error')
      expect(ERROR_CODES.OAUTH_NO_CODE).toBe('oauth_no_code')
      
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('internal_error')
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('validation_error')
      expect(ERROR_CODES.NOT_FOUND).toBe('not_found')
      
      expect(ERROR_CODES.SIGNOUT_ERROR).toBe('signout_error')
    })

    it('should be readonly', () => {
      expect(() => {
        // @ts-expect-error - Testing readonly property
        ERROR_CODES.AUTH_REQUIRED = 'modified'
      }).toThrow()
    })
  })

  describe('Integration with NextResponse', () => {
    it('should create valid NextResponse objects', () => {
      const response = createErrorResponse('Test', 'test', 400)

      expect(response).toHaveProperty('headers')
      expect(response).toHaveProperty('status', 400)
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should be serializable', async () => {
      const response = createErrorResponse('Test', 'test', 400)
      const text = await response.text()
      
      expect(() => JSON.parse(text)).not.toThrow()
      
      const parsed = JSON.parse(text)
      expect(parsed.error.message).toBe('Test')
    })
  })

  describe('Error Message Localization', () => {
    it('should use French error messages', async () => {
      const appError = new AppError('Custom error', 'custom_code', 400)
      const response1 = handleApiError(appError)
      
      const standardError = new Error('Standard error')
      const response2 = handleApiError(standardError)
      
      const unknownError = 'Unknown'
      const response3 = handleApiError(unknownError)

      const data1 = await response1.json()
      const data2 = await response2.json()
      const data3 = await response3.json()

      expect(data1.error.message).toBe('Custom error')
      expect(data2.error.message).toBe('Erreur interne du serveur')
      expect(data3.error.message).toBe('Erreur inconnue')
    })
  })
})
