import { API_ENDPOINTS } from "@/constants/api";
/**
 * Utilitaires pour l'authentification
 */

import { ROUTES } from '@/constants/routes';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in?: number;
  refresh_token?: string;
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Vérifier la présence d'un token dans le localStorage
  const token = localStorage.getItem('auth_token');
  return !!token;
};

/**
 * Récupère le token d'authentification
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

/**
 * Stocke le token d'authentification
 */
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

/**
 * Supprime le token d'authentification
 */
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

/**
 * Récupère les informations utilisateur
 */
export const getAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('auth_user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Stocke les informations utilisateur
 */
export const setAuthUser = (user: AuthUser): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_user', JSON.stringify(user));
};

/**
 * Supprime les informations utilisateur
 */
export const removeAuthUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_user');
};

/**
 * Déconnecte l'utilisateur
 */
export const logout = (): void => {
  removeAuthToken();
  removeAuthUser();
  
  // Rediriger vers la page de login
  if (typeof window !== 'undefined') {
    window.location.href = ROUTES.LOGIN;
  }
};

/**
 * Vérifie si le token est expiré
 */
export const isTokenExpired = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    // Décoder le token JWT (partie payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

/**
 * Rafraîchit le token d'authentification
 */
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const { access_token } = await response.json();
      setAuthToken(access_token);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

/**
 * Ajoute le token d'authentification aux headers
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
