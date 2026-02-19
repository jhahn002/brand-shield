"use client";
import { useState, useEffect } from "react";

/**
 * Simple data-fetching hook.
 * Currently returns mock data with a simulated delay.
 *
 * To connect to FastAPI backend, replace the setTimeout
 * with: const res = await fetch(`/api/v1/${endpoint}`);
 */
export function useApi(mockData, delay = 200) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return { data, loading, error };
}

/**
 * Mounted animation hook — returns true after first render.
 * Used for entrance animations across all pages.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}
