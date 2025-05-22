// src/types.ts

// ==========================================
// Data Structures received from Django Backend API
// These should match your Django Serializers' output
// ==========================================

// Assuming social_links is a JSONField default=list of objects like [{"platform": "Facebook", "url": "..."}]
export interface SocialLinkItem {
  platform: string; // e.g., "Facebook", "Instagram", "Twitter"
  url: string;
}

// Assuming services is a JSONField default=list of objects like [{"name": "...", "price": "...", "description": "..."}]
export interface Service {
  name: string;
  price: string; // Or number, depending on backend
  description?: string | null;
  // Add other service fields if applicable
}

// Assuming testimonials is a JSONField default=list of objects like [{"quote": "...", "client_name": "...", "rating": N}]
export interface Testimonial {
  quote: string;
  client_name: string;
  client_title?: string | null; // Added based on your seed script
  rating?: number | null;
}

// Assuming template configuration in the JSONField 'features' (or 'config') is an object
export interface TemplateConfig {
    show_gallery?: boolean;
    show_testimonials?: boolean;
    hero_layout?: string; // e.g. "centered", "image_left"
    services_display?: string; // e.g. "grid", "list"
    gallery_cols?: number; // e.g. 2, 3, 4
    show_map?: boolean; // Added based on your seed script logic
    show_social_icons?: boolean; // Added based on your seed script logic
    // Add other configuration options relevant to layout or feature toggles
}


// Full Template Data structure expected by frontend components
// This represents the data from your Django Template model
export interface TemplateData {
  id?: number;
  name?: string | null;
  slug?: string | null; // Key for selecting layout component (e.g., 'classic', 'modern')
  description?: string | null; // Template description
  preview_image?: string | null; // Template preview image URL

  // Template style parameters (assuming CharFields for colors, font-family)
  primary_color?: string | null; // e.g. #RRGGBB
  secondary_color?: string | null; // e.g. #RRGGBB
  font_family?: string | null; // e.g. "'Poppins', sans-serif"
  background_color?: string | null; // e.g. #RRGGBB
  text_color?: string | null; // e.g. #RRGGBB

  // Default images specific to the template (if any, assuming URLs)
  default_cover_image?: string | null; // Fallback cover image for template
  default_about_image?: string | null; // Fallback about image for template

  // Features/Config (JSONField) - assuming the JSON structure is TemplateConfig
  // Note: Your seed script uses 'features', so we'll align the type name here
  features?: TemplateConfig | null;

  // Add any other template fields serialized by your backend
  created_at?: string; // ISO 8601 string
  updated_at?: string; // ISO 8601 string
}


// Full Salon Data structure expected by frontend components
// This represents the data from your Django Salon model, potentially nested with TemplateData
export interface SalonData {
  id?: number;
  name: string;
  sample_url?: string | null; // Used for fetching a real site by slug
  logo_image?: string | null; // FileField path/URL
  cover_image?: string | null; // FileField path/URL
  hero_subtitle?: string | null;
  // Assuming opening_hours is a multi-line text field in the backend (TextField)
  opening_hours?: string | null; // Matches TextField
  phone_number?: string | null;
  address?: string | null;
  location?: string | null; // e.g., City, State
  email?: string | null;
  description?: string | null; // Main description field
  about_image?: string | null; // Image for the about section (FileField path/URL)
  services?: Service[] | null; // Matches JSONField default=list
  services_url?: string | null; // External URL for services menu
  gallery_images?: string[] | null; // Matches JSONField default=list (assuming string URLs)
  gallery_url?: string | null; // External URL for full gallery
  testimonials?: Testimonial[] | null; // Matches JSONField default=list
  booking_url?: string | null; // External booking URL
  map_embed_url?: string | null; // URL for embedding a map
  footer_logo_image?: string | null; // Logo specifically for the footer (FileField path/URL)
  footer_about?: string | null; // Text specifically for the footer about section (TextField)
  social_links?: SocialLinkItem[] | null; // Matches JSONField default=list

  // Taglines
  services_tagline?: string | null;
  gallery_tagline?: string | null;

  # Add any other fields your Salon model has that are serialized
  claimed?: boolean; // Claimed status
  claimed_at?: string | null; // ISO 8601 string
  contact_status?: string; // e.g., 'notContacted', 'subscribed'

  // The owner link - adjust based on your User serializer
  // It might be just the ID, or a nested object, or null
  owner?: { id: number; username: string; [key: string]: any } | null;

  // The link to the associated template - MUST be nested TemplateData for SampleSite
  template?: TemplateData | null; // Nested template data

  created_at?: string; // ISO 8601 string
  updated_at?: string; // ISO 8601 string
}

// Basic User type for the logged-in user (adjust based on your API's user profile endpoint)
export interface User {
    id: number;
    username: string;
    email: string;
    is_staff: boolean; // Typically used for admin checks
    is_superuser: boolean; // Also used for admin checks
    // Add other user fields like first_name, last_name, etc.

    // Link to the user's owned salon, if any.
    // This structure depends on how your User serializer exposes the owned salon.
    // It could be just the ID, or a nested minimal salon object.
    // Example assuming it's a nested object with id, sample_url, and name:
    salon?: { id: number; sample_url: string; name: string; [key: string]: any } | null;
    // If it's just the ID:
    // owned_salon_id?: number | null; // Or owned_salon_sample_url?: string | null;
    // You might need to fetch the full salon separately if only ID is provided here.
    // The SampleSite logic assumes a nested 'salon' object with at least 'id'.
}

// ==========================================
// Props Structures for Frontend Components
// ==========================================

// Props structure for Layout components (e.g., TemplateLayoutClassic.tsx)
export interface TemplateLayoutProps {
  salon: SalonData; // The full salon data
  template: TemplateData; // The template data associated with the salon
  // Pass down utilities/state needed by the layout or its children sections
  isMobileMenuOpen: boolean; // State for mobile menu toggle
  setIsMobileMenuOpen: (isOpen: boolean) => void; // Setter for mobile menu state
  openUrl: (url?: string | null, fallbackUrl?: string) => void; // Utility function for opening URLs
  isPreview?: boolean; // Flag indicating if it's a preview
}

// Props structure for individual Section components (e.g., HeroSection.tsx, AboutSection.tsx)
export interface SectionProps {
  salon: SalonData; // The full salon data
  template: TemplateData; // The template data associated with the salon
  // Add section-specific props derived from salon or template.config if needed
  // Example: config for specific section layout or features
  config?: any; // Allow arbitrary config passed from the Layout component

  // Pass down utilities like openUrl if the section uses buttons/links
  openUrl: (url?: string | null, fallbackUrl?: string) => void;
}

// Optional: Paginated Response type if your API lists use this structure
// import { Template } from './types'; // Import Template if you need it here
// export interface PaginatedResponse<T> {
//     count: number;
//     next: string | null;
//     previous: string | null;
//     results: T[];
// }