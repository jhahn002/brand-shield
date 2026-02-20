/**
 * Brand Shield API Client
 * Centralizes all backend API calls.
 * Falls back to mock data in development if API is unreachable.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}/api/v1${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail || `API error ${res.status}`, res.status);
  }

  return res.json();
}

// ── Dashboard ─────────────────────────────────────────────────
export async function getDashboard(brandId) {
  return request(`/dashboard/${brandId}`);
}

export async function listBrandsDashboard(orgId) {
  return request(`/dashboard?org_id=${orgId}`);
}

// ── Brands ────────────────────────────────────────────────────
export async function listBrands(orgId) {
  return request(`/brands?org_id=${orgId}`);
}

export async function getBrand(brandId) {
  return request(`/brands/${brandId}`);
}

export async function createBrand(orgId, data) {
  return request(`/brands?org_id=${orgId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Threats ───────────────────────────────────────────────────
export async function listThreats(brandId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.min_severity) params.set('min_severity', filters.min_severity);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/threats/by-brand/${brandId}${qs}`);
}

export async function getThreat(threatId) {
  return request(`/threats/${threatId}`);
}

export async function getThreatEvidence(threatId) {
  return request(`/threats/${threatId}/evidence`);
}

export async function dismissThreat(threatId, reason) {
  return request(`/threats/${threatId}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function initiateTakedown(threatId) {
  return request(`/threats/${threatId}/takedown`, { method: 'POST' });
}

// ── Keywords ──────────────────────────────────────────────────
export async function listKeywords(brandId) {
  return request(`/brands/${brandId}/keywords`);
}

export async function addKeywords(brandId, terms) {
  return request(`/brands/${brandId}/keywords`, {
    method: 'POST',
    body: JSON.stringify({ terms }),
  });
}

export async function updateKeyword(keywordId, data) {
  const params = new URLSearchParams(data);
  return request(`/keywords/${keywordId}?${params.toString()}`, {
    method: 'PUT',
  });
}

// ── Setup (quick-start) ──────────────────────────────────────
export async function quickStart(brandName, brandDomain) {
  return request('/setup/quick-start-sync', {
    method: 'POST',
    body: JSON.stringify({
      brand_name: brandName,
      brand_domain: brandDomain,
    }),
  });
}
