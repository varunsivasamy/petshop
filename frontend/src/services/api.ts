/**
 * API Service Client for PetShop Backend.
 * Handles JWT token storage, automatic token refreshing, and error handling.
 */

const BASE_URL = 'http://127.0.0.1:8000';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'CUSTOMER' | 'SHOP_OWNER' | 'ADMIN';
  is_verified: boolean;
  is_shop_owner: boolean;
  phone_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  avatar?: string;
}

export interface PetSummary {
  id: number;
  name: string;
  category: number;
  category_name: string;
  breed?: number;
  breed_name?: string;
  gender: string;
  size: string;
  age_months: number;
  price: string;
  is_vaccinated: boolean;
  is_available: boolean;
  is_featured: boolean;
  primary_image?: {
    id: number;
    url: string;
    content_hash: string;
  };
}

export interface PetDetail extends PetSummary {
  description: string;
  is_neutered: boolean;
  is_microchipped: boolean;
  health_notes: string;
  stock_quantity: number;
  views_count: number;
  owner: User;
  images: Array<{
    id: number;
    image_url: string;
    is_primary: boolean;
    content_hash: string;
  }>;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  pet_count: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_email?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: string;
  recipient_name: string;
  items_count?: number;
  items?: any[];
  tracking_number?: string;
  created_at: string;
}

class ApiService {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string> || {}),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    let response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized: Attempt token refresh
    if (response.status === 401 && localStorage.getItem('refresh_token')) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      const error: any = new Error(errorData.detail || JSON.stringify(errorData));
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) return false;

      const res = await fetch(`${BASE_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
        return true;
      }
      this.logout();
      return false;
    } catch {
      this.logout();
      return false;
    }
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
  }

  // --- Auth APIs ---
  async login(email: string, password: string) {
    const data = await this.request<any>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user_profile', JSON.stringify(data.user));
    return data;
  }

  async register(payload: any) {
    return this.request<any>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verify(email: string, code: string) {
    const data = await this.request<any>('/api/auth/verify/', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    if (data.data && data.data.access) {
      localStorage.setItem('access_token', data.data.access);
      if (data.data.refresh) localStorage.setItem('refresh_token', data.data.refresh);
    }
    return data;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/api/auth/profile/');
  }

  // --- Pets APIs ---
  async listPets(params: Record<string, any> = {}): Promise<PetSummary[]> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    const res = await this.request<any>(`/api/pets/catalog/?${query.toString()}`);
    return res.results || res;
  }

  async getPet(id: number): Promise<PetDetail> {
    return this.request<PetDetail>(`/api/pets/catalog/${id}/`);
  }

  async createPet(formData: FormData): Promise<PetDetail> {
    return this.request<PetDetail>('/api/pets/catalog/', {
      method: 'POST',
      body: formData,
    });
  }

  async updatePet(id: number, data: any): Promise<PetDetail> {
    return this.request<PetDetail>(`/api/pets/catalog/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePet(id: number): Promise<void> {
    return this.request<void>(`/api/pets/catalog/${id}/`, {
      method: 'DELETE',
    });
  }

  async listCategories(): Promise<Category[]> {
    const res = await this.request<any>('/api/pets/categories/');
    return res.results || res;
  }

  // --- Orders APIs ---
  async checkout(payload: any): Promise<Order> {
    return this.request<Order>('/api/orders/checkout/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getCustomerOrders(): Promise<Order[]> {
    const res = await this.request<any>('/api/orders/my-orders/');
    return res.results || res;
  }

  async getAdminOrders(): Promise<Order[]> {
    const res = await this.request<any>('/api/orders/admin/all/');
    return res.results || res;
  }

  async updateOrderStatus(orderId: number, status: string, trackingNumber?: string): Promise<Order> {
    return this.request<Order>(`/api/orders/admin/${orderId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status, tracking_number: trackingNumber }),
    });
  }

  // --- Analytics APIs ---
  async getDashboardAnalytics(): Promise<any> {
    return this.request<any>('/api/analytics/dashboard/');
  }
}

export const api = new ApiService();
