import type { List, ListWithAccessCode, AccessCodeVerification, AccessCodeVerificationWithUser, AuthToken, PenseBete } from '../types';
import { getToken, removeToken } from './authService';

// const API_URL = 'https://localhost:5000/api';
const API_URL = 'https://pensebete-api.capiomont.fr/api';


const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json'
    };
  } else {
    return {
      'Content-Type': 'application/json'
    };
  }
};

export const fetchLists = async (): Promise<List[]> => {
  try {
    const response = await fetch(`${API_URL}/lists`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des listes');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

export const fetchListById = async (id: number): Promise<List> => {
  try {
    const response = await fetch(`${API_URL}/lists/${id}`);
    if (!response.ok) {
      throw new Error('Liste non trouvée');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

export const createList = async (list: Omit<ListWithAccessCode, 'id' | 'created_at'>): Promise<List> => {
  try {
    const response = await fetch(`${API_URL}/lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(list),
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la création de la liste');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

export const verifyAccessCode = async (verification: AccessCodeVerification): Promise<List> => {
  try {
    const response = await fetch(`${API_URL}/lists/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verification),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Code d\'accès incorrect');
      }
      throw new Error('Erreur lors de la vérification du code');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

export const verifyAccessCodeWithUser = async (verification: AccessCodeVerificationWithUser): Promise<AuthToken> => {
  try {
    const response = await fetch(`${API_URL}/lists/verify-with-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verification),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Code d\'accès incorrect');
      }
      throw new Error('Erreur lors de la vérification du code');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

export const fetchPenseBetes = async (listId: number): Promise<PenseBete[]> => {
  try {
    const response = await fetch(`${API_URL}/lists/${listId}/pense-betes`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Accès non autorisé');
      }
      throw new Error('Erreur lors de la récupération des pense-bêtes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

export const createPenseBete = async (penseBete: Omit<PenseBete, 'id' | 'created_at'>): Promise<PenseBete> => {
  try {
    const response = await fetch(`${API_URL}/lists/${penseBete.list_id}/pense-betes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(penseBete),
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Accès non autorisé');
      }
      throw new Error('Erreur lors de la création du pense-bête');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

export const updatePenseBete = async (penseBete: PenseBete): Promise<PenseBete> => {
  try {
    const response = await fetch(`${API_URL}/lists/${penseBete.list_id}/pense-betes/${penseBete.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(penseBete),
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Accès non autorisé');
      }
      throw new Error('Erreur lors de la mise à jour du pense-bête');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

export const deletePenseBete = async (listId: number, penseBeteId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/lists/${listId}/pense-betes/${penseBeteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Accès non autorisé');
      }
      throw new Error('Erreur lors de la suppression du pense-bête');
    }
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};


export const validateTokenForList = async (listId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/lists/${listId}/validate-token`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      // Si le serveur répond avec une erreur, le token est invalide
      removeToken();
      return false;
    }
    
    return true;
  } catch (error) {
    // En cas d'erreur réseau, on considère que le token est invalide
    removeToken();
    return false;
  }
};
