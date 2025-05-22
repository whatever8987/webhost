export interface Template {
  id: number;
  name: string;
  description: string;
  features: Record<string, any>;
  preview_image: string;
  slug: string;
  is_mobile_optimized: boolean;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  default_cover_image: string;
  default_about_image: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  url: string;
  type: {
    id: number;
    name: string;
    slug: string;
    info: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
  };
  owner_username: string | null;
  claimed: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TypeBusiness {
  type: string;
  businesses: Business[];
} 