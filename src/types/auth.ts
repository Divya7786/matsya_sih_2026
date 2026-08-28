export type UserRole =
  | 'ISRO_SCIENTIST'
  | 'MARINE_ANALYST'
  | 'COAST_GUARD'
  | 'FISHERMAN'
  | 'PUBLIC_RESEARCHER'
  | 'ADMIN'
  | 'isro_scientist';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle?: string;
  organization: string;
  department?: string;
  avatarUrl?: string;
  badge: string;
  clearanceLevel: string;
  savedAnalysesCount: number;
  account_status?: string;
  is_verified?: boolean;
}

export interface SavedAnalysis {
  id: string;
  title: string;
  date: string;
  region: string;
  variables: string[];
  summary: string;
  query: string;
  reportId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
}
