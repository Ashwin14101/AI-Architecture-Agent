const isLocalHost = typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);
const DEFAULT_API_URL = isLocalHost
  ? 'http://localhost:3000/api'
  : 'https://ai-architecture-agent-api-live.onrender.com/api';

export const BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
export const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');

// Detect whether a real backend is reachable. On a remote static host
// (e.g. Render) with no VITE_API_URL configured, localhost points at the
// visitor's own machine, so we must skip network auth and use demo mode.
export const HAS_BACKEND = true;

// Hard timeout so a missing/slow backend can never hang the UI.
const REQUEST_TIMEOUT_MS = 4000;

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth endpoints
  async register(username, email, password) {
    const res = await request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
    return res.json();
  },

  async login(email, password) {
    const res = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
    const data = await res.json();
    localStorage.setItem('token', data.accessToken);
    return data;
  },

  async getMe() {
    const res = await request(`${BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  // Project endpoints
  async getProjects() {
    const res = await request(`${BASE_URL}/projects`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(name, description) {
    const res = await request(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async getProject(id) {
    const res = await request(`${BASE_URL}/projects/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch project details');
    return res.json();
  },

  // Chat endpoints
  async getMessages(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/messages`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  // Document upload
  async uploadDocument(projectId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await request(`${BASE_URL}/projects/${projectId}/documents`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  async getDocuments(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/documents`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  // Run pipeline analysis
  async startAnalysis(projectId) {
    const res = await request(`${BASE_URL}/analysis/${projectId}/start`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start analysis');
    return res.json();
  },

  async cancelAnalysis(projectId) {
    const res = await request(`${BASE_URL}/analysis/${projectId}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to cancel analysis');
    return res.json();
  },

  // Output fetching
  async getArchitecture(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/architecture`, {
      headers: getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch architecture');
    return res.json();
  },

  async getDatabaseSchema(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/architecture/database`, {
      headers: getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch database schema');
    return res.json();
  },

  async getApis(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/architecture/apis`, {
      headers: getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch APIs');
    return res.json();
  },

  async getCloudMapping(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/cloud-mapping`, {
      headers: getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch cloud mapping');
    return res.json();
  },

  async getTerraform(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/terraform`, {
      headers: getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch Terraform code');
    return res.json();
  },

  async getReviews(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/reviews`, {
      headers: getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  async getDocumentation(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/documentation`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch documentation');
    return res.json();
  },

  async saveDocumentation(projectId, markdown) {
    const res = await request(`${BASE_URL}/projects/${projectId}/documentation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify({ markdown }),
    });
    if (!res.ok) throw new Error('Failed to save documentation');
    return res.json();
  },

  async saveArchitecture(projectId, architectureData, terraformCode) {
    const res = await request(`${BASE_URL}/projects/${projectId}/architecture`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify({ architectureData, terraformCode }),
    });
    if (!res.ok) throw new Error('Failed to save architecture updates');
    return res.json();
  },

  async getVersions(projectId) {
    const res = await request(`${BASE_URL}/projects/${projectId}/versions`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch project versions');
    return res.json();
  },
};
