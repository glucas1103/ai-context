/**
 * Constantes pour les routes de l'application
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  WORKSPACES: '/workspaces',
  WORKSPACE_CONTEXT: (id: string) => `/workspaces/${id}/context`,
  WORKSPACE_DOCUMENTATION: (id: string) => `/workspaces/${id}/documentation`,
  WORKSPACE_ISSUES: (id: string) => `/workspaces/${id}/issues`,
} as const;

export const ROUTE_PARAMS = {
  WORKSPACE_ID: 'id',
  ITEM_ID: 'itemId',
} as const;

export const ROUTE_SEGMENTS = {
  WORKSPACES: 'workspaces',
  CONTEXT: 'context',
  DOCUMENTATION: 'documentation',
  ISSUES: 'issues',
  LOGIN: 'login',
} as const;

export const EXTERNAL_ROUTES = {
  GITHUB: 'https://github.com',
  GITHUB_API: 'https://api.github.com',
} as const;
