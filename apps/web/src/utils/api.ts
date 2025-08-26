/**
 * Utilitaires pour les appels API
 */

import { API_METHODS, API_CONTENT_TYPES, API_STATUS_CODES } from '@/constants/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status: number;
}

export interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  /**
   * Effectue un appel GET
   */
  async get<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: API_METHODS.GET,
      ...options,
    });
  },

  /**
   * Effectue un appel POST
   */
  async post<T>(endpoint: string, data?: any, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: API_METHODS.POST,
      body: data,
      ...options,
    });
  },

  /**
   * Effectue un appel PUT
   */
  async put<T>(endpoint: string, data?: any, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: API_METHODS.PUT,
      body: data,
      ...options,
    });
  },

  /**
   * Effectue un appel DELETE
   */
  async delete<T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: API_METHODS.DELETE,
      ...options,
    });
  },

  /**
   * Méthode générique pour les appels API
   */
  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = API_METHODS.GET,
      headers = {},
      body,
      timeout = 10000,
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': API_CONTENT_TYPES.JSON,
          ...headers,
        },
        signal: controller.signal,
      };

      if (body && method !== API_METHODS.GET) {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, requestOptions);
      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new ApiError(
          responseData?.error || `HTTP ${response.status}`,
          response.status,
          responseData
        );
      }

      return {
        data: responseData.data,
        success: responseData.success,
        status: response.status,
        error: responseData.error,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', API_STATUS_CODES.BAD_REQUEST);
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        API_STATUS_CODES.INTERNAL_SERVER_ERROR
      );
    }
  },
};

/**
 * Vérifie si une réponse API est réussie
 */
export const isApiSuccess = (response: ApiResponse): boolean => {
  return response.success && response.status >= 200 && response.status < 300;
};

/**
 * Extrait les données d'une réponse API ou lance une erreur
 */
export const extractApiData = <T>(response: ApiResponse<T>): T => {
  if (!isApiSuccess(response)) {
    throw new ApiError(
      response.error || 'API request failed',
      response.status
    );
  }
  return response.data!;
};

/**
 * Crée une réponse d'erreur standardisée pour les API routes
 */
export const createErrorResponse = (
  message: string,
  code: string = 'unknown_error',
  status: number = 500
) => {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message,
        code,
        status
      }
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

/**
 * Gère les erreurs dans les API routes
 */
export const handleApiError = (error: unknown) => {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return createErrorResponse(error.message, 'api_error', error.status);
  }
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 'internal_error', 500);
  }
  
  return createErrorResponse('Erreur interne du serveur', 'internal_error', 500);
};
