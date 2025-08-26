/**
 * Constantes pour les API endpoints et méthodes
 */

export const API_ENDPOINTS = {
  WORKSPACES: '/api/workspaces',
  GITHUB_REPOS: '/api/github/repos',
  AUTH_CALLBACK: '/api/auth/callback',
  AUTH_SIGNOUT: '/api/auth/signout',
  HEALTH: '/api/health',
} as const;

export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

export const API_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
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
