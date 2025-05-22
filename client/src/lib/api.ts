import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';

// Using import.meta.env for Vite
// Ensure VITE_API_URL in your .env file points to your Django backend root (e.g., http://localhost:8000)
const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- Frontend Type Definitions (MATCHING DRF JSON OUTPUT - SNAKE_CASE) ---
// Note: These should accurately reflect the JSON structure returned by your Django Rest Framework serializers.

interface LoginData {
  username: string;
  password: string;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  role: 'user' | 'admin'; // Assuming role is a field on your user model
  // Assuming the user serializer includes a link to their claimed salon
  // This needs to match your backend user serializer's output
  salon?: { // Use optional chaining when accessing this
      id: number;
      name: string;
      sample_url: string;
      // Add other minimal salon fields needed on the user object
  } | null; // It could be a salon object, null, or undefined
  // Or if your user serializer only includes the ID:
  // claimed_salon_id?: number | null;
}

// Adjusted BlogPost types (assuming backend uses snake_case)
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null; // Optional and nullable
  cover_image?: string | null; // URL from DRF
  author: { // Assuming author is a nested object with id and username/name
      id: number;
      username: string;
      first_name?: string | null;
      last_name?: string | null;
      // Add other author fields if needed
  } | null; // Author could be null if FK is nullable
  category: string; // Assuming category is a string slug/name
  tags: any; // Assuming JSONField, could be string[] or {tag: string}[] etc.
  published: boolean;
  featured: boolean;
  published_at?: string | null; // Nullable DateTime field
  view_count?: number; // Optional if not always included
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
  // If comments are nested in the post detail API, define them here
  // comments?: BlogComment[];
}

interface BlogComment {
  id: number;
  post?: number; // Optional if not returned on the comment list/detail
  user?: { // Nested user object if comment is by registered user
      id: number;
      username: string;
      // Add other user fields if needed
  } | null; // Null if comment is by guest
  name?: string | null; // Guest name (nullable)
  email?: string | null; // Guest email (nullable)
  content: string;
  approved: boolean;
  created_at: string;
}

// Adjusted BlogPostRequest (for sending data TO backend)
interface BlogPostRequest {
  title: string;
  content: string;
  excerpt?: string | null;
  // cover_image is typically sent as FormData, not in JSON for file uploads
  // If your serializer handles base64 or URL string upload, adjust type
  cover_image?: string | null; // Or File | string | null
  category: string; // Send category slug/name
  tags: any; // Send tags data structure matching serializer expectation
  published?: boolean;
  published_at?: string | null;
  featured?: boolean;
}


// Updated Salon type (MATCHING DRF SERIALIZER SNAKE_CASE)
interface Salon {
  id: number;
  name: string;
  location: string;
  address?: string | null;
  phone_number?: string | null;
  email?: string | null;

  description?: string | null;
  services: any; // JSONField. Adjust type if known (e.g., { name: string, price: string, description?: string }[])
  opening_hours?: string | null;

  // Added 'image' field
  image?: string | null; // URL from DRF

  // Existing image fields (URLs from DRF)
  logo_image?: string | null;
  cover_image?: string | null;
  about_image?: string | null;
  footer_logo_image?: string | null;

  // Added new content fields
  hero_subtitle?: string | null;
  services_tagline?: string | null;
  gallery_tagline?: string | null;
  footer_about?: string | null;

  // Added URL fields
  booking_url?: string | null;
  gallery_url?: string | null;
  services_url?: string | null;
  map_embed_url?: string | null;

  // Added JSONFields (can be null or empty array/object)
  gallery_images: any; // JSONField, typically string[]
  testimonials: any; // JSONField, typically { quote: string, name: string }[]
  social_links: any; // JSONField, typically { platform: string, url: string }[]

  sample_url: string;
  owner: string | null; // StringRelatedField sends username string or null
  template?: Template | null; // Nested Template object if included by serializer
  template_id?: number | null; // Optional: if serializer includes write-only template_id on read
  claimed: boolean;
  claimed_at?: string | null; // Nullable DateTime field
  contact_status: 'notContacted' | 'contacted' | 'interested' | 'notInterested' | 'subscribed';
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatResponse {
  candidates: {
    content: {
      role: 'model';
      parts: { text: string }[];
    };
  }[];
  session_id?: string;
}


// Updated Template type (MATCHING DRF SERIALIZER SNAKE_CASE)
interface Template {
  id: number;
  name: string;
  description?: string | null; // Description might be nullable
  preview_image?: string | null; // URL from DRF

  // Added styling fields
  primary_color?: string | null; // e.g., "#RRGGBB"
  secondary_color?: string | null;
  font_family?: string | null; // e.g., "'Poppins', sans-serif"
  background_color?: string | null;
  text_color?: string | null;
  default_cover_image?: string | null; // URL from DRF
  default_about_image?: string | null; // URL from DRF

  features: any; // JSONField, likely { [key: string]: any }
  is_mobile_optimized: boolean;
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
}


interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string | null; // Might be nullable
  price_cents: number;
  display_price: string; // Assuming serializer adds this
  currency: string;
  features: any; // JSONField
  stripe_price_id: string;
  trial_period_days: number;
  is_active: boolean;
  is_popular: boolean;
  created_at: string; // Added timestamps based on model
  updated_at: string; // Added timestamps based on model
}

interface PaymentIntentRequest {
  amount_cents: number;
  description: string;
  currency?: string;
}

interface PaymentIntentResponse {
  clientSecret: string;
  intentId: string;
}

interface SubscriptionRequest {
  plan_id: number;
}

interface SubscriptionResponse {
  subscriptionId: string;
  clientSecret?: string;
  message?: string;
}

interface Stats {
  total_salons: number;
  sample_sites: number;
  active_subscriptions: number;
  pending_contacts: number;
  last_updated: string; // ISO 8601 string
}

// Generic paginated response interface
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Adjusted type for ReportOverviewData based on typical JSON output
interface ReportOverviewData {
    total_visits: number;
    unique_ips: number;
    unique_authenticated_users: number;
    estimated_unique_visitors: number;
    visits_by_day: { day: string; count: number }[]; // Array of objects
    popular_pages: { path: string; count: number }[]; // Array of objects
    date_range: { start_date: string | null; end_date: string | null };
}

// --- Businesses & Types API ---

export interface Business {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  url: string;
  type: Type;
  owner_username: string | null;
  claimed: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Type {
  id: number;
  name: string;
  slug: string;
  info: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TypeBusiness {
  type: string;
  businesses: Business[];
}


// --- Axios Instance and Interceptors ---

const apiClient: AxiosInstance = axios.create({
  // The baseURL is set to the /api endpoint on your backend
  baseURL: `${API_BASE_URL}/api`,
  // Set default headers if needed
  // headers: { 'Content-Type': 'application/json' }
});

// Helper function to clear tokens (defined below)
const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Request interceptor: Add Authorization header if token exists
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
   // Initialize headers if not present
   if (!config.headers) {
       config.headers = new AxiosHeaders();
   }

  // Define paths that should NOT send the Authorization header initially
  // These are typically public endpoints like token obtain/refresh/verify and initial registration
  const publicPaths = [
      'users/token/',
      'users/token/refresh/',
      'users/token/verify/',
      'users/register/',
      // Add other public paths if necessary
  ];

  // Get the relative path from the config URL
  const relativeUrl = config.url || ''; // Use empty string if url is undefined
  const isPublicPath = publicPaths.some(path => relativeUrl.endsWith(path));


  if (!isPublicPath) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
  } else {
      // Ensure Authorization header is NOT sent for public paths
      delete config.headers.Authorization;
  }

  return config;
}, error => {
    // Do something with request error
    return Promise.reject(error);
});


// Response interceptor: Handle 401 errors for token refresh
apiClient.interceptors.response.use(
  (response) => response, // Just return the response if successful
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 (Unauthorized),
    // it's an Axios error,
    // it has a config (meaning it's not a request setup error),
    // it hasn't already been retried,
    // AND it's NOT the refresh token endpoint itself (to prevent infinite loops)
    if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        // Ensure we don't retry the refresh request path
        !originalRequest.url?.endsWith('/users/token/refresh/')
    ) {
      originalRequest._retry = true; // Mark the request as retried

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Attempt to refresh the access token
          // Use raw axios here with the FULL path to avoid issues with the interceptor
          const response = await axios.post<TokenResponse>(`${API_BASE_URL}/api/users/token/refresh/`, {
            refresh: refreshToken,
          });
          // If refresh is successful, store new tokens
          localStorage.setItem('access_token', response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh); // Refresh might also return new refresh token

          // Update the Authorization header for the original failed request with the new access token
          if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          }

          // Retry the original request with the new token
          // Use the original apiClient instance for the retry
          return apiClient(originalRequest);
        } else {
            // No refresh token available, clear tokens and redirect to login
            console.warn("No refresh token available, redirecting to login.");
            clearAuthTokens();
            if (typeof window !== 'undefined') {
               // Add a redirect parameter to return user to their page after login
               const currentPath = window.location.pathname + window.location.search;
               // Use pushState or Wouter navigate if preferred over window.location.href
               // window.location.href forces a full page reload
               window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            }
            return Promise.reject(error); // Reject the promise
        }
      } catch (refreshError: any) {
        // Refresh token failed (e.g., invalid refresh token), clear tokens and redirect to login
        console.error("Failed to refresh token, redirecting to login:", refreshError);
        clearAuthTokens();
        if (typeof window !== 'undefined') {
             const currentPath = window.location.pathname + window.location.search;
             // Use pushState or Wouter navigate if preferred over window.location.href
             window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
        return Promise.reject(error); // Reject the promise with the original error
      }
    }

    // For any error codes not handled above (including 401 on retry or non-auth endpoints),
    // or if it's the refresh endpoint that failed, reject the promise.
    return Promise.reject(error);
  }
);


// Helper functions to manage tokens
const setAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

// clearAuthTokens is defined above near the interceptor


// --- API Methods Grouped by Endpoint ---
// Paths here are RELATIVE to the apiClient's baseURL (${API_BASE_URL}/api)
// These relative paths MUST match your backend Django urls.py configuration
// relative to the /api/ prefix.

export const API = {
  auth: {
    login: async (data: LoginData): Promise<AxiosResponse<TokenResponse>> => {
      // Use raw axios with FULL path for token endpoints to avoid interceptor issues
      // SimpleJWT expects username and password in the request body
      return await axios.post(`${API_BASE_URL}/api/token/`, {
        username: data.username,
        password: data.password
      });
    },
    register: async (data: RegisterData): Promise<AxiosResponse<User>> => {
      // Use apiClient with the relative path defined in backend users.urls.py
      // This maps to ${API_BASE_URL}/api/users/register/
      return await apiClient.post('users/register/', data);
    },
    verifyToken: async (token: string): Promise<AxiosResponse<void>> => {
       // Use raw axios with FULL path for token endpoints
       return await axios.post(`${API_BASE_URL}/api/token/verify/`, { token });
    },
    changePassword: async (data: {
      current_password: string;
      new_password: string;
      new_password2: string;
    }): Promise<AxiosResponse<{ message: string }>> => {
      // Use apiClient with the relative path defined in backend users.urls.py
      // This maps to ${API_BASE_URL}/api/change-password/
      return await apiClient.put('change-password/', data);
    },
    // Logout might just clear tokens client-side or hit a backend logout endpoint
    logout: async (): Promise<AxiosResponse<any>> => {
         // If your backend has a logout endpoint that invalidates tokens
         // await apiClient.post('auth/logout/'); // Example relative path
         clearAuthTokens(); // Clear tokens client-side
         return Promise.resolve({} as AxiosResponse<any>); // Resolve immediately
    },
  },

  user: {
    // Get current user profile
    getProfile: async (): Promise<AxiosResponse<User>> => {
      // Use apiClient with the relative path defined in backend users.urls.py
      // This maps to ${API_BASE_URL}/api/users/profile/
      return await apiClient.get('users/profile/');
    },
    // Update current user profile
    updateProfile: async (data: Partial<User>): Promise<AxiosResponse<User>> => {
      // Use apiClient with the relative path defined in backend users.urls.py
      // This maps to ${API_BASE_URL}/api/users/profile/
      return await apiClient.patch('users/profile/', data);
    },
    // Update user's claimed salon
    updateSalon: async (salonId: number | null): Promise<AxiosResponse<User>> => {
      // Use apiClient with the relative path defined in backend users.urls.py
      // This maps to ${API_BASE_URL}/api/users/me/salon/
      return await apiClient.patch('users/me/salon/', { salon: salonId });
    },
    // You might add other user-specific endpoints here if needed
    // e.g., API.user.list() if an admin can list users at /api/users/
  },

  chat: {
    // Send a message to the chat endpoint
    sendMessage: async (contents: ChatMessage[], sessionId?: string) => {
      return apiClient.post<ChatResponse>('/chat/', {
        contents,
        session_id: sessionId
      });
    },
  },
  

  blog: {
     // Assuming /api/blog/posts/
    listPosts: async (params?: {
      category?: string;
      featured?: boolean;
      limit?: number;
      offset?: number;
      published?: boolean;
      tag?: string;
      search?: string; // Add search parameter if backend supports it
    }): Promise<AxiosResponse<PaginatedResponse<BlogPost>>> => {
      // Example: maps to ${API_BASE_URL}/api/blog/posts/
      return await apiClient.get('/blog/posts/', { params });
    },
     // Assuming /api/blog/posts/{slug}/
    getPost: async (slug: string): Promise<AxiosResponse<BlogPost>> => {
      // Example: maps to ${API_BASE_URL}/api/blog/posts/{slug}/
      return await apiClient.get(`/blog/posts/${slug}/`);
    },
     // Assuming /api/blog/posts/
    createPost: async (data: BlogPostRequest): Promise<AxiosResponse<BlogPost>> => {
      // Example: maps to ${API_BASE_URL}/api/blog/posts/
      // If cover_image is File, you might need FormData and 'multipart/form-data'
      return await apiClient.post('/blog/posts/', data);
    },
     // Assuming /api/blog/posts/{slug}/
    updatePost: async (slug: string, data: Partial<BlogPostRequest>): Promise<AxiosResponse<BlogPost>> => {
       // Example: maps to ${API_BASE_URL}/api/blog/posts/{slug}/
       // Similar FormData handling for file uploads if needed for partial update
       return await apiClient.patch(`/blog/posts/${slug}/`, data);
    },
     // Assuming /api/blog/posts/{slug}/
    deletePost: async (slug: string): Promise<AxiosResponse<void>> => {
      // Example: maps to ${API_BASE_URL}/api/blog/posts/{slug}/
      return await apiClient.delete(`/blog/posts/${slug}/`);
    },
     // Assuming /api/blog/posts/{slug}/comments/
    listComments: async (
      slug: string,
      params?: { limit?: number; offset?: number; approved?: boolean } // Add approved filter?
    ): Promise<AxiosResponse<PaginatedResponse<BlogComment>>> => {
      // Example: maps to ${API_BASE_URL}/api/blog/posts/{slug}/comments/
      return await apiClient.get(`/blog/posts/${slug}/comments/`, { params });
    },
     // Assuming /api/blog/posts/{slug}/comments/
    createComment: async (slug: string, data: {
      // post?: number; // Post ID might be derived from URL on backend
      name?: string | null; // Make nullable
      email?: string | null; // Make nullable
      content: string;
      user?: number | null; // Send user ID if logged in, or null for guest
    }): Promise<AxiosResponse<BlogComment>> => {
       // Example: maps to ${API_BASE_URL}/api/blog/posts/{slug}/comments/
      return await apiClient.post(`/blog/posts/${slug}/comments/`, data);
    },
     // Assuming /api/blog/comments/{id}/approve/
    approveComment: async (id: number): Promise<AxiosResponse<BlogComment>> => {
      // Example: maps to ${API_BASE_URL}/api/blog/comments/{id}/approve/
      return await apiClient.post(`/blog/comments/${id}/approve/`); // POST often used for actions
    },
     // Assuming /api/blog/comments/{id}/
    deleteComment: async (id: number): Promise<AxiosResponse<void>> => {
      // Example: maps to ${API_BASE_URL}/api/blog/comments/{id}/
      return await apiClient.delete(`/blog/comments/${id}/`);
    },
  },

  salons: {
     // Assuming /api/salons/
    list: async (params?: {
      limit?: number;
      offset?: number;
      location?: string; // Keep location filter parameter
      claimed?: boolean; // Keep claimed filter parameter
      search?: string; // Add search parameter (for SearchFilter backend)
      ordering?: string; // Add ordering parameter (for OrderingFilter backend)
    }): Promise<AxiosResponse<PaginatedResponse<Salon>>> => {
      // Example: maps to ${API_BASE_URL}/api/salons/
      return await apiClient.get('/salons/', { params });
    },
     // Assuming /api/salons/{id}/
    get: async (id: number): Promise<AxiosResponse<Salon>> => {
       // Example: maps to ${API_BASE_URL}/api/salons/{id}/
      return await apiClient.get(`/salons/${id}/`);
    },
     // Assuming /api/salons/sample/{sampleUrl}/ (custom action)
    getBySampleUrl: async (sampleUrl: string): Promise<AxiosResponse<Salon>> => {
      // Example: maps to ${API_BASE_URL}/api/salons/sample/{sampleUrl}/
      return await apiClient.get(`/salons/sample/${sampleUrl}/`);
    },
     // Assuming /api/salons/
    create: async (data: {
      name: string;
      location: string;
      address?: string | null;
      phone_number?: string | null;
      email?: string | null;
      description?: string | null;
      services?: any; // Match model/serializer type (JSONField)
      opening_hours?: string | null;
      // file uploads (image, logo_image, etc.) typically require FormData
      // image?: File | string | null;
      // logo_image?: File | string | null;
      // ... other image fields
      hero_subtitle?: string | null; // Add other new fields
      services_tagline?: string | null;
      gallery_tagline?: string | null;
      footer_about?: string | null;
      booking_url?: string | null;
      gallery_url?: string | null;
      services_url?: string | null;
      map_embed_url?: string | null;
      gallery_images?: any; // JSONField
      testimonials?: any; // JSONField
      social_links?: any; // JSONField
      template_id?: number | null; // Send template ID for linking
      contact_status?: 'notContacted' | 'contacted' | 'interested' | 'notInterested' | 'subscribed';
    }): Promise<AxiosResponse<Salon>> => {
       // Example: maps to ${API_BASE_URL}/api/salons/
       // If including file uploads, you need FormData and 'multipart/form-data' header
       return await apiClient.post('/salons/', data); // Default to JSON
    },
     // Assuming /api/salons/{id}/
    update: async (id: number, data: Partial<Salon>): Promise<AxiosResponse<Salon>> => {
       // Example: maps to ${API_BASE_URL}/api/salons/{id}/
       // Similar FormData handling for partial updates with file uploads if needed
       return await apiClient.patch(`/salons/${id}/`, data);
    },
     // Assuming /api/salons/{id}/
    delete: async (id: number): Promise<AxiosResponse<void>> => {
       // Example: maps to ${API_BASE_URL}/api/salons/{id}/
      return await apiClient.delete(`/salons/${id}/`);
    },
     // Assuming /api/salons/{id}/claim/ (custom action)
    claim: async (id: number): Promise<AxiosResponse<Salon>> => {
       // Example: maps to ${API_BASE_URL}/api/salons/{id}/claim/
      return await apiClient.post(`/salons/${id}/claim/`);
    },
     // Assuming /api/salons/contact-leads/ (custom action)
    markLeadsAsContacted: async (leadIds: number[]): Promise<AxiosResponse<{ message: string }>> => {
      // Example: maps to ${API_BASE_URL}/api/salons/contact-leads/
      return await apiClient.post('/salons/contact-leads/', { leadIds });
    },
  },

  templates: {
     // Assuming /api/templates/
    list: async (params?: {
      limit?: number;
      offset?: number;
      search?: string; // Add search parameter
      ordering?: string; // Add ordering parameter
    }): Promise<AxiosResponse<PaginatedResponse<Template>>> => {
       // Example: maps to ${API_BASE_URL}/api/templates/
      return await apiClient.get('/templates/', { params });
    },
     // Assuming /api/templates/{id}/
    get: async (id: number): Promise<AxiosResponse<Template>> => {
       // Example: maps to ${API_BASE_URL}/api/templates/{id}/
      return await apiClient.get(`/templates/${id}/`);
    },
    // Assuming your backend has an endpoint like /api/templates/{id}/preview/
    // And it returns data structured like a Salon object with sample data
    getPreviewData: async (id: number): Promise<AxiosResponse<Salon>> => {
      // Example: maps to ${API_BASE_URL}/api/templates/{id}/preview/
      return await apiClient.get(`/templates/${id}/preview/`);
    },
  },

  payments: {
    // Assuming /api/payments/create-intent/
    createPaymentIntent: async (data: PaymentIntentRequest): Promise<AxiosResponse<PaymentIntentResponse>> => {
      // Example: maps to ${API_BASE_URL}/api/payments/create-intent/
      return await apiClient.post('/payments/create-intent/', data);
    },
    // Assuming /api/payments/create-subscription/
    createSubscription: async (data: SubscriptionRequest): Promise<AxiosResponse<SubscriptionResponse>> => {
      // Example: maps to ${API_BASE_URL}/api/payments/create-subscription/
      return await apiClient.post('/payments/create-subscription/', data);
    },
    // Assuming /api/payments/plans/
    listPlans: async (params?: {
      limit?: number;
      offset?: number;
    }): Promise<AxiosResponse<PaginatedResponse<SubscriptionPlan>>> => {
      // Example: maps to ${API_BASE_URL}/api/payments/plans/
      return await apiClient.get('/payments/plans/', { params });
    },
    // Assuming /api/payments/plans/{id}/
    getPlan: async (id: number): Promise<AxiosResponse<SubscriptionPlan>> => {
      // Example: maps to ${API_BASE_URL}/api/payments/plans/{id}/
      return await apiClient.get(`/payments/plans/${id}/`);
    },
  },

  core: {
    // Assuming /api/core/stats/
    getStats: async (): Promise<AxiosResponse<Stats>> => {
      // Example: maps to ${API_BASE_URL}/api/core/stats/
      return await apiClient.get('/core/stats/');
    },
  },

  tracking: {
    // Assuming /api/tracking/overview/
    getReportOverview: async (params?: {
      start_date?: string; // ISO date string
      end_date?: string; // ISO date string
    }): Promise<AxiosResponse<ReportOverviewData>> => {
      // Example: maps to ${API_BASE_URL}/api/tracking/overview/
      return await apiClient.get('/tracking/overview/', { params });
    },
  },

  iframe: {
    // Get businesses grouped by type
    getTypeBusinesses: async () => {
      return apiClient.get<TypeBusiness[]>('/businesses/types-businesses/');
    },

    // Get all businesses (paginated)
    getBusinesses: async (params?: {
      search?: string;
      ordering?: string;
      limit?: number;
      offset?: number;
    }) => {
      return await apiClient.get('/businesses/businesses/', { params });
    },

    // Get a specific business by slug
    getBusiness: async (slug: string) => {
      return await apiClient.get(`/businesses/businesses/${slug}/`);
    },

    // Create a new business
    createBusiness: async (data: {
      name: string;
      description: string;
      url: string;
      type: number;
      contact_email?: string;
      contact_phone?: string;
      address?: string;
      image?: File;
    }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as any);
        }
      });
      return await apiClient.post('/businesses/businesses/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    // Update a business
    updateBusiness: async (slug: string, data: Partial<Business>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as any);
        }
      });
      return await apiClient.patch(`/businesses/businesses/${slug}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    // Delete a business
    deleteBusiness: async (slug: string) => {
      return await apiClient.delete(`/businesses/businesses/${slug}/`);
    },

    // Claim a business
    claimBusiness: async (slug: string) => {
      return await apiClient.post(`/businesses/businesses/${slug}/claim/`);
    },

    // Unclaim a business
    unclaimBusiness: async (slug: string) => {
      return await apiClient.post(`/businesses/businesses/${slug}/unclaim/`);
    },

    // Check business ownership
    checkBusinessOwnership: async (slug: string) => {
      return await apiClient.get(`/businesses/businesses/${slug}/check-ownership/`);
    },

    // Get user's businesses
    getUserBusinesses: async () => {
      return await apiClient.get('/businesses/user/businesses/');
    },

    // Get all business types (paginated)
    getTypes: async (params?: {
      search?: string;
      ordering?: string;
      limit?: number;
      offset?: number;
    }) => {
      return await apiClient.get('/businesses/types/', { params });
    },

    // Get a specific type by slug
    getType: async (slug: string) => {
      return await apiClient.get(`/businesses/types/${slug}/`);
    },
  },

  business: {
    // Assuming /api/businesses/
    list: async (params?: {
      limit?: number;
      offset?: number;
      search?: string; // Add search parameter
      ordering?: string; // Add ordering parameter
    }): Promise<AxiosResponse<PaginatedResponse<Business>>> => {
      // Example: maps to ${API_BASE_URL}/api/businesses/
      return await apiClient.get('/businesses/', { params });
    },
    // Assuming /api/businesses/{id}/
    get: async (id: number): Promise<AxiosResponse<Business>> => {
      // Example: maps to ${API_BASE_URL}/api/businesses/{id}/
      return await apiClient.get(`/businesses/${id}/`);
    },
    // Assuming /api/businesses/
    create: async (data: Business): Promise<AxiosResponse<Business>> => {
      // Example: maps to ${API_BASE_URL}/api/businesses/
      return await apiClient.post('/businesses/', data);
    },
    // Assuming /api/businesses/{id}/
    update: async (id: number, data: Partial<Business>): Promise<AxiosResponse<Business>> => {
      // Example: maps to ${API_BASE_URL}/api/businesses/{id}/
      return await apiClient.patch(`/businesses/${id}/`, data);
    },
    // Assuming /api/businesses/{id}/
    delete: async (id: number): Promise<AxiosResponse<void>> => {
      // Example: maps to ${API_BASE_URL}/api/businesses/{id}/
      return await apiClient.delete(`/businesses/${id}/`);
    },
  },

  type: {
    // Assuming /api/types/
    list: async (params?: {
      limit?: number;
      offset?: number;
      search?: string; // Add search parameter
      ordering?: string; // Add ordering parameter
    }): Promise<AxiosResponse<PaginatedResponse<Type>>> => {
      // Example: maps to ${API_BASE_URL}/api/types/
      return await apiClient.get('/types/', { params });
    },
    // Assuming /api/types/{id}/
    get: async (id: number): Promise<AxiosResponse<Type>> => {
      // Example: maps to ${API_BASE_URL}/api/types/{id}/
      return await apiClient.get(`/types/${id}/`);
    },
    // Assuming /api/types/
    create: async (data: Type): Promise<AxiosResponse<Type>> => {
      // Example: maps to ${API_BASE_URL}/api/types/
      return await apiClient.post('/types/', data);
    },
    // Assuming /api/types/{id}/
    update: async (id: number, data: Partial<Type>): Promise<AxiosResponse<Type>> => {
      // Example: maps to ${API_BASE_URL}/api/types/{id}/
      return await apiClient.patch(`/types/${id}/`, data);
    },
    // Assuming /api/types/{id}/
    delete: async (id: number): Promise<AxiosResponse<void>> => {
      // Example: maps to ${API_BASE_URL}/api/types/{id}/
      return await apiClient.delete(`/types/${id}/`);
    },
  },

  typeBusiness: {
    // Assuming /api/type-businesses/
    list: async (params?: {
      limit?: number;
      offset?: number;
      search?: string; // Add search parameter
      ordering?: string; // Add ordering parameter
    }): Promise<AxiosResponse<PaginatedResponse<TypeBusiness>>> => {
      // Example: maps to ${API_BASE_URL}/api/type-businesses/
      return await apiClient.get('/type-businesses/', { params });
    },
    // Assuming /api/type-businesses/{id}/
    get: async (id: number): Promise<AxiosResponse<TypeBusiness>> => {
      // Example: maps to ${API_BASE_URL}/api/type-businesses/{id}/
      return await apiClient.get(`/type-businesses/${id}/`);
    },
    // Assuming /api/type-businesses/
    create: async (data: TypeBusiness): Promise<AxiosResponse<TypeBusiness>> => {
      // Example: maps to ${API_BASE_URL}/api/type-businesses/
      return await apiClient.post('/type-businesses/', data);
    },
    // Assuming /api/type-businesses/{id}/
    update: async (id: number, data: Partial<TypeBusiness>): Promise<AxiosResponse<TypeBusiness>> => {
      // Example: maps to ${API_BASE_URL}/api/type-businesses/{id}/
      return await apiClient.patch(`/type-businesses/${id}/`, data);
    },
    // Assuming /api/type-businesses/{id}/
    delete: async (id: number): Promise<AxiosResponse<void>> => {
      // Example: maps to ${API_BASE_URL}/api/type-businesses/{id}/
      return await apiClient.delete(`/type-businesses/${id}/`);
    },
  },
};

// Export the helpers
export { setAuthTokens, clearAuthTokens };