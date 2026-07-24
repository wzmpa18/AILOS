// ============================================================
// src/api/client.js
// API 客户端 — 统一请求封装 + Token 自动附加
// ============================================================
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('ailos_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('ailos_token', token);
    } else {
      localStorage.removeItem('ailos_token');
    }
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = { method, headers };
    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, config);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    return data.data;
  }

  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }
  delete(path) { return this.request('DELETE', path); }
}

export const api = new ApiClient();
export default api;