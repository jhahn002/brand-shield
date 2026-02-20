'use client';
import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';

/**
 * Generic fetch hook with loading/error states.
 */
function useApiCall(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      console.error('API error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Dashboard data for a specific brand.
 */
export function useDashboard(brandId) {
  return useApiCall(
    () => brandId ? api.getDashboard(brandId) : Promise.resolve(null),
    [brandId]
  );
}

/**
 * List all brands for an org (for brand selector).
 */
export function useBrands(orgId) {
  return useApiCall(
    () => orgId ? api.listBrandsDashboard(orgId) : Promise.resolve(null),
    [orgId]
  );
}

/**
 * Threats list for a brand.
 */
export function useThreats(brandId, filters = {}) {
  return useApiCall(
    () => brandId ? api.listThreats(brandId, filters) : Promise.resolve([]),
    [brandId, JSON.stringify(filters)]
  );
}

/**
 * Single threat with evidence.
 */
export function useThreat(threatId) {
  const threat = useApiCall(
    () => threatId ? api.getThreat(threatId) : Promise.resolve(null),
    [threatId]
  );
  const evidence = useApiCall(
    () => threatId ? api.getThreatEvidence(threatId) : Promise.resolve([]),
    [threatId]
  );
  return {
    threat: threat.data,
    evidence: evidence.data,
    loading: threat.loading || evidence.loading,
    error: threat.error || evidence.error,
    refetch: () => { threat.refetch(); evidence.refetch(); },
  };
}

/**
 * Keywords for a brand.
 */
export function useKeywords(brandId) {
  return useApiCall(
    () => brandId ? api.listKeywords(brandId) : Promise.resolve([]),
    [brandId]
  );
}
