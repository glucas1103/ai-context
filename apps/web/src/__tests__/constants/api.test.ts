import { 
  API_ENDPOINTS, 
  API_METHODS, 
  API_STATUS_CODES, 
  API_ERROR_MESSAGES 
} from '@/constants/api'

describe('API Constants', () => {
  describe('API_ENDPOINTS', () => {
    it('has correct GitHub endpoints', () => {
      expect(API_ENDPOINTS.GITHUB.REPOS).toBe('/api/github/repos')
      expect(API_ENDPOINTS.GITHUB.REPO_DETAILS).toBe('/api/github/repos/[id]')
      expect(API_ENDPOINTS.GITHUB.REPO_CONTENT).toBe('/api/github/repos/[id]/content')
    })

    it('has correct workspace endpoints', () => {
      expect(API_ENDPOINTS.WORKSPACES_STRUCTURED.LIST).toBe('/api/workspaces')
      expect(API_ENDPOINTS.WORKSPACES_STRUCTURED.CREATE).toBe('/api/workspaces')
      expect(API_ENDPOINTS.WORKSPACES_STRUCTURED.DETAILS).toBe('/api/workspaces/[id]')
      expect(API_ENDPOINTS.WORKSPACES_STRUCTURED.UPDATE).toBe('/api/workspaces/[id]')
      expect(API_ENDPOINTS.WORKSPACES_STRUCTURED.DELETE).toBe('/api/workspaces/[id]')
    })

    it('has correct auth endpoints', () => {
      expect(API_ENDPOINTS.AUTH.CALLBACK).toBe('/api/auth/callback')
      expect(API_ENDPOINTS.AUTH.SIGNOUT).toBe('/api/auth/signout')
    })

    it('has correct health endpoint', () => {
      expect(API_ENDPOINTS.HEALTH).toBe('/api/health')
    })

    it('maintains backward compatibility', () => {
      expect(API_ENDPOINTS.WORKSPACES).toBe('/api/workspaces')
      expect(API_ENDPOINTS.GITHUB_REPOS).toBe('/api/github/repos')
      expect(API_ENDPOINTS.AUTH_CALLBACK).toBe('/api/auth/callback')
      expect(API_ENDPOINTS.AUTH_SIGNOUT).toBe('/api/auth/signout')
    })
  })

  describe('API_METHODS', () => {
    it('has all HTTP methods', () => {
      expect(API_METHODS.GET).toBe('GET')
      expect(API_METHODS.POST).toBe('POST')
      expect(API_METHODS.PUT).toBe('PUT')
      expect(API_METHODS.DELETE).toBe('DELETE')
      expect(API_METHODS.PATCH).toBe('PATCH')
    })
  })

  describe('API_STATUS_CODES', () => {
    it('has success status codes', () => {
      expect(API_STATUS_CODES.OK).toBe(200)
      expect(API_STATUS_CODES.CREATED).toBe(201)
      expect(API_STATUS_CODES.NO_CONTENT).toBe(204)
    })

    it('has client error status codes', () => {
      expect(API_STATUS_CODES.BAD_REQUEST).toBe(400)
      expect(API_STATUS_CODES.UNAUTHORIZED).toBe(401)
      expect(API_STATUS_CODES.FORBIDDEN).toBe(403)
      expect(API_STATUS_CODES.NOT_FOUND).toBe(404)
      expect(API_STATUS_CODES.CONFLICT).toBe(409)
      expect(API_STATUS_CODES.UNPROCESSABLE_ENTITY).toBe(422)
    })

    it('has server error status codes', () => {
      expect(API_STATUS_CODES.INTERNAL_SERVER_ERROR).toBe(500)
      expect(API_STATUS_CODES.BAD_GATEWAY).toBe(502)
      expect(API_STATUS_CODES.SERVICE_UNAVAILABLE).toBe(503)
    })
  })

  describe('API_ERROR_MESSAGES', () => {
    it('has authentication error messages', () => {
      expect(API_ERROR_MESSAGES.UNAUTHORIZED).toBe('Unauthorized access')
      expect(API_ERROR_MESSAGES.FORBIDDEN).toBe('Access forbidden')
      expect(API_ERROR_MESSAGES.INVALID_TOKEN).toBe('Invalid authentication token')
    })

    it('has validation error messages', () => {
      expect(API_ERROR_MESSAGES.VALIDATION_ERROR).toBe('Validation error')
      expect(API_ERROR_MESSAGES.INVALID_INPUT).toBe('Invalid input data')
      expect(API_ERROR_MESSAGES.MISSING_REQUIRED_FIELD).toBe('Missing required field')
    })

    it('has resource error messages', () => {
      expect(API_ERROR_MESSAGES.NOT_FOUND).toBe('Resource not found')
      expect(API_ERROR_MESSAGES.ALREADY_EXISTS).toBe('Resource already exists')
      expect(API_ERROR_MESSAGES.CONFLICT).toBe('Resource conflict')
    })

    it('has server error messages', () => {
      expect(API_ERROR_MESSAGES.INTERNAL_ERROR).toBe('Internal server error')
      expect(API_ERROR_MESSAGES.SERVICE_UNAVAILABLE).toBe('Service temporarily unavailable')
      expect(API_ERROR_MESSAGES.DATABASE_ERROR).toBe('Database operation failed')
    })

    it('has network error messages', () => {
      expect(API_ERROR_MESSAGES.NETWORK_ERROR).toBe('Network connection error')
      expect(API_ERROR_MESSAGES.TIMEOUT).toBe('Request timeout')
      expect(API_ERROR_MESSAGES.RATE_LIMIT).toBe('Rate limit exceeded')
    })
  })

  describe('Constants Structure', () => {
    it('API_ENDPOINTS is properly structured', () => {
      expect(typeof API_ENDPOINTS).toBe('object')
      expect(API_ENDPOINTS).toHaveProperty('GITHUB')
      expect(API_ENDPOINTS).toHaveProperty('WORKSPACES_STRUCTURED')
      expect(API_ENDPOINTS).toHaveProperty('AUTH')
      expect(API_ENDPOINTS).toHaveProperty('HEALTH')
      // Backward compatibility
      expect(API_ENDPOINTS).toHaveProperty('WORKSPACES')
      expect(API_ENDPOINTS).toHaveProperty('GITHUB_REPOS')
    })

    it('API_METHODS contains all required methods', () => {
      expect(typeof API_METHODS).toBe('object')
      const requiredMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      requiredMethods.forEach(method => {
        expect(Object.values(API_METHODS)).toContain(method)
      })
    })

    it('API_STATUS_CODES contains all required status codes', () => {
      expect(typeof API_STATUS_CODES).toBe('object')
      const requiredCodes = [200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 502, 503]
      requiredCodes.forEach(code => {
        expect(Object.values(API_STATUS_CODES)).toContain(code)
      })
    })

    it('API_ERROR_MESSAGES contains all required error messages', () => {
      expect(typeof API_ERROR_MESSAGES).toBe('object')
      const requiredMessages = [
        'Unauthorized access',
        'Access forbidden',
        'Invalid authentication token',
        'Validation error',
        'Invalid input data',
        'Missing required field',
        'Resource not found',
        'Resource already exists',
        'Resource conflict',
        'Internal server error',
        'Service temporarily unavailable',
        'Database operation failed',
        'Network connection error',
        'Request timeout',
        'Rate limit exceeded'
      ]
      requiredMessages.forEach(message => {
        expect(Object.values(API_ERROR_MESSAGES)).toContain(message)
      })
    })
  })
})
