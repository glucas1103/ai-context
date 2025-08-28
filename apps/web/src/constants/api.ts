/**
 * Constantes pour les API endpoints et méthodes
 */

export const API_ENDPOINTS = {
  // Ancienne structure pour compatibilité
  WORKSPACES: '/api/workspaces',
  GITHUB_REPOS: '/api/github/repos',
  AUTH_CALLBACK: '/api/auth/callback',
  AUTH_SIGNOUT: '/api/auth/signout',
  HEALTH: '/api/health',
  
  // Nouvelle structure organisée
  GITHUB: {
    REPOS: '/api/github/repos',
    REPO_DETAILS: '/api/github/repos/[id]',
    REPO_CONTENT: '/api/github/repos/[id]/content',
  },
  WORKSPACES_STRUCTURED: {
    LIST: '/api/workspaces',
    CREATE: '/api/workspaces',
    DETAILS: '/api/workspaces/[id]',
    UPDATE: '/api/workspaces/[id]',
    DELETE: '/api/workspaces/[id]',
  },
  AUTH: {
    CALLBACK: '/api/auth/callback',
    SIGNOUT: '/api/auth/signout',
  },
} as const;

export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

export const API_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const API_ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INVALID_TOKEN: 'Invalid authentication token',
  VALIDATION_ERROR: 'Validation error',
  INVALID_INPUT: 'Invalid input data',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  CONFLICT: 'Resource conflict',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  DATABASE_ERROR: 'Database operation failed',
  NETWORK_ERROR: 'Network connection error',
  TIMEOUT: 'Request timeout',
  RATE_LIMIT: 'Rate limit exceeded',
} as const;

export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
} as const;

export const API_CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  TEXT: 'text/plain',
} as const;
