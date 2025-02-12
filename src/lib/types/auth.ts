
export interface AuthState {
  user: User | null;
  loading: boolean;
}

export interface User {
  id: string;
  email?: string;
}
