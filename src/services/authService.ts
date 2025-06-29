import type { AuthToken } from '../types';

const TOKEN_KEY = 'auth_token';

export const saveToken = (token: AuthToken): void => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
};

export const getToken = (): AuthToken | null => {
  const tokenStr = localStorage.getItem(TOKEN_KEY);
  if (!tokenStr) return null;
  
  try {
    const token = JSON.parse(tokenStr) as AuthToken;
    
    // Vérifier si le token a expiré
    const expiresAt = new Date(token.expires_at);
    if (expiresAt < new Date()) {
      // Token expiré, on le supprime
      removeToken();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

export const hasAccessToList = (listId: number): boolean => {
  const token = getToken();
  if (!token) return false;
  
  // Vérifier si le token correspond à la liste demandée
  return token.list_id === listId;
};

