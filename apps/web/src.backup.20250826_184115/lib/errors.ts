import { NextResponse } from 'next/server'

export interface ApiError {
  error: {
    message: string
    code: string
    details?: any
  }
}

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: any

  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export function createErrorResponse(
  message: string,
  code: string,
  statusCode: number = 500,
  details?: any
): NextResponse {
  const errorResponse: ApiError = {
    error: {
      message,
      code,
      details
    }
  }

  // Log les erreurs serveur (5xx) pour le débogage
  if (statusCode >= 500) {
    console.error('Server Error:', {
      message,
      code,
      statusCode,
      details,
      timestamp: new Date().toISOString()
    })
  }

  return NextResponse.json(errorResponse, { status: statusCode })
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return createErrorResponse(error.message, error.code, error.statusCode, error.details)
  }

  if (error instanceof Error) {
    return createErrorResponse(
      'Erreur interne du serveur',
      'internal_error',
      500,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    )
  }

  return createErrorResponse(
    'Erreur inconnue',
    'unknown_error',
    500
  )
}

// Codes d'erreur standardisés
export const ERROR_CODES = {
  // Authentification
  AUTH_REQUIRED: 'auth_required',
  AUTH_INVALID: 'auth_invalid',
  AUTH_EXPIRED: 'auth_expired',
  
  // GitHub OAuth
  GITHUB_TOKEN_MISSING: 'github_token_missing',
  GITHUB_TOKEN_INVALID: 'github_token_invalid',
  GITHUB_API_ERROR: 'github_api_error',
  GITHUB_RATE_LIMIT: 'github_rate_limit',
  
  // OAuth Flow
  OAUTH_ERROR: 'oauth_error',
  OAUTH_CALLBACK_ERROR: 'oauth_callback_error',
  OAUTH_NO_CODE: 'oauth_no_code',
  
  // Général
  INTERNAL_ERROR: 'internal_error',
  VALIDATION_ERROR: 'validation_error',
  NOT_FOUND: 'not_found',
  
  // Déconnexion
  SIGNOUT_ERROR: 'signout_error'
} as const
