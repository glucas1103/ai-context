export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider: 'github' | 'google' | 'email';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface OAuthProvider {
  name: 'github' | 'google';
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface OAuthCallbackParams {
  code: string;
  state?: string;
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  token: string;
}
