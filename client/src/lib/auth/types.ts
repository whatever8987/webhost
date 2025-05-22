export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  salon?: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
} 