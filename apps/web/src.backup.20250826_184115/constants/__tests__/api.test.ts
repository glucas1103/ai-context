/**
 * Tests pour les constantes API
 */

import {
  API_ENDPOINTS,
  API_METHODS,
  API_STATUS_CODES,
  API_HEADERS,
  API_CONTENT_TYPES,
} from '../api';

describe('API constants', () => {
  describe('API_ENDPOINTS', () => {
    it('should have all required endpoints', () => {
      expect(API_ENDPOINTS.WORKSPACES).toBe('/api/workspaces');
      expect(API_ENDPOINTS.GITHUB_REPOS).toBe('/api/github/repos');
      expect(API_ENDPOINTS.AUTH_CALLBACK).toBe('/api/auth/callback');
      expect(API_ENDPOINTS.AUTH_SIGNOUT).toBe('/api/auth/signout');
      expect(API_ENDPOINTS.HEALTH).toBe('/api/health');
    });
  });

  describe('API_METHODS', () => {
    it('should have all HTTP methods', () => {
      expect(API_METHODS.GET).toBe('GET');
      expect(API_METHODS.POST).toBe('POST');
      expect(API_METHODS.PUT).toBe('PUT');
      expect(API_METHODS.DELETE).toBe('DELETE');
    });
  });

  describe('API_STATUS_CODES', () => {
    it('should have common status codes', () => {
      expect(API_STATUS_CODES.OK).toBe(200);
      expect(API_STATUS_CODES.CREATED).toBe(201);
      expect(API_STATUS_CODES.BAD_REQUEST).toBe(400);
      expect(API_STATUS_CODES.UNAUTHORIZED).toBe(401);
      expect(API_STATUS_CODES.NOT_FOUND).toBe(404);
      expect(API_STATUS_CODES.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe('API_HEADERS', () => {
    it('should have common headers', () => {
      expect(API_HEADERS.CONTENT_TYPE).toBe('Content-Type');
      expect(API_HEADERS.AUTHORIZATION).toBe('Authorization');
      expect(API_HEADERS.ACCEPT).toBe('Accept');
    });
  });

  describe('API_CONTENT_TYPES', () => {
    it('should have common content types', () => {
      expect(API_CONTENT_TYPES.JSON).toBe('application/json');
      expect(API_CONTENT_TYPES.FORM_DATA).toBe('multipart/form-data');
      expect(API_CONTENT_TYPES.TEXT).toBe('text/plain');
    });
  });
});
