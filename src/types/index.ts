export interface List {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ListWithAccessCode extends List {
  access_code: string;
}

export interface AccessCodeVerification {
  id: number;
  access_code: string;
}

export interface AccessCodeVerificationWithUser extends AccessCodeVerification {
  user_name: string;
}

export interface AuthToken {
  token: string;
  expires_at: string;
  user_name: string;
  list_id: number;
}


export interface PenseBete {
  id?: number;
  list_id: number;
  title: string;
  description: string | null;
  options: PenseBeteOption[];
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  pinned: boolean;
  created_at?: string;
  created_by?: string;
  target_element?: string;
  user_name?: string; // Nom de l'utilisateur connecté
}

export interface PenseBeteOption {
  id?: number;
  text: string;
  checkedUsers: string[];
}
